-- Expand marketplace_platforms per country: local classifieds only where possible.
-- OAuth-capable slugs must match src/lib/platforms/registry (avito, vk_marketplace, ebay, olx, facebook_marketplace).

insert into public.marketplace_platforms
  (country_code, name, slug, is_api_available, posting_method, description, sort_order)
values
  -- United States
  ('US', 'eBay', 'ebay', true, 'api', 'List nationally with shipping or local pickup', 1),
  ('US', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Local pickup ~30 mi — copy template on web', 2),
  ('US', 'OfferUp', 'offerup', false, 'template', 'Local buyer app', 3),
  ('US', 'Craigslist', 'craigslist', false, 'template', 'City-based free ads', 4),
  ('US', 'Mercari', 'mercari', false, 'template', 'Ship nationwide', 5),
  ('US', 'Poshmark', 'poshmark', false, 'template', 'Fashion resale', 6),
  ('US', 'Nextdoor', 'nextdoor', false, 'template', 'Very local neighborhood', 7),

  -- Russia (no Western OLX UA / US-centric apps as primary)
  ('RU', 'Авито', 'avito', true, 'api', 'Крупнейшая доска РФ — город и доставка', 1),
  ('RU', 'VK Маркет', 'vk_marketplace', true, 'api', 'ВКонтакте — локально и по стране', 2),
  ('RU', 'Юла', 'yula', false, 'template', 'Объявления Mail.ru', 3),
  ('RU', 'Ozon «Из рук в руки»', 'ozon_c2c', false, 'template', 'Вторичный рынок в приложении Ozon', 4),
  ('RU', 'Фарпост / доски ДВ', 'farpost', false, 'template', 'Региональные доски (Дальний Восток и др.)', 5),

  -- Kazakhstan (Avito operates; VK common; local boards)
  ('KZ', 'Авито', 'avito', true, 'api', 'Объявления KZ', 1),
  ('KZ', 'VK Маркет', 'vk_marketplace', true, 'api', 'Продажи через VK', 2),
  ('KZ', 'OLX.kz', 'olx_kz', false, 'template', 'Локальная доска OLX', 3),
  ('KZ', 'Колёса (авто)', 'kolesa', false, 'template', 'Если продаёшь авто', 4),
  ('KZ', 'Krisha.kz (недвижимость)', 'krisha', false, 'template', 'Если сдаёшь/продаёшь жильё', 5),

  -- Ukraine (OLX OAuth targets olx.ua stack)
  ('UA', 'OLX', 'olx', true, 'api', 'Оголошення UA', 1),
  ('UA', 'Prom.ua', 'prom_ua', false, 'template', 'Маркетплейс для бізнесу', 2),
  ('UA', 'Shafa.ua', 'shafa_ua', false, 'template', 'Одяг та вживані речі', 3),
  ('UA', 'Bigl.ua', 'bigl_ua', false, 'template', 'Онлайн-оголошення', 4),
  ('UA', 'Ria.com (нерухомість)', 'ria_realty', false, 'template', 'Якщо нерухомість', 5),

  -- Poland
  ('PL', 'OLX.pl', 'olx_pl', false, 'template', 'Największa tablica', 1),
  ('PL', 'Allegro Lokalnie', 'allegro', false, 'template', 'Lokalne ogłoszenia', 2),
  ('PL', 'Vinted', 'vinted', false, 'template', 'Ubrania i dodatki', 3),
  ('PL', 'eBay', 'ebay', true, 'api', 'Wysyłka międzynarodowa', 4),
  ('PL', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Lokalnie', 5),

  -- Germany
  ('DE', 'Kleinanzeigen', 'kleinanzeigen', false, 'template', 'Formerly eBay Kleinanzeigen — local first', 1),
  ('DE', 'Vinted', 'vinted', false, 'template', 'Kleidermarkt', 2),
  ('DE', 'eBay', 'ebay', true, 'api', 'Deutschland & EU Versand', 3),
  ('DE', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Nachbarschaft', 4),
  ('DE', 'Locanto', 'locanto_de', false, 'template', 'Kostenlose Anzeigen', 5),

  -- France
  ('FR', 'Leboncoin', 'leboncoin', false, 'template', 'Petites annonces nationales', 1),
  ('FR', 'Vinted', 'vinted_fr', false, 'template', 'Mode seconde main', 2),
  ('FR', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Local', 3),
  ('FR', 'eBay', 'ebay', true, 'api', 'France & shipping', 4),

  -- United Kingdom
  ('GB', 'Gumtree', 'gumtree', false, 'template', 'Local classifieds UK', 1),
  ('GB', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Local pickup', 2),
  ('GB', 'Vinted', 'vinted_gb', false, 'template', 'Pre-loved fashion', 3),
  ('GB', 'eBay', 'ebay', true, 'api', 'UK & postage', 4),
  ('GB', 'Shpock', 'shpock', false, 'template', 'Boot-sale style app', 5),

  -- Spain
  ('ES', 'Wallapop', 'wallapop', false, 'template', 'Hyperlocal second-hand', 1),
  ('ES', 'Milanuncios', 'milanuncios', false, 'template', 'Clásicos anuncios por provincia', 2),
  ('ES', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Barrio', 3),
  ('ES', 'Vinted', 'vinted_es', false, 'template', 'Ropa', 4),
  ('ES', 'eBay', 'ebay', true, 'api', 'Envío nacional', 5),

  -- Italy
  ('IT', 'Subito', 'subito', false, 'template', 'Tutta Italia', 1),
  ('IT', 'Vinted', 'vinted_it', false, 'template', 'Abbigliamento', 2),
  ('IT', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Locale', 3),
  ('IT', 'eBay', 'ebay', true, 'api', 'Spedizione', 4),

  -- Netherlands
  ('NL', 'Marktplaats', 'marktplaats', false, 'template', 'NL #1 classifieds', 1),
  ('NL', 'Vinted', 'vinted_nl', false, 'template', 'Kleding', 2),
  ('NL', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Lokaal', 3),
  ('NL', 'eBay', 'ebay', true, 'api', 'Verzending EU', 4),

  -- Belgium
  ('BE', '2dehands / 2ememain', '2dehands', false, 'template', 'BE second-hand', 1),
  ('BE', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Local FR/NL', 2),
  ('BE', 'Vinted', 'vinted_be', false, 'template', 'Mode', 3),
  ('BE', 'eBay', 'ebay', true, 'api', 'EU shipping', 4),

  -- Portugal
  ('PT', 'OLX Portugal', 'olx_pt', false, 'template', 'Classificados PT', 1),
  ('PT', 'CustoJusto', 'custojusto', false, 'template', 'Anúncios gratuitos', 2),
  ('PT', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Local', 3),
  ('PT', 'eBay', 'ebay', true, 'api', 'Envio', 4),

  -- Canada
  ('CA', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Hyperlocal', 1),
  ('CA', 'Kijiji', 'kijiji', false, 'template', 'City-based classifieds', 2),
  ('CA', 'eBay', 'ebay', true, 'api', 'Canada shipping', 3),
  ('CA', 'VarageSale', 'varagesale', false, 'template', 'Neighborhood sales', 4),

  -- Australia
  ('AU', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Local', 1),
  ('AU', 'Gumtree AU', 'gumtree_au', false, 'template', 'Classifieds', 2),
  ('AU', 'eBay', 'ebay', true, 'api', 'Nationwide postage', 3),
  ('AU', 'Carousell', 'carousell_au', false, 'template', 'App resale', 4),

  -- Austria
  ('AT', 'Willhaben', 'willhaben', false, 'template', 'AT #1 Kleinanzeigen', 1),
  ('AT', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Lokal', 2),
  ('AT', 'eBay', 'ebay', true, 'api', 'Versand', 3),

  -- Switzerland
  ('CH', 'Tutti.ch', 'tutti_ch', false, 'template', 'DE/FR/IT regions', 1),
  ('CH', 'Ricardo', 'ricardo_ch', false, 'template', 'Auctions & fixed price', 2),
  ('CH', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Local', 3),

  -- Sweden
  ('SE', 'Blocket', 'blocket', false, 'template', 'Sweden-wide with shipping options', 1),
  ('SE', 'Tradera', 'tradera', false, 'template', 'Auction & buy now', 2),
  ('SE', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Local', 3),

  -- Norway
  ('NO', 'Finn.no', 'finn_no', false, 'template', 'National marketplace', 1),
  ('NO', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Lokal', 2),

  -- Denmark
  ('DK', 'DBA', 'dba_dk', false, 'template', 'Den Blå Avis', 1),
  ('DK', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Lokalt', 2),

  -- Czechia
  ('CZ', 'Bazoš', 'bazos_cz', false, 'template', 'Inzerce zdarma', 1),
  ('CZ', 'Sbazar', 'sbazar_cz', false, 'template', 'Seznam small ads', 2),
  ('CZ', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Lokálně', 3),
  ('CZ', 'Vinted', 'vinted_cz', false, 'template', 'Oblečení', 4)

on conflict (country_code, slug) do update set
  name = excluded.name,
  is_api_available = excluded.is_api_available,
  posting_method = excluded.posting_method,
  description = excluded.description,
  sort_order = excluded.sort_order;
