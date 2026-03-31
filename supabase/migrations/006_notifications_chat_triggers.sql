-- Notifications: insert own rows + chat message triggers + optional hot-buyer signal
-- Realtime: enable in Dashboard → Database → Replication for `notifications` if not already.

-- Allow authenticated users to insert notifications for themselves (e.g. listing published from app)
create policy "Users can insert own notifications"
  on public.notifications for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Suggested AI reply for seller (negotiation MVP)
alter table public.chats
  add column if not exists pending_ai_suggestion jsonb default null;

comment on column public.chats.pending_ai_suggestion is 'Do4U draft reply for seller: { "text": string, "created_at": string }';

-- Notify recipient when a new human chat message is appended
create or replace function public.notify_on_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_len int;
  new_len int;
  last_msg jsonb;
  sender_type text;
  recipient uuid;
  listing_price numeric;
  raw_digits text;
  parsed numeric;
begin
  if tg_op = 'INSERT' then
    old_len := 0;
  else
    old_len := coalesce(jsonb_array_length(coalesce(old.messages, '[]'::jsonb)), 0);
  end if;
  new_len := coalesce(jsonb_array_length(coalesce(new.messages, '[]'::jsonb)), 0);
  if new_len <= old_len then
    return new;
  end if;

  last_msg := new.messages -> (new_len - 1);
  sender_type := last_msg ->> 'sender';
  if sender_type is null then
    return new;
  end if;

  -- Automated assistant messages: no duplicate ping
  if sender_type in ('do4u', 'claw') then
    return new;
  end if;

  if sender_type = 'buyer' then
    recipient := new.seller_id;
  elsif sender_type = 'seller' then
    recipient := new.buyer_id;
  else
    return new;
  end if;

  insert into public.notifications (user_id, type, title, message, data)
  values (
    recipient,
    'chat_message',
    case
      when sender_type = 'buyer' then 'Новое сообщение в чате'
      else 'Ответ по объявлению'
    end,
    left(coalesce(last_msg ->> 'text', ''), 240),
    jsonb_build_object('chat_id', new.id, 'listing_id', new.listing_id)
  );

  -- "Hot buyer": first long digit sequence in message strictly above listing price (heuristic)
  if sender_type = 'buyer' then
    select l.price into listing_price from public.listings l where l.id = new.listing_id limit 1;
    if listing_price is not null then
      raw_digits := (regexp_match(coalesce(last_msg ->> 'text', ''), '([0-9][0-9\s]{2,})'))[1];
      if raw_digits is not null then
        begin
          parsed := replace(raw_digits, ' ', '')::numeric;
          if parsed > listing_price then
            insert into public.notifications (user_id, type, title, message, data)
            values (
              recipient,
              'hot_buyer',
              'Горячий интерес к цене',
              format('В сообщении фигурирует сумма выше твоей цены (%s). Загляни в чат.', listing_price),
              jsonb_build_object('chat_id', new.id, 'listing_id', new.listing_id, 'parsed_offer', parsed)
            );
          end if;
        exception
          when others then
            null;
        end;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_chats_notify_message on public.chats;
create trigger trg_chats_notify_message
  after insert or update of messages on public.chats
  for each row
  execute function public.notify_on_chat_message();

-- Enable Realtime for `notifications` in Supabase Dashboard → Database → Publications,
-- or run: alter publication supabase_realtime add table public.notifications;
