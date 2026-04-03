export type Locale = "ru" | "en";

const translations = {
  ru: {
    app: {
      name: "Do4U",
      tagline: "Делаем за тебя — Sell4U и Buy4U",
    },
    nav: {
      home: "Главная",
      sell: "",
      buy: "Купить",
      chats: "Чаты",
      profile: "Профиль",
    },
    auth: {
      signIn: "Войти",
      signUp: "Регистрация",
      signOut: "Выйти",
      email: "Email",
      password: "Пароль",
      magicLink: "Войти по ссылке",
      google: "Войти через Google",
      orContinueWith: "Или продолжить с",
      noAccount: "Нет аккаунта?",
      hasAccount: "Уже есть аккаунт?",
    },
    sell: {
      title: "Sell4U",
      subtitle: "Я продаю → Do4U делает всё за меня",
      newListing: "+ Продать",
      step1: "Расскажи и покажи",
      step2: "AI улучшает",
      step3: "Превью",
      step4: "Публикация",
      speakPrompt: "Расскажи о товаре голосом (10–15 сек)",
      takePhotos: "Сделай 4–8 фото",
      aiProcessing: "Do4U анализирует...",
      preview: "Превью объявления",
      publish: "Запустить Do4U 🚀",
      published: "Опубликовано!",
    },
    buy: {
      title: "Buy4U",
      subtitle: "Скоро — Buy4U найдёт лучшие предложения для тебя",
      comingSoon: "Скоро",
    },
    dashboard: {
      activeListings: "Активные",
      soldListings: "Проданные",
      earnings: "Заработок",
    },
    listing: {
      price: "Цена",
      category: "Категория",
      location: "Локация",
      description: "Описание",
      sendMessage: "Написать",
      makeOffer: "Предложить цену",
    },
    common: {
      loading: "Загрузка...",
      error: "Ошибка",
      retry: "Повторить",
      cancel: "Отмена",
      save: "Сохранить",
      next: "Далее",
      back: "Назад",
      done: "Готово",
      search: "Поиск",
      filter: "Фильтр",
      sort: "Сортировка",
    },
    categories: {
      clothing: "Одежда",
      shoes: "Обувь",
      accessories: "Аксессуары",
      electronics: "Электроника",
      books: "Книги",
      toys: "Игрушки",
      furniture: "Мебель",
    },
    theme: {
      light: "Светлая тема",
      dark: "Тёмная тема",
      system: "Системная",
    },
  },
  en: {
    app: {
      name: "Do4U",
      tagline: "We do it for you — Sell4U & Buy4U",
    },
    nav: {
      home: "Home",
      sell: "",
      buy: "Buy",
      chats: "Chats",
      profile: "Profile",
    },
    auth: {
      signIn: "Sign In",
      signUp: "Sign Up",
      signOut: "Sign Out",
      email: "Email",
      password: "Password",
      magicLink: "Sign in with Magic Link",
      google: "Sign in with Google",
      orContinueWith: "Or continue with",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
    },
    sell: {
      title: "Sell4U",
      subtitle: "I sell → Do4U does everything for me",
      newListing: "+ Sell",
      step1: "Tell & Show",
      step2: "AI Enhances",
      step3: "Preview",
      step4: "Publish",
      speakPrompt: "Describe your item by voice (10-15 sec)",
      takePhotos: "Take 4-8 photos",
      aiProcessing: "Do4U is analyzing...",
      preview: "Listing Preview",
      publish: "Launch Do4U 🚀",
      published: "Published!",
    },
    buy: {
      title: "Buy4U",
      subtitle: "Coming soon — Buy4U will find the best deals for you",
      comingSoon: "Coming Soon",
    },
    dashboard: {
      activeListings: "Active",
      soldListings: "Sold",
      earnings: "Earnings",
    },
    listing: {
      price: "Price",
      category: "Category",
      location: "Location",
      description: "Description",
      sendMessage: "Message",
      makeOffer: "Make Offer",
    },
    common: {
      loading: "Loading...",
      error: "Error",
      retry: "Retry",
      cancel: "Cancel",
      save: "Save",
      next: "Next",
      back: "Back",
      done: "Done",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
    },
    categories: {
      clothing: "Clothing",
      shoes: "Shoes",
      accessories: "Accessories",
      electronics: "Electronics",
      books: "Books",
      toys: "Toys",
      furniture: "Furniture",
    },
    theme: {
      light: "Light",
      dark: "Dark",
      system: "System",
    },
  },
} as const;

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

export type TranslationKeys = DeepStringify<typeof translations.ru>;

export function getTranslations(locale: Locale): TranslationKeys {
  return translations[locale];
}

export const defaultLocale: Locale = "ru";
export const locales: Locale[] = ["ru", "en"];
