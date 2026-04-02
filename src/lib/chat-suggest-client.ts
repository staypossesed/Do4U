import { toast } from "sonner";

export type ChatSuggestLocale = "ru" | "en";

export async function postChatSuggest(
  body: Record<string, unknown>,
  locale: ChatSuggestLocale
): Promise<Response> {
  const res = await fetch("/api/ai/chat-suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429) {
    toast.error(
      locale === "ru"
        ? "Слишком много запросов к AI. Подождите минуту и попробуйте снова."
        : "Too many AI requests. Wait a minute and try again."
    );
  }
  return res;
}
