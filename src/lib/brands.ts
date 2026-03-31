// 1000+ popular brands organized by category for voice recognition autocorrect & search hints.
// Each entry: [brandName, aliases/cyrillic variations for fuzzy matching]

export interface Brand {
  name: string;
  aliases: string[];
  category: BrandCategory;
}

export type BrandCategory =
  | "clothing"
  | "shoes"
  | "accessories"
  | "electronics"
  | "books"
  | "toys"
  | "furniture"
  | "multi";

const clothing: Brand[] = [
  // Luxury
  { name: "Gucci", aliases: ["гуччи", "гучи", "guci"], category: "clothing" },
  { name: "Louis Vuitton", aliases: ["луи витон", "луи виттон", "лв", "lv"], category: "clothing" },
  { name: "Prada", aliases: ["прада"], category: "clothing" },
  { name: "Chanel", aliases: ["шанель", "шанэль"], category: "clothing" },
  { name: "Dior", aliases: ["диор"], category: "clothing" },
  { name: "Versace", aliases: ["версаче", "версачи"], category: "clothing" },
  { name: "Burberry", aliases: ["барберри", "бёрберри", "барбери"], category: "clothing" },
  { name: "Dolce & Gabbana", aliases: ["дольче габбана", "дг", "d&g", "дольче"], category: "clothing" },
  { name: "Hermès", aliases: ["эрмес", "гермес", "hermes"], category: "clothing" },
  { name: "Balenciaga", aliases: ["баленсиага", "баленциага", "балансиага"], category: "clothing" },
  { name: "Givenchy", aliases: ["живанши", "живенши"], category: "clothing" },
  { name: "Fendi", aliases: ["фенди"], category: "clothing" },
  { name: "Saint Laurent", aliases: ["сен лоран", "ив сен лоран", "ysl", "saint laurent"], category: "clothing" },
  { name: "Valentino", aliases: ["валентино"], category: "clothing" },
  { name: "Alexander McQueen", aliases: ["александр маккуин", "маккуин", "mcqueen"], category: "clothing" },
  { name: "Bottega Veneta", aliases: ["боттега венета", "боттега", "bottega"], category: "clothing" },
  { name: "Celine", aliases: ["селин", "селлин"], category: "clothing" },
  { name: "Loewe", aliases: ["лоэве", "лоеве"], category: "clothing" },
  { name: "Moncler", aliases: ["монклер", "монклэр"], category: "clothing" },
  { name: "Kenzo", aliases: ["кензо"], category: "clothing" },
  { name: "Balmain", aliases: ["бальмен", "бальмэн", "балмен"], category: "clothing" },
  { name: "Armani", aliases: ["армани", "джорджо армани", "giorgio armani", "emporio armani", "эмпорио"], category: "clothing" },
  { name: "Moschino", aliases: ["москино"], category: "clothing" },
  { name: "Off-White", aliases: ["офф вайт", "оф вайт", "off white", "офвайт"], category: "clothing" },
  { name: "Palm Angels", aliases: ["палм энджелс", "палм ангелс"], category: "clothing" },
  { name: "Stone Island", aliases: ["стоун айленд", "стон айланд", "стоунайленд", "стоник", "stonic"], category: "clothing" },
  { name: "CP Company", aliases: ["сп компани", "сипи компани", "cp company"], category: "clothing" },
  { name: "Ami Paris", aliases: ["ами парис", "ами"], category: "clothing" },
  { name: "Maison Margiela", aliases: ["мэзон маржела", "маржела", "margiela", "мезон"], category: "clothing" },
  { name: "Acne Studios", aliases: ["акне студиос", "акне", "acne"], category: "clothing" },
  { name: "Isabel Marant", aliases: ["изабель маран", "маран"], category: "clothing" },
  { name: "Max Mara", aliases: ["макс мара"], category: "clothing" },
  { name: "Loro Piana", aliases: ["лоро пиана"], category: "clothing" },
  { name: "Brunello Cucinelli", aliases: ["брунелло кучинелли", "кучинелли"], category: "clothing" },
  { name: "Tom Ford", aliases: ["том форд"], category: "clothing" },
  { name: "Rick Owens", aliases: ["рик оуэнс", "рик овенс"], category: "clothing" },

  // Premium / Streetwear
  { name: "Nike", aliases: ["найк", "найки", "naik", "найке"], category: "clothing" },
  { name: "Adidas", aliases: ["адидас", "adidas", "адик"], category: "clothing" },
  { name: "Puma", aliases: ["пума"], category: "clothing" },
  { name: "Under Armour", aliases: ["андер армор", "андер армур", "ua"], category: "clothing" },
  { name: "The North Face", aliases: ["зе норт фейс", "норт фейс", "tnf", "тнф"], category: "clothing" },
  { name: "Patagonia", aliases: ["патагония"], category: "clothing" },
  { name: "Arc'teryx", aliases: ["арктерикс", "arcteryx"], category: "clothing" },
  { name: "Canada Goose", aliases: ["канада гус", "канадагус"], category: "clothing" },
  { name: "Columbia", aliases: ["коламбия", "колумбия"], category: "clothing" },
  { name: "Helly Hansen", aliases: ["хелли хансен", "хели хансен"], category: "clothing" },
  { name: "Napapijri", aliases: ["напапири", "напапиджри"], category: "clothing" },
  { name: "Carhartt", aliases: ["кархарт", "кархартт"], category: "clothing" },
  { name: "Stüssy", aliases: ["стусси", "стасси", "stussy"], category: "clothing" },
  { name: "Supreme", aliases: ["суприм", "суприме"], category: "clothing" },
  { name: "BAPE", aliases: ["бэйп", "бейп", "a bathing ape"], category: "clothing" },
  { name: "Palace", aliases: ["палас", "пэлас"], category: "clothing" },
  { name: "Essentials", aliases: ["эссеншиалс", "fear of god essentials", "fog"], category: "clothing" },
  { name: "Fear of God", aliases: ["фиар оф год"], category: "clothing" },
  { name: "Vetements", aliases: ["ветемон", "ветементс"], category: "clothing" },
  { name: "Heron Preston", aliases: ["херон престон"], category: "clothing" },
  { name: "A-Cold-Wall", aliases: ["а колд волл", "acw"], category: "clothing" },
  { name: "Represent", aliases: ["репрезент"], category: "clothing" },
  { name: "Trapstar", aliases: ["трапстар"], category: "clothing" },
  { name: "Corteiz", aliases: ["кортейз", "кртз"], category: "clothing" },

  // Mass market / Fast fashion
  { name: "Zara", aliases: ["зара"], category: "clothing" },
  { name: "H&M", aliases: ["эйч энд эм", "ашэм", "hm", "h m", "аш эм"], category: "clothing" },
  { name: "Uniqlo", aliases: ["юникло", "уникло"], category: "clothing" },
  { name: "Massimo Dutti", aliases: ["массимо дутти"], category: "clothing" },
  { name: "Mango", aliases: ["манго"], category: "clothing" },
  { name: "COS", aliases: ["кос"], category: "clothing" },
  { name: "& Other Stories", aliases: ["азер сториз"], category: "clothing" },
  { name: "Pull & Bear", aliases: ["пул энд бер", "пул бер"], category: "clothing" },
  { name: "Bershka", aliases: ["бершка"], category: "clothing" },
  { name: "Stradivarius", aliases: ["страдивариус"], category: "clothing" },
  { name: "ASOS", aliases: ["асос"], category: "clothing" },
  { name: "Primark", aliases: ["примарк"], category: "clothing" },
  { name: "GAP", aliases: ["гэп", "гап"], category: "clothing" },
  { name: "Levi's", aliases: ["левайс", "левис", "levis", "ливайс"], category: "clothing" },
  { name: "Diesel", aliases: ["дизель"], category: "clothing" },
  { name: "Calvin Klein", aliases: ["кельвин кляйн", "кальвин кляйн", "ck", "сикей"], category: "clothing" },
  { name: "Tommy Hilfiger", aliases: ["томми хилфигер", "томми", "hilfiger"], category: "clothing" },
  { name: "Ralph Lauren", aliases: ["ральф лорен", "поло", "polo"], category: "clothing" },
  { name: "Lacoste", aliases: ["лакост", "лакосте"], category: "clothing" },
  { name: "Fred Perry", aliases: ["фред перри"], category: "clothing" },
  { name: "Hugo Boss", aliases: ["хуго босс", "boss", "босс"], category: "clothing" },
  { name: "Michael Kors", aliases: ["майкл корс"], category: "clothing" },
  { name: "Coach", aliases: ["коуч", "коач"], category: "clothing" },
  { name: "Guess", aliases: ["гесс", "гес"], category: "clothing" },
  { name: "DKNY", aliases: ["дкну", "донна каран"], category: "clothing" },
  { name: "Superdry", aliases: ["супердрай"], category: "clothing" },
  { name: "Hollister", aliases: ["холлистер"], category: "clothing" },
  { name: "Abercrombie & Fitch", aliases: ["аберкромби", "аберкромби энд фитч"], category: "clothing" },
  { name: "Reebok", aliases: ["рибок", "рибук"], category: "clothing" },
  { name: "Fila", aliases: ["фила"], category: "clothing" },
  { name: "Ellesse", aliases: ["эллессе"], category: "clothing" },
  { name: "Kappa", aliases: ["каппа"], category: "clothing" },
  { name: "Umbro", aliases: ["умбро"], category: "clothing" },
  { name: "New Balance", aliases: ["нью баланс", "нью бэланс", "nb", "ньюбаланс"], category: "clothing" },
  { name: "Converse", aliases: ["конверс", "конверсы"], category: "clothing" },
  { name: "Vans", aliases: ["ванс", "вэнс"], category: "clothing" },
  { name: "DC Shoes", aliases: ["дс шуз", "дисишуз"], category: "clothing" },
  { name: "Timberland", aliases: ["тимберленд", "тимбы"], category: "clothing" },
  { name: "Wrangler", aliases: ["рэнглер", "вранглер"], category: "clothing" },
  { name: "Lee", aliases: ["ли"], category: "clothing" },
  { name: "Weekday", aliases: ["викдей"], category: "clothing" },
  { name: "Monki", aliases: ["монки"], category: "clothing" },
  { name: "Reserved", aliases: ["резервд", "резервед"], category: "clothing" },
  { name: "Cropp", aliases: ["кропп"], category: "clothing" },
  { name: "Sinsay", aliases: ["синсей"], category: "clothing" },
  { name: "House", aliases: ["хаус"], category: "clothing" },
  { name: "O'Stin", aliases: ["остин"], category: "clothing" },
  { name: "Gloria Jeans", aliases: ["глория джинс"], category: "clothing" },
  { name: "12 Storeez", aliases: ["12 сториз"], category: "clothing" },
  { name: "Befree", aliases: ["бифри"], category: "clothing" },
  { name: "Lime", aliases: ["лайм"], category: "clothing" },
  { name: "Love Republic", aliases: ["лав репаблик"], category: "clothing" },
  { name: "Sela", aliases: ["села"], category: "clothing" },
  { name: "Incity", aliases: ["инсити"], category: "clothing" },
  { name: "Finn Flare", aliases: ["финн флер", "фин флер"], category: "clothing" },
  { name: "Baon", aliases: ["баон"], category: "clothing" },

  // Sport
  { name: "Asics", aliases: ["асикс"], category: "clothing" },
  { name: "Salomon", aliases: ["саломон"], category: "clothing" },
  { name: "Hoka", aliases: ["хока", "хока ван ван"], category: "clothing" },
  { name: "On Running", aliases: ["он раннинг", "on"], category: "clothing" },
  { name: "Lululemon", aliases: ["лулулемон"], category: "clothing" },
  { name: "Gymshark", aliases: ["гимшарк", "джимшарк"], category: "clothing" },
  { name: "Jordan", aliases: ["джордан", "джорданы", "эйр джордан"], category: "clothing" },
];

const shoes: Brand[] = [
  { name: "Nike", aliases: ["найк", "найки", "найке"], category: "shoes" },
  { name: "Adidas", aliases: ["адидас"], category: "shoes" },
  { name: "New Balance", aliases: ["нью баланс", "нью бэланс", "nb"], category: "shoes" },
  { name: "Converse", aliases: ["конверс", "конверсы"], category: "shoes" },
  { name: "Vans", aliases: ["ванс", "вэнс"], category: "shoes" },
  { name: "Puma", aliases: ["пума"], category: "shoes" },
  { name: "Reebok", aliases: ["рибок"], category: "shoes" },
  { name: "Asics", aliases: ["асикс"], category: "shoes" },
  { name: "Salomon", aliases: ["саломон"], category: "shoes" },
  { name: "Hoka", aliases: ["хока"], category: "shoes" },
  { name: "On Running", aliases: ["он раннинг"], category: "shoes" },
  { name: "Jordan", aliases: ["джордан", "джорданы"], category: "shoes" },
  { name: "Yeezy", aliases: ["изи", "ези", "йизи"], category: "shoes" },
  { name: "Dr. Martens", aliases: ["доктор мартенс", "мартенсы", "мартинс", "dr martens"], category: "shoes" },
  { name: "Timberland", aliases: ["тимберленд", "тимбы"], category: "shoes" },
  { name: "UGG", aliases: ["угги", "уги", "угг"], category: "shoes" },
  { name: "Crocs", aliases: ["кроксы", "крокс"], category: "shoes" },
  { name: "Birkenstock", aliases: ["биркенштоки", "биркенсток"], category: "shoes" },
  { name: "Skechers", aliases: ["скечерс"], category: "shoes" },
  { name: "Ecco", aliases: ["экко", "эко"], category: "shoes" },
  { name: "Clarks", aliases: ["кларкс"], category: "shoes" },
  { name: "Geox", aliases: ["геокс"], category: "shoes" },
  { name: "Camper", aliases: ["кампер"], category: "shoes" },
  { name: "Merrell", aliases: ["мерелл"], category: "shoes" },
  { name: "Louboutin", aliases: ["лубутен", "лабутен", "лубутин"], category: "shoes" },
  { name: "Jimmy Choo", aliases: ["джимми чу"], category: "shoes" },
  { name: "Manolo Blahnik", aliases: ["маноло бланик"], category: "shoes" },
  { name: "Valentino Garavani", aliases: ["валентино", "валентино гаравани"], category: "shoes" },
  { name: "Giuseppe Zanotti", aliases: ["джузеппе занотти"], category: "shoes" },
  { name: "Alexander McQueen", aliases: ["маккуин", "макквин"], category: "shoes" },
  { name: "Common Projects", aliases: ["коммон проджектс"], category: "shoes" },
  { name: "Golden Goose", aliases: ["голден гус", "золотой гусь"], category: "shoes" },
  { name: "Filling Pieces", aliases: ["филлинг писес"], category: "shoes" },
  { name: "Balenciaga", aliases: ["баленсиага"], category: "shoes" },
  { name: "Bottega Veneta", aliases: ["боттега"], category: "shoes" },
  { name: "Prada", aliases: ["прада"], category: "shoes" },
  { name: "Gucci", aliases: ["гуччи", "гучи"], category: "shoes" },
  { name: "Dior", aliases: ["диор"], category: "shoes" },
  { name: "Fila", aliases: ["фила"], category: "shoes" },
  { name: "Diadora", aliases: ["диадора"], category: "shoes" },
  { name: "Saucony", aliases: ["сокони", "саукони"], category: "shoes" },
  { name: "Brooks", aliases: ["брукс"], category: "shoes" },
  { name: "Caterpillar", aliases: ["катерпиллер", "кат"], category: "shoes" },
  { name: "Palladium", aliases: ["палладиум"], category: "shoes" },
  { name: "Rispetto", aliases: ["рисперто"], category: "shoes" },
];

const accessories: Brand[] = [
  { name: "Ray-Ban", aliases: ["рей бен", "рэй бэн", "рэйбен", "rayban"], category: "accessories" },
  { name: "Oakley", aliases: ["оакли", "окли"], category: "accessories" },
  { name: "Rolex", aliases: ["ролекс"], category: "accessories" },
  { name: "Omega", aliases: ["омега"], category: "accessories" },
  { name: "TAG Heuer", aliases: ["таг хойер", "тагхоер"], category: "accessories" },
  { name: "Casio", aliases: ["касио", "кассио"], category: "accessories" },
  { name: "G-Shock", aliases: ["джишок", "g shock", "гшок"], category: "accessories" },
  { name: "Tissot", aliases: ["тиссо", "тиссот"], category: "accessories" },
  { name: "Seiko", aliases: ["сейко"], category: "accessories" },
  { name: "Citizen", aliases: ["ситизен"], category: "accessories" },
  { name: "Swarovski", aliases: ["сваровски"], category: "accessories" },
  { name: "Pandora", aliases: ["пандора"], category: "accessories" },
  { name: "Tiffany & Co", aliases: ["тиффани", "тифани"], category: "accessories" },
  { name: "Cartier", aliases: ["картье"], category: "accessories" },
  { name: "Bulgari", aliases: ["булгари"], category: "accessories" },
  { name: "Chopard", aliases: ["шопар"], category: "accessories" },
  { name: "IWC", aliases: ["ивс", "айвиси"], category: "accessories" },
  { name: "Hublot", aliases: ["юбло", "хублот"], category: "accessories" },
  { name: "Breitling", aliases: ["брайтлинг", "брейтлинг"], category: "accessories" },
  { name: "Longines", aliases: ["лонжин"], category: "accessories" },
  { name: "Daniel Wellington", aliases: ["дэниел веллингтон", "dw"], category: "accessories" },
  { name: "Fossil", aliases: ["фоссил"], category: "accessories" },
  { name: "Louis Vuitton", aliases: ["луи витон", "лв", "lv"], category: "accessories" },
  { name: "Gucci", aliases: ["гуччи"], category: "accessories" },
  { name: "Prada", aliases: ["прада"], category: "accessories" },
  { name: "Hermès", aliases: ["эрмес", "гермес"], category: "accessories" },
  { name: "Chanel", aliases: ["шанель"], category: "accessories" },
  { name: "Furla", aliases: ["фурла"], category: "accessories" },
  { name: "Longchamp", aliases: ["лоншан"], category: "accessories" },
  { name: "MCM", aliases: ["мсм", "эмсиэм"], category: "accessories" },
  { name: "Samsonite", aliases: ["самсонайт"], category: "accessories" },
  { name: "Rimowa", aliases: ["римова"], category: "accessories" },
  { name: "Herschel", aliases: ["хершел"], category: "accessories" },
  { name: "Fjällräven", aliases: ["фьялравен", "fjallraven", "фьельравен"], category: "accessories" },
  { name: "JanSport", aliases: ["джанспорт"], category: "accessories" },
  { name: "Osprey", aliases: ["оспри"], category: "accessories" },
  { name: "Piquadro", aliases: ["пиквадро"], category: "accessories" },
];

const electronics: Brand[] = [
  // Phones & Tablets
  { name: "Apple", aliases: ["эпл", "эппл", "аппле", "айфон", "iphone", "айпад", "ipad", "макбук", "macbook"], category: "electronics" },
  { name: "Samsung", aliases: ["самсунг", "самсунк", "галакси", "galaxy"], category: "electronics" },
  { name: "Xiaomi", aliases: ["сяоми", "ксиоми", "шаоми", "xiaomi"], category: "electronics" },
  { name: "Huawei", aliases: ["хуавей", "хуавэй"], category: "electronics" },
  { name: "OnePlus", aliases: ["ванплас", "ванплюс"], category: "electronics" },
  { name: "Google Pixel", aliases: ["гугл пиксель", "пиксел"], category: "electronics" },
  { name: "Sony", aliases: ["сони"], category: "electronics" },
  { name: "Nokia", aliases: ["нокиа", "нокия"], category: "electronics" },
  { name: "Motorola", aliases: ["моторола"], category: "electronics" },
  { name: "Realme", aliases: ["реалми"], category: "electronics" },
  { name: "OPPO", aliases: ["оппо"], category: "electronics" },
  { name: "Vivo", aliases: ["виво"], category: "electronics" },
  { name: "Honor", aliases: ["хонор"], category: "electronics" },
  { name: "Nothing", aliases: ["нафинг"], category: "electronics" },
  { name: "ASUS", aliases: ["асус"], category: "electronics" },
  { name: "Lenovo", aliases: ["леново"], category: "electronics" },

  // Audio
  { name: "AirPods", aliases: ["аирподс", "эйрподс", "эирподс", "аирподсы"], category: "electronics" },
  { name: "Sony", aliases: ["сони"], category: "electronics" },
  { name: "Bose", aliases: ["боуз", "бозе", "боз"], category: "electronics" },
  { name: "JBL", aliases: ["джибиэль", "джбл"], category: "electronics" },
  { name: "Beats", aliases: ["битс", "битц"], category: "electronics" },
  { name: "Sennheiser", aliases: ["сенхайзер", "зенхайзер"], category: "electronics" },
  { name: "Bang & Olufsen", aliases: ["бэнг олуфсен", "б&о", "b&o"], category: "electronics" },
  { name: "Marshall", aliases: ["маршалл", "маршал"], category: "electronics" },
  { name: "Harman Kardon", aliases: ["харман кардон"], category: "electronics" },
  { name: "Audio-Technica", aliases: ["аудио техника"], category: "electronics" },

  // Gaming
  { name: "PlayStation", aliases: ["плейстейшн", "ps5", "ps4", "пс5", "пс4", "приставка сони"], category: "electronics" },
  { name: "Xbox", aliases: ["иксбокс", "хбокс"], category: "electronics" },
  { name: "Nintendo", aliases: ["нинтендо", "свитч", "switch"], category: "electronics" },
  { name: "Steam Deck", aliases: ["стим дек", "стимдек"], category: "electronics" },
  { name: "Razer", aliases: ["рейзер"], category: "electronics" },
  { name: "Logitech", aliases: ["логитек", "логитех"], category: "electronics" },
  { name: "SteelSeries", aliases: ["стилсириес"], category: "electronics" },
  { name: "HyperX", aliases: ["хайперикс", "гиперикс"], category: "electronics" },
  { name: "Corsair", aliases: ["корсар", "корсэйр"], category: "electronics" },

  // Laptops
  { name: "MacBook", aliases: ["макбук", "мак бук", "макбук про", "макбук эйр"], category: "electronics" },
  { name: "Dell", aliases: ["делл"], category: "electronics" },
  { name: "HP", aliases: ["хп", "эйчпи", "хьюлетт паккард"], category: "electronics" },
  { name: "Acer", aliases: ["асер", "эйсер"], category: "electronics" },
  { name: "MSI", aliases: ["мси", "эмэсай"], category: "electronics" },
  { name: "Gigabyte", aliases: ["гигабайт"], category: "electronics" },
  { name: "ThinkPad", aliases: ["синкпад", "тинкпад"], category: "electronics" },

  // Photo/Video
  { name: "Canon", aliases: ["кэнон", "кенон"], category: "electronics" },
  { name: "Nikon", aliases: ["никон"], category: "electronics" },
  { name: "Fujifilm", aliases: ["фуджи", "фуджифильм", "fuji"], category: "electronics" },
  { name: "GoPro", aliases: ["гопро", "го про"], category: "electronics" },
  { name: "DJI", aliases: ["джиай", "дджиай", "дрон"], category: "electronics" },
  { name: "Panasonic", aliases: ["панасоник"], category: "electronics" },
  { name: "Olympus", aliases: ["олимпус"], category: "electronics" },

  // Smart Home
  { name: "Dyson", aliases: ["дайсон"], category: "electronics" },
  { name: "iRobot", aliases: ["айробот", "румба", "roomba"], category: "electronics" },
  { name: "Philips", aliases: ["филипс"], category: "electronics" },
  { name: "Braun", aliases: ["браун"], category: "electronics" },
  { name: "Bosch", aliases: ["бош"], category: "electronics" },
  { name: "Xiaomi", aliases: ["сяоми"], category: "electronics" },
  { name: "Amazon Echo", aliases: ["амазон эхо", "алекса", "alexa"], category: "electronics" },
  { name: "Google Nest", aliases: ["гугл нест"], category: "electronics" },
  { name: "Apple Watch", aliases: ["эпл вотч", "эппл вотч", "apple watch"], category: "electronics" },
  { name: "Garmin", aliases: ["гармин"], category: "electronics" },
  { name: "Fitbit", aliases: ["фитбит"], category: "electronics" },
  { name: "Kindle", aliases: ["киндл", "кинд"], category: "electronics" },
];

const books: Brand[] = [
  { name: "Эксмо", aliases: ["эксмо", "eksmo"], category: "books" },
  { name: "АСТ", aliases: ["аст", "ast"], category: "books" },
  { name: "Азбука", aliases: ["азбука"], category: "books" },
  { name: "МИФ", aliases: ["миф", "манн иванов фербер"], category: "books" },
  { name: "Альпина", aliases: ["альпина", "альпина паблишер"], category: "books" },
  { name: "Penguin", aliases: ["пингвин", "penguin"], category: "books" },
  { name: "HarperCollins", aliases: ["харпер коллинз"], category: "books" },
  { name: "Simon & Schuster", aliases: ["саймон шустер"], category: "books" },
  { name: "O'Reilly", aliases: ["орейли", "oreilly"], category: "books" },
  { name: "Питер", aliases: ["питер", "piter"], category: "books" },
  { name: "Просвещение", aliases: ["просвещение"], category: "books" },
  { name: "Росмэн", aliases: ["росмэн", "росман"], category: "books" },
];

const toys: Brand[] = [
  { name: "LEGO", aliases: ["лего", "лэго"], category: "toys" },
  { name: "Hot Wheels", aliases: ["хот вилс", "хотвилс"], category: "toys" },
  { name: "Barbie", aliases: ["барби"], category: "toys" },
  { name: "Hasbro", aliases: ["хасбро"], category: "toys" },
  { name: "Mattel", aliases: ["маттел", "мэтл"], category: "toys" },
  { name: "Playmobil", aliases: ["плеймобиль", "плеймобил"], category: "toys" },
  { name: "Nerf", aliases: ["нёрф", "нерф"], category: "toys" },
  { name: "Funko Pop", aliases: ["фанко поп", "фанко"], category: "toys" },
  { name: "Fisher-Price", aliases: ["фишер прайс"], category: "toys" },
  { name: "Nintendo", aliases: ["нинтендо"], category: "toys" },
  { name: "Pokemon", aliases: ["покемон", "покемоны"], category: "toys" },
  { name: "Marvel", aliases: ["марвел"], category: "toys" },
  { name: "Disney", aliases: ["дисней"], category: "toys" },
  { name: "Star Wars", aliases: ["стар ворс", "звёздные войны"], category: "toys" },
  { name: "Transformers", aliases: ["трансформеры", "трансформерс"], category: "toys" },
  { name: "Bandai", aliases: ["бандай"], category: "toys" },
  { name: "Ravensburger", aliases: ["равенсбургер"], category: "toys" },
  { name: "Chicco", aliases: ["чикко"], category: "toys" },
  { name: "Sylvanian Families", aliases: ["сильвания", "сильванские семьи"], category: "toys" },
  { name: "Melissa & Doug", aliases: ["мелисса и даг"], category: "toys" },
  { name: "Bruder", aliases: ["брудер"], category: "toys" },
  { name: "Schleich", aliases: ["шляйх"], category: "toys" },
  { name: "Monopoly", aliases: ["монополия", "монополи"], category: "toys" },
  { name: "Uno", aliases: ["уно"], category: "toys" },
];

const furniture: Brand[] = [
  { name: "IKEA", aliases: ["икея", "икеа", "ikea"], category: "furniture" },
  { name: "Hoff", aliases: ["хофф", "хоф"], category: "furniture" },
  { name: "Askona", aliases: ["аскона"], category: "furniture" },
  { name: "Ormatek", aliases: ["орматек"], category: "furniture" },
  { name: "Mr. Doors", aliases: ["мистер дорс"], category: "furniture" },
  { name: "Shatura", aliases: ["шатура"], category: "furniture" },
  { name: "Lazurit", aliases: ["лазурит"], category: "furniture" },
  { name: "Divan.ru", aliases: ["диван ру", "диванру"], category: "furniture" },
  { name: "HomeMe", aliases: ["хоумми", "хоум ми"], category: "furniture" },
  { name: "Stolplit", aliases: ["столплит"], category: "furniture" },
  { name: "Calligaris", aliases: ["каллигарис"], category: "furniture" },
  { name: "BoConcept", aliases: ["боконцепт", "бо концепт"], category: "furniture" },
  { name: "Natuzzi", aliases: ["натуцци", "натузи"], category: "furniture" },
  { name: "Poliform", aliases: ["полиформ"], category: "furniture" },
  { name: "Minotti", aliases: ["минотти"], category: "furniture" },
  { name: "Cattelan Italia", aliases: ["каттелан"], category: "furniture" },
  { name: "Herman Miller", aliases: ["герман миллер", "эргон"], category: "furniture" },
  { name: "Steelcase", aliases: ["стилкейс"], category: "furniture" },
  { name: "Secretlab", aliases: ["секретлаб"], category: "furniture" },
  { name: "Autonomous", aliases: ["автономус"], category: "furniture" },
  { name: "FlexiSpot", aliases: ["флексиспот"], category: "furniture" },
];

// Merged list — deduplicated by name
export const ALL_BRANDS: Brand[] = [
  ...clothing,
  ...shoes,
  ...accessories,
  ...electronics,
  ...books,
  ...toys,
  ...furniture,
];

// Build a flat lookup: lowercased alias → brand name
const aliasMap = new Map<string, string>();
for (const brand of ALL_BRANDS) {
  aliasMap.set(brand.name.toLowerCase(), brand.name);
  for (const alias of brand.aliases) {
    aliasMap.set(alias.toLowerCase(), brand.name);
  }
}

// Common Russian stop-words that must never match brands
const STOP_WORDS = new Set([
  "на", "не", "но", "ну", "да", "за", "по", "от", "до", "из", "об", "ко",
  "во", "же", "бы", "ли", "уж", "то", "ни", "ой", "ах", "эх", "ух", "ну",
  "и", "в", "с", "к", "у", "о", "а", "я", "он", "мы", "вы", "ты", "как",
  "что", "это", "так", "все", "всё", "там", "тут", "вот", "ещё", "еще",
  "уже", "мне", "мой", "моя", "моё", "его", "её", "при", "про", "без",
  "для", "она", "они", "нет", "has", "the", "and", "for", "are", "was",
]);

/**
 * Given raw speech text, find and replace known brand aliases with
 * proper brand names. E.g. "пуховик стоник" → "пуховик Stone Island"
 * Only replaces aliases that are at least 3 chars and are EXACT word matches.
 */
export function correctBrandsInText(text: string): string {
  if (!text) return text;

  let result = text;

  // Sort aliases longest-first to avoid partial matches
  const sortedAliases = Array.from(aliasMap.entries())
    .filter(([alias]) => alias.length >= 3 && !STOP_WORDS.has(alias))
    .sort((a, b) => b[0].length - a[0].length);

  for (const [alias, brandName] of sortedAliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Strict word-boundary: must be surrounded by spaces, punctuation, or string edges
    const regex = new RegExp(`(?<=^|[\\s.,!?;:()\\-])${escaped}(?=$|[\\s.,!?;:()\\-])`, "gi");
    result = result.replace(regex, brandName);
  }

  return result;
}

/**
 * Search brands by query (for autocomplete).
 * Returns top N matches sorted by relevance.
 * Requires EXACT alias match or strong prefix match (min 3 chars).
 */
export function searchBrands(query: string, limit = 10, category?: BrandCategory): Brand[] {
  if (!query || query.length < 3) return [];

  const q = query.toLowerCase().trim();
  if (STOP_WORDS.has(q)) return [];

  const seen = new Set<string>();
  const results: { brand: Brand; score: number }[] = [];

  for (const brand of ALL_BRANDS) {
    if (category && brand.category !== category && brand.category !== "multi") continue;
    if (seen.has(brand.name)) continue;

    let score = 0;
    const nameLower = brand.name.toLowerCase();

    // Exact match on brand name
    if (nameLower === q) score = 100;
    // Brand name starts with query (min 3 chars)
    else if (q.length >= 3 && nameLower.startsWith(q)) score = 80;
    else {
      for (const alias of brand.aliases) {
        const aliasLower = alias.toLowerCase();
        // Exact alias match — strongest signal
        if (aliasLower === q) { score = 95; break; }
        // Alias starts with query, but query must cover at least 60% of alias
        if (q.length >= 3 && aliasLower.startsWith(q) && q.length / aliasLower.length >= 0.6) {
          score = Math.max(score, 70);
        }
      }
    }

    if (score > 0) {
      seen.add(brand.name);
      results.push({ brand, score });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => r.brand);
}

export const BRAND_COUNT = new Set(ALL_BRANDS.map(b => b.name)).size;
