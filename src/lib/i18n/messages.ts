// src/lib/i18n/messages.ts

export const SUPPORTED_LOCALES = ["he", "en", "fr", "ru"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "he";

// טיפוס כללי כדי שלא יהיו בעיות עם I18nProvider הקיים
export type Messages = Record<string, any>;

/* ============================================================================
 *  HEBREW (default)
 * ==========================================================================*/

const heMessages: Messages = {
  site: {
    brand: "MATY-MUSIC",
    superBrand: "MATY+",
    tagline: "מוזיקה • קהילה • היכרויות • פיטנס • ג'אם – במקום אחד",
    seoDescription:
      'MATY-MUSIC – מוזיקה חיה, ניגוני חב"ד, הופעות, חתונות, התוועדויות, רשת חברתית נקייה ו-AI שעוזר לך לבנות את האירוע הבא.',
  },

  layout: {
    header: {
      nav: {
        home: "בית",
        music: "מוזיקה",
        events: "אירועים",
        club: "CLUB",
        date: "MATY-DATE",
        fit: "MATY-FIT",
        jam: "JAM GROUPS",
        gallery: "גלריה",
        about: "אודות",
        contact: "צור קשר",
        admin: "אדמין",
        assistant: "עוזר AI",
      },
      cta: {
        bookShow: "תיאום הופעה",
        login: "כניסה",
        signup: "הרשמה",
      },
      userMenu: {
        profile: "הפרופיל שלי",
        settings: "הגדרות",
        logout: "יציאה",
      },
      status: {
        liveNow: "שידור חי",
        youAreLive: "אתה כרגע בשידור חי",
      },
    },

    footer: {
      title: "MATY-MUSIC • מתי גורפינקל (MG)",
      subtitle: "אירועים חיה • חתונות • חופות • התוועדויות • בר מצוות",
      contactTitle: "יצירת קשר",
      contactText:
        "להזמנת אירוע, הופעה, חופה או התוועדות – השאירו פרטים ונחזור אליכם.",
      phoneLabel: "טלפון",
      emailLabel: "אימייל",
      siteLabel: "אתר",
      rights: "כל הזכויות שמורות © MATY-MUSIC",
      madeWithLove: "נבנה באהבה ובתשומת לב לפרטים.",
      linksTitle: "קישורים חשובים",
      links: {
        musicPage: "עמוד מוזיקה וניגונים",
        eventsPage: "אירועים והזמנות",
        clubPage: "פיד CLUB – קהילה",
        datePage: "MATY-DATE – היכרויות נקיות",
        fitPage: "MATY-FIT – כושר ואימונים",
        jamPage: "קבוצות JAM – מוזיקאים",
        terms: "תנאי שימוש",
        privacy: "מדיניות פרטיות",
      },
    },
  },

  common: {
    language: {
      label: "שפה",
      he: "עברית",
      en: "English",
      fr: "Français",
      ru: "Русский",
    },
    buttons: {
      save: "שמירה",
      cancel: "ביטול",
      edit: "עריכה",
      delete: "מחיקה",
      close: "סגירה",
      back: "חזרה",
      next: "הבא",
      previous: "הקודם",
      confirm: "אישור",
      continue: "המשך",
      send: "שליחה",
      search: "חיפוש",
      viewAll: "צפייה בהכל",
      seeMore: "לקריאה נוספת",
      seeLess: "פחות",
      learnMore: "למידע נוסף",
      apply: "הגשה",
      filter: "סינון",
      resetFilters: "איפוס סינון",
      share: "שיתוף",
      copyLink: "העתקת קישור",
      tryAgain: "ניסיון נוסף",
      goHome: "חזרה לדף הבית",
      bookNow: "להזמנה",
      goToMusic: "לעמוד המוזיקה",
      goToEvents: "לעמוד האירועים",
      goToClub: "לפיד CLUB",
    },
    states: {
      loading: "טוען...",
      submitting: "שולח...",
      noResults: "לא נמצאו תוצאות.",
      error: "משהו השתבש. נסה שוב מאוחר יותר.",
      emptyState: "אין נתונים להצגה כרגע.",
    },
    validation: {
      required: "שדה חובה",
      invalidEmail: "אימייל לא תקין",
      minLength: "קצר מדי",
      maxLength: "ארוך מדי",
      invalidPhone: "מספר טלפון לא תקין",
    },
  },

  auth: {
    title: "כניסה / הרשמה",
    subtitle: "התחבר כדי לשמור פלייליסטים, לעקוב אחרי אירועים ולהצטרף לקהילה.",
    login: {
      title: "כניסה",
      emailLabel: "אימייל",
      passwordLabel: "סיסמה",
      submit: "כניסה",
      forgot: "שכחתי סיסמה",
    },
    register: {
      title: "הרשמה",
      nameLabel: "שם מלא",
      emailLabel: "אימייל",
      passwordLabel: "סיסמה",
      confirmPasswordLabel: "אימות סיסמה",
      submit: "יצירת משתמש",
    },
    social: {
      continueWithGoogle: "המשך עם Google",
    },
    messages: {
      loginSuccess: "התחברת בהצלחה.",
      registerSuccess: "המשתמש נוצר בהצלחה.",
      logoutSuccess: "הת déנתקת מהמערכת.",
    },
  },

  home: {
    heroTitle: "מוזיקה חיה. חוויה אמיתית.",
    heroSubtitle:
      'ניגוני חב"ד, מוזיקה חסידית, מזרחית ושירי אווירה – מותאם בדיוק לאירוע שלך.',
    heroCtaPrimary: "להזמנת הופעה",
    heroCtaSecondary: "להאזנה לניגונים",

    ctaSectionTitle: "כל מה שההופעה שלך צריכה – במקום אחד",
    ctaSectionSubtitle:
      "שירים, סטים, היכרויות, קבוצות מוזיקאים, אימונים ואפילו AI שעוזר לך לבנות את האירוע מאפס.",

    cards: {
      events: {
        title: "אירועים",
        text: "חתונות, חינה, בר/בת מצווה, התוועדויות ואירועים קהילתיים – סט מותאם אישית.",
      },
      music: {
        title: "ספריית ניגונים",
        text: 'מאות ניגוני חב"ד, שירים חסידיים ושירי חופה – עם אקורדים וסטים מוכנים.',
      },
      club: {
        title: "CLUB – קהילה",
        text: "פיד נקי של מוזיקה, ניגונים, אירועים ורגעים מהשטח – בלי רעש מיותר.",
      },
      date: {
        title: "MATY-DATE",
        text: "קונספט של היכרויות נקיות סביב מוזיקה, ניגונים ואירועים חיה.",
      },
      fit: {
        title: "MATY-FIT",
        text: "אימוני כושר שמתאימים לחיים של מוזיקאי, אבא ובעל עבודה.",
      },
      jam: {
        title: "JAM GROUPS",
        text: "קבוצות ג'אם לפי עיר, סגנון ו-DAW – להתחבר למוזיקאים אחרים.",
      },
    },

    sections: {
      howItWorks: {
        title: "איך זה עובד?",
        steps: {
          step1Title: "בוחרים סגנון",
          step1Text: 'חב"ד, חסידי, מזרחי, שקט, מקפיץ – או הכל ביחד.',
          step2Title: "מתאימים את האירוע",
          step2Text: "פלייליסטים, רשימות שירים, סדר התוועדות ומעברים חלקים.",
          step3Title: "עולים לבמה",
          step3Text: "ציוד איכותי, ליווי מלא וסאונד שמרגישים בלב.",
        },
      },
      gear: {
        title: "ציוד וסאונד",
        text: "Korg PA5X MG, מערכת הגברה מקצועית, מיקרופונים איכותיים, מיקסר עם הקלטה – כדי שהאירוע שלך ישמע מושלם.",
      },
      ai: {
        title: "MATY-AI",
        text: "עוזר אישי שבונה סטים, מציע שירים ומתעדכן לפי מה שעבד טוב באירועים.",
      },
    },
  },

  music: {
    pageTitle: "ספריית ניגונים ושירים",
    pageSubtitle:
      'ניגוני חב"ד, שירים חסידיים, מזרחית, שירי אווירה וסטים מוכנים לחתונה ולהתוועדות.',
    filters: {
      searchPlaceholder: "חיפוש לפי שם שיר, ניגון או אמן...",
      categoryLabel: "קטגוריה",
      tempoLabel: "קצב",
      moodLabel: "אווירה",
      chabad: 'ניגוני חב"ד',
      hassidic: "חסידי כללי",
      mizrahi: "מזרחי / חאפלה",
      soft: "שקט",
      dance: "ריקודים",
    },
    table: {
      columns: {
        title: "שם השיר",
        artist: "אמן",
        category: "קטגוריה",
        bpm: "BPM",
        key: "סולם",
        length: "אורך",
        actions: "פעולות",
      },
      actions: {
        play: "ניגון",
        pause: "הפסקה",
        addToPlaylist: "הוספה לפלייליסט",
        viewChords: "צפייה באקורדים",
      },
    },
    messages: {
      empty: "בקרוב נעלה לכאן את כל הניגונים. בינתיים יש טעימה ראשונית.",
    },
  },

  events: {
    pageTitle: "אירועים והזמנת הופעה",
    pageDescription:
      "לוח הופעות ועמוד הזמנה לחתונות, חופות, בר מצוות, חינות, התוועדויות ואירועים פרטיים.",
    list: {
      upcomingTitle: "אירועים קרובים",
      pastTitle: "אירועים קודמים",
      emptyUpcoming: "כרגע אין אירועים פתוחים לציבור.",
      emptyPast: "בקרוב תעלה גלריה מלאה מאירועים קודמים.",
    },
    booking: {
      title: "טופס הזמנת אירוע",
      eventTypeLabel: "סוג האירוע",
      dateLabel: "תאריך משוער",
      locationLabel: "מיקום האירוע",
      guestsLabel: "מספר משתתפים",
      notesLabel: "הערות נוספות",
      eventTypes: {
        wedding: "חתונה",
        chuppa: "חופה בלבד",
        barMitzvah: "בר מצווה",
        batMitzvah: "בת מצווה",
        farbrengen: "התוועדות",
        community: "אירוע קהילתי",
        other: "אחר",
      },
      submitLabel: "שליחת בקשה",
      successMessage: "הבקשה התקבלה. נחזור אליך עם פרטים נוספים ושריון תאריך.",
    },
  },

  club: {
    pageTitle: "CLUB – פיד קהילה וניגונים",
    pageSubtitle:
      "שיתופים, ניגונים, קטעי וידאו, שידורים חיים ואירועי קהילה – הכל במקום אחד.",
    composer: {
      placeholder: "מה בא לך לשתף היום? ניגון, מחשבה, וידאו מהאירוע...",
      postButton: "פרסום",
      attachMedia: "הוספת תמונה / וידאו",
      attachAudio: "הוספת אודיו",
      aiAssist: "MATY-AI – הצעת טקסט לפוסט",
    },
    feed: {
      empty: "עדיין אין פוסטים – תהיה הראשון לשתף משהו.",
      loadMore: "טעינת פוסטים נוספים",
    },
    post: {
      comments: "תגובות",
      addCommentPlaceholder: "הוספת תגובה...",
      like: "אהבתי",
      unlike: "ביטול לייק",
      share: "שיתוף",
      report: "דיווח",
      you: "אתה",
      edited: "נערך",
      justNow: "לפני רגע",
    },
  },

  date: {
    pageTitle: "MATY-DATE – היכרויות נקיות סביב מוזיקה",
    pageSubtitle:
      "קונספט חדש של היכרויות והיכרות – סביב ניגונים, אירועים והתוועדויות.",
    profile: {
      myProfile: "הפרופיל שלי",
      editProfile: "עריכת פרופיל",
      musicTaste: "טעם מוזיקלי",
      shabbat: "שבת וחגים",
      aboutMe: "קצת עליי",
    },
    match: {
      suggestionsTitle: "התאמות מוצעות",
      empty: "בקרוב יופיעו כאן התאמות לפי הפרופיל המוזיקלי שלך.",
      like: "אהבתי",
      pass: "דלג",
      superLike: "סופר לייק",
    },
  },

  fit: {
    pageTitle: "MATY-FIT – כושר ואימונים",
    pageSubtitle:
      "אימונים מותאמים לחיים של מוזיקאי, אבא ועובד – בלי דיאטות קיצוניות.",
    plan: {
      currentPlanTitle: "תוכנית האימונים הנוכחית",
      noPlan: "עדיין אין תוכנית פעילה. נבנה יחד תשתית שתוכל להתמיד איתה באמת.",
    },
  },

  jam: {
    pageTitle: "JAM GROUPS – קבוצות מוזיקאים",
    pageSubtitle:
      "מציאת מוזיקאים לפי עיר, סגנון, כלי ו-DAW, ויצירת קבוצות ג'אם ושיתופי פעולה.",
    list: {
      filtersTitle: "סינון קבוצות",
      genresLabel: "סגנונות",
      dawsLabel: "DAW",
      cityLabel: "עיר",
      joinButton: "הצטרפות לקבוצה",
      leaveButton: "עזיבת קבוצה",
      membersCount: "חברים בקבוצה",
    },
  },

  gallery: {
    pageTitle: "גלריית תמונות וסרטונים",
    pageSubtitle:
      "תמונות מהופעות, חופות, חתונות, התוועדויות ורגעים מיוחדים מהשטח.",
    empty: "בקרוב נעלה לגלריה הרבה חומרים מהאירועים האחרונים.",
  },

  payments: {
    paywall: {
      title: "תוכן למנויים",
      description:
        "חלק מהתוכן דורש הרשמה או מנוי. אפשר להירשם חינם או לשדרג למנוי מתקדם.",
      upgradeButton: "שדרוג למנוי",
    },
    checkout: {
      title: "תשלום והזמנת אירוע",
      cardcomOption: "תשלום בכרטיס אשראי (Cardcom)",
      paypalOption: "תשלום דרך PayPal",
      success: "העסקה הושלמה בהצלחה.",
      failure: "העסקה נכשלה. בדוק את הפרטים או נסה שוב.",
    },
  },

  errors: {
    notFoundTitle: "הדף לא נמצא",
    notFoundText: "ייתכן שהקישור שגוי או שהדף הועבר.",
    serverErrorTitle: "תקלה בשרת",
    serverErrorText: "משהו השתבש אצלנו. נסה שוב מאוחר יותר.",
    unauthorizedTitle: "אין הרשאה",
    unauthorizedText: "אין לך הרשאה לצפות בדף זה.",
  },
};

/* ============================================================================
 *  ENGLISH
 * ==========================================================================*/

const enMessages: Messages = {
  site: {
    brand: "MATY-MUSIC",
    superBrand: "MATY+",
    tagline: "Music • Community • Dating • Fitness • Jam – in one place",
    seoDescription:
      "MATY-MUSIC – live music, Chabad nigunim, weddings, events, community feed and AI tools to build your next show.",
  },

  layout: {
    header: {
      nav: {
        home: "Home",
        music: "Music",
        events: "Events",
        club: "CLUB",
        date: "MATY-DATE",
        fit: "MATY-FIT",
        jam: "JAM GROUPS",
        gallery: "Gallery",
        about: "About",
        contact: "Contact",
        admin: "Admin",
        assistant: "AI Assistant",
      },
      cta: {
        bookShow: "Book a show",
        login: "Login",
        signup: "Sign up",
      },
      userMenu: {
        profile: "My profile",
        settings: "Settings",
        logout: "Logout",
      },
      status: {
        liveNow: "Live now",
        youAreLive: "You are currently live",
      },
    },

    footer: {
      title: "MATY-MUSIC • Maty Gorfinkel (MG)",
      subtitle: "Live events • Weddings • Chuppot • Farbrengens • Bar Mitzvahs",
      contactTitle: "Contact",
      contactText:
        "To book a show, wedding, chuppa or community event – leave your details and we’ll get back to you.",
      phoneLabel: "Phone",
      emailLabel: "Email",
      siteLabel: "Website",
      rights: "All rights reserved © MATY-MUSIC",
      madeWithLove: "Built with love and attention to detail.",
      linksTitle: "Important links",
      links: {
        musicPage: "Music & nigunim library",
        eventsPage: "Events & bookings",
        clubPage: "CLUB feed – community",
        datePage: "MATY-DATE – clean dating",
        fitPage: "MATY-FIT – workouts",
        jamPage: "JAM groups – musicians",
        terms: "Terms of use",
        privacy: "Privacy policy",
      },
    },
  },

  common: {
    language: {
      label: "Language",
      he: "עברית",
      en: "English",
      fr: "Français",
      ru: "Русский",
    },
    buttons: {
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      close: "Close",
      back: "Back",
      next: "Next",
      previous: "Previous",
      confirm: "Confirm",
      continue: "Continue",
      send: "Send",
      search: "Search",
      viewAll: "View all",
      seeMore: "See more",
      seeLess: "See less",
      learnMore: "Learn more",
      apply: "Apply",
      filter: "Filter",
      resetFilters: "Reset filters",
      share: "Share",
      copyLink: "Copy link",
      tryAgain: "Try again",
      goHome: "Back to home",
      bookNow: "Book now",
      goToMusic: "Go to music page",
      goToEvents: "Go to events page",
      goToClub: "Go to CLUB feed",
    },
    states: {
      loading: "Loading...",
      submitting: "Submitting...",
      noResults: "No results found.",
      error: "Something went wrong. Please try again later.",
      emptyState: "Nothing to show here yet.",
    },
    validation: {
      required: "Required field",
      invalidEmail: "Invalid email address",
      minLength: "Too short",
      maxLength: "Too long",
      invalidPhone: "Invalid phone number",
    },
  },

  auth: {
    title: "Login / Register",
    subtitle:
      "Sign in to save playlists, follow events, and join the community.",
    login: {
      title: "Login",
      emailLabel: "Email",
      passwordLabel: "Password",
      submit: "Login",
      forgot: "Forgot password",
    },
    register: {
      title: "Sign up",
      nameLabel: "Full name",
      emailLabel: "Email",
      passwordLabel: "Password",
      confirmPasswordLabel: "Confirm password",
      submit: "Create account",
    },
    social: {
      continueWithGoogle: "Continue with Google",
    },
    messages: {
      loginSuccess: "Logged in successfully.",
      registerSuccess: "Account created successfully.",
      logoutSuccess: "Logged out successfully.",
    },
  },

  home: {
    heroTitle: "Live music. Real experience.",
    heroSubtitle:
      "Chabad nigunim, Hassidic music, Mizrahi, slow songs and dance sets – tailored for your event.",
    heroCtaPrimary: "Book a show",
    heroCtaSecondary: "Listen to nigunim",

    ctaSectionTitle: "Everything your show needs – in one place",
    ctaSectionSubtitle:
      "Songs, sets, dating, musician groups, workouts and even AI to help you build your event from scratch.",

    cards: {
      events: {
        title: "Events",
        text: "Weddings, henna, bar/bat mitzvahs, farbrengens and community events – full custom sets.",
      },
      music: {
        title: "Nigunim library",
        text: "Hundreds of Chabad nigunim, Hassidic songs and wedding tunes – with chords and ready-made sets.",
      },
      club: {
        title: "CLUB – community",
        text: "Clean feed of music, nigunim, events and moments – without the usual noise.",
      },
      date: {
        title: "MATY-DATE",
        text: "A new concept for clean dating around music, nigunim and live events.",
      },
      fit: {
        title: "MATY-FIT",
        text: "Workout plans adapted to a musician and family lifestyle – no extreme diets.",
      },
      jam: {
        title: "JAM GROUPS",
        text: "Jam groups by city, style and DAW – find other musicians to play with.",
      },
    },

    sections: {
      howItWorks: {
        title: "How it works",
        steps: {
          step1Title: "Choose your style",
          step1Text: "Chabad, Hassidic, Mizrahi, soft, dance – or a mix.",
          step2Title: "Shape the event",
          step2Text: "Playlists, song lists, farbrengen flow and transitions.",
          step3Title: "Hit the stage",
          step3Text:
            "Pro gear, full support, and sound that people feel in their heart.",
        },
      },
      gear: {
        title: "Gear & sound",
        text: "Korg PA5X MG, professional PA system, quality microphones, mixer with recording – everything for a perfect sound.",
      },
      ai: {
        title: "MATY-AI",
        text: "An assistant that builds sets, suggests songs for each event type, and learns what worked in previous shows.",
      },
    },
  },

  music: {
    pageTitle: "Nigunim & songs library",
    pageSubtitle:
      "Chabad nigunim, Hassidic songs, Mizrahi, atmospheres and ready sets for weddings and farbrengens.",
    filters: {
      searchPlaceholder: "Search by song, nigun or artist...",
      categoryLabel: "Category",
      tempoLabel: "Tempo",
      moodLabel: "Mood",
      chabad: "Chabad nigunim",
      hassidic: "Hassidic",
      mizrahi: "Mizrahi / Hafla",
      soft: "Soft",
      dance: "Dance",
    },
    table: {
      columns: {
        title: "Title",
        artist: "Artist",
        category: "Category",
        bpm: "BPM",
        key: "Key",
        length: "Length",
        actions: "Actions",
      },
      actions: {
        play: "Play",
        pause: "Pause",
        addToPlaylist: "Add to playlist",
        viewChords: "View chords",
      },
    },
    messages: {
      empty: "We’re still uploading the full library – enjoy the first tracks.",
    },
  },

  events: {
    pageTitle: "Events & booking",
    pageDescription:
      "Live events calendar and booking page for weddings, chuppot, bar/bat mitzvahs, farbrengens and private events.",
    list: {
      upcomingTitle: "Upcoming events",
      pastTitle: "Past events",
      emptyUpcoming: "No public events are scheduled at the moment.",
      emptyPast: "A full gallery of past events is coming soon.",
    },
    booking: {
      title: "Event booking form",
      eventTypeLabel: "Event type",
      dateLabel: "Estimated date",
      locationLabel: "Event location",
      guestsLabel: "Number of guests",
      notesLabel: "Additional notes",
      eventTypes: {
        wedding: "Wedding",
        chuppa: "Chuppa only",
        barMitzvah: "Bar mitzvah",
        batMitzvah: "Bat mitzvah",
        farbrengen: "Farbrengen",
        community: "Community event",
        other: "Other",
      },
      submitLabel: "Send request",
      successMessage:
        "Your request has been received. We’ll get back to you with details and availability.",
    },
  },

  club: {
    pageTitle: "CLUB – community feed",
    pageSubtitle:
      "Posts, nigunim, videos, live streams and community events – all in one place.",
    composer: {
      placeholder: "What would you like to share today?",
      postButton: "Post",
      attachMedia: "Add image / video",
      attachAudio: "Add audio",
      aiAssist: "MATY-AI – suggest post text",
    },
    feed: {
      empty: "No posts yet – be the first to share something.",
      loadMore: "Load more posts",
    },
    post: {
      comments: "Comments",
      addCommentPlaceholder: "Add a comment...",
      like: "Like",
      unlike: "Unlike",
      share: "Share",
      report: "Report",
      you: "You",
      edited: "Edited",
      justNow: "Just now",
    },
  },

  date: {
    pageTitle: "MATY-DATE – clean dating around music",
    pageSubtitle:
      "A new concept for meetups and dating around nigunim, events and live shows.",
    profile: {
      myProfile: "My profile",
      editProfile: "Edit profile",
      musicTaste: "Music taste",
      shabbat: "Shabbat & holidays",
      aboutMe: "About me",
    },
    match: {
      suggestionsTitle: "Suggested matches",
      empty:
        "Soon you’ll see matches here based on your musical profile and activity.",
      like: "Like",
      pass: "Pass",
      superLike: "Super like",
    },
  },

  fit: {
    pageTitle: "MATY-FIT – workouts",
    pageSubtitle:
      "Workout plans tuned to the real life of a musician, father and full-time worker.",
    plan: {
      currentPlanTitle: "Current plan",
      noPlan:
        "No active plan yet. We’ll build a steady, realistic routine you can stick to.",
    },
  },

  jam: {
    pageTitle: "JAM GROUPS – musicians",
    pageSubtitle:
      "Find musicians by city, style, instrument and DAW, and create jam groups and collaborations.",
    list: {
      filtersTitle: "Filter groups",
      genresLabel: "Genres",
      dawsLabel: "DAWs",
      cityLabel: "City",
      joinButton: "Join group",
      leaveButton: "Leave group",
      membersCount: "Members",
    },
  },

  gallery: {
    pageTitle: "Gallery",
    pageSubtitle:
      "Photos and videos from shows, chuppot, weddings, farbrengens and special moments.",
    empty: "We’ll upload a lot of recent photos and clips here soon.",
  },

  payments: {
    paywall: {
      title: "Subscribers content",
      description:
        "Some content requires an account or subscription. You can sign up for free or upgrade.",
      upgradeButton: "Upgrade subscription",
    },
    checkout: {
      title: "Payment & booking",
      cardcomOption: "Credit card (Cardcom)",
      paypalOption: "PayPal",
      success: "Payment completed successfully.",
      failure: "Payment failed. Check your details or try again.",
    },
  },

  errors: {
    notFoundTitle: "Page not found",
    notFoundText: "The link may be wrong or the page was moved.",
    serverErrorTitle: "Server error",
    serverErrorText:
      "Something went wrong on our side. Please try again later.",
    unauthorizedTitle: "Unauthorized",
    unauthorizedText: "You don’t have permission to view this page.",
  },
};

/* ============================================================================
 *  FRENCH
 * ==========================================================================*/

const frMessages: Messages = {
  site: {
    brand: "MATY-MUSIC",
    superBrand: "MATY+",
    tagline:
      "Musique • Communauté • Rencontres • Fitness • Jam – au même endroit",
    seoDescription:
      "MATY-MUSIC – musique live, nigounim de Loubavitch, mariages, événements, communauté et outils IA pour préparer votre soirée.",
  },

  layout: {
    header: {
      nav: {
        home: "Accueil",
        music: "Musique",
        events: "Événements",
        club: "CLUB",
        date: "MATY-DATE",
        fit: "MATY-FIT",
        jam: "Groupes JAM",
        gallery: "Galerie",
        about: "À propos",
        contact: "Contact",
        admin: "Admin",
        assistant: "Assistant IA",
      },
      cta: {
        bookShow: "Réserver un show",
        login: "Connexion",
        signup: "Inscription",
      },
      userMenu: {
        profile: "Mon profil",
        settings: "Paramètres",
        logout: "Déconnexion",
      },
      status: {
        liveNow: "En direct",
        youAreLive: "Vous êtes actuellement en direct",
      },
    },

    footer: {
      title: "MATY-MUSIC • Maty Gorfinkel (MG)",
      subtitle:
        "Événements live • Mariages • Houppas • Farbrengens • Bar Mitsva",
      contactTitle: "Contact",
      contactText:
        "Pour réserver une prestation, un mariage, une houppa ou un événement communautaire – laissez vos coordonnées.",
      phoneLabel: "Téléphone",
      emailLabel: "Email",
      siteLabel: "Site",
      rights: "Tous droits réservés © MATY-MUSIC",
      madeWithLove: "Créé avec amour et souci du détail.",
      linksTitle: "Liens importants",
      links: {
        musicPage: "Bibliothèque de nigounim",
        eventsPage: "Événements et réservations",
        clubPage: "Flux CLUB – communauté",
        datePage: "MATY-DATE – rencontres",
        fitPage: "MATY-FIT – entraînements",
        jamPage: "Groupes JAM – musiciens",
        terms: "Conditions d’utilisation",
        privacy: "Politique de confidentialité",
      },
    },
  },

  common: {
    language: {
      label: "Langue",
      he: "עברית",
      en: "English",
      fr: "Français",
      ru: "Русский",
    },
    buttons: {
      save: "Enregistrer",
      cancel: "Annuler",
      edit: "Modifier",
      delete: "Supprimer",
      close: "Fermer",
      back: "Retour",
      next: "Suivant",
      previous: "Précédent",
      confirm: "Confirmer",
      continue: "Continuer",
      send: "Envoyer",
      search: "Rechercher",
      viewAll: "Tout voir",
      seeMore: "Voir plus",
      seeLess: "Voir moins",
      learnMore: "En savoir plus",
      apply: "Appliquer",
      filter: "Filtrer",
      resetFilters: "Réinitialiser",
      share: "Partager",
      copyLink: "Copier le lien",
      tryAgain: "Réessayer",
      goHome: "Retour à l’accueil",
      bookNow: "Réserver",
      goToMusic: "Aller à la musique",
      goToEvents: "Aller aux événements",
      goToClub: "Aller au CLUB",
    },
    states: {
      loading: "Chargement...",
      submitting: "Envoi...",
      noResults: "Aucun résultat.",
      error: "Une erreur s’est produite. Réessayez plus tard.",
      emptyState: "Rien à afficher pour l’instant.",
    },
    validation: {
      required: "Champ obligatoire",
      invalidEmail: "Adresse email invalide",
      minLength: "Trop court",
      maxLength: "Trop long",
      invalidPhone: "Numéro de téléphone invalide",
    },
  },

  auth: {
    title: "Connexion / Inscription",
    subtitle:
      "Connectez-vous pour sauvegarder des playlists, suivre les événements et rejoindre la communauté.",
    login: {
      title: "Connexion",
      emailLabel: "Email",
      passwordLabel: "Mot de passe",
      submit: "Connexion",
      forgot: "Mot de passe oublié",
    },
    register: {
      title: "Inscription",
      nameLabel: "Nom complet",
      emailLabel: "Email",
      passwordLabel: "Mot de passe",
      confirmPasswordLabel: "Confirmez le mot de passe",
      submit: "Créer un compte",
    },
    social: {
      continueWithGoogle: "Continuer avec Google",
    },
    messages: {
      loginSuccess: "Connexion réussie.",
      registerSuccess: "Compte créé avec succès.",
      logoutSuccess: "Déconnexion réussie.",
    },
  },

  home: {
    heroTitle: "Musique live. Expérience réelle.",
    heroSubtitle:
      "Nigounim de Loubavitch, musique hassidique, orientale, douce ou dansante – adaptés à votre événement.",
    heroCtaPrimary: "Réserver un show",
    heroCtaSecondary: "Écouter des nigounim",

    ctaSectionTitle: "Tout ce dont votre soirée a besoin – au même endroit",
    ctaSectionSubtitle:
      "Chansons, sets, rencontres, groupes de musiciens, entraînements et même une IA qui vous aide à préparer l’événement.",

    cards: {
      events: {
        title: "Événements",
        text: "Mariages, henna, bar/bat mitsva, farbrengens et événements communautaires – sets sur mesure.",
      },
      music: {
        title: "Bibliothèque de nigounim",
        text: "Des centaines de nigounim de Loubavitch, chants hassidiques et morceaux de mariage – avec accords et sets prêts.",
      },
      club: {
        title: "CLUB – communauté",
        text: "Un flux propre de musique, nigounim, événements et instants forts.",
      },
      date: {
        title: "MATY-DATE",
        text: "Un concept de rencontres propre autour de la musique et des événements live.",
      },
      fit: {
        title: "MATY-FIT",
        text: "Des programmes d’entraînement adaptés à une vie de musicien et de père.",
      },
      jam: {
        title: "Groupes JAM",
        text: "Groupes de jam par ville, style et DAW – trouvez d’autres musiciens.",
      },
    },

    sections: {
      howItWorks: {
        title: "Comment ça marche ?",
        steps: {
          step1Title: "Choisissez le style",
          step1Text:
            "Loubavitch, hassidique, oriental, soft, dance – ou un mélange.",
          step2Title: "Construisez l’événement",
          step2Text:
            "Playlists, listes de chants, déroulé de farbrengen et transitions.",
          step3Title: "Montez sur scène",
          step3Text:
            "Du matériel pro, un accompagnement complet et un son qui touche le cœur.",
        },
      },
      gear: {
        title: "Matériel & son",
        text: "Korg PA5X MG, système de sonorisation pro, micros de qualité, console avec enregistrement.",
      },
      ai: {
        title: "MATY-IA",
        text: "Un assistant qui construit vos sets, suggère des chants et apprend de chaque événement.",
      },
    },
  },

  music: {
    pageTitle: "Bibliothèque de nigounim et chants",
    pageSubtitle:
      "Nigounim de Loubavitch, chants hassidiques, orientaux, ambiances et sets prêts pour les mariages et farbrengens.",
    filters: {
      searchPlaceholder: "Chercher par titre, nigoun ou artiste...",
      categoryLabel: "Catégorie",
      tempoLabel: "Tempo",
      moodLabel: "Ambiance",
      chabad: "Nigounim de Loubavitch",
      hassidic: "Hassidique",
      mizrahi: "Oriental / hafla",
      soft: "Doux",
      dance: "Dansant",
    },
    table: {
      columns: {
        title: "Titre",
        artist: "Artiste",
        category: "Catégorie",
        bpm: "BPM",
        key: "Tonalité",
        length: "Durée",
        actions: "Actions",
      },
      actions: {
        play: "Lire",
        pause: "Pause",
        addToPlaylist: "Ajouter à la playlist",
        viewChords: "Voir les accords",
      },
    },
    messages: {
      empty:
        "Nous sommes en train de mettre en ligne toute la bibliothèque – profitez des premiers titres.",
    },
  },

  events: {
    pageTitle: "Événements & réservations",
    pageDescription:
      "Calendrier des événements live et formulaire pour réserver un mariage, une houppa, une bar/bat mitsva ou un événement privé.",
    list: {
      upcomingTitle: "Événements à venir",
      pastTitle: "Événements passés",
      emptyUpcoming: "Aucun événement public pour le moment.",
      emptyPast: "Une grande galerie d’événements passés arrive bientôt.",
    },
    booking: {
      title: "Formulaire de réservation",
      eventTypeLabel: "Type d’événement",
      dateLabel: "Date estimée",
      locationLabel: "Lieu",
      guestsLabel: "Nombre de participants",
      notesLabel: "Remarques supplémentaires",
      eventTypes: {
        wedding: "Mariage",
        chuppa: "Houppa seule",
        barMitzvah: "Bar Mitsva",
        batMitzvah: "Bat Mitsva",
        farbrengen: "Farbrengen",
        community: "Événement communautaire",
        other: "Autre",
      },
      submitLabel: "Envoyer la demande",
      successMessage:
        "Votre demande a été reçue. Nous vous contacterons avec les détails et la disponibilité.",
    },
  },

  club: {
    pageTitle: "CLUB – flux communautaire",
    pageSubtitle:
      "Publications, nigounim, vidéos, live et événements de communauté – tout au même endroit.",
    composer: {
      placeholder: "Qu’avez-vous envie de partager aujourd’hui ?",
      postButton: "Publier",
      attachMedia: "Ajouter image / vidéo",
      attachAudio: "Ajouter audio",
      aiAssist: "MATY-IA – proposer un texte",
    },
    feed: {
      empty: "Aucune publication pour l’instant – soyez le premier.",
      loadMore: "Charger plus de publications",
    },
    post: {
      comments: "Commentaires",
      addCommentPlaceholder: "Ajouter un commentaire...",
      like: "J’aime",
      unlike: "Je n’aime plus",
      share: "Partager",
      report: "Signaler",
      you: "Vous",
      edited: "Modifié",
      justNow: "À l’instant",
    },
  },

  date: {
    pageTitle: "MATY-DATE – rencontres autour de la musique",
    pageSubtitle:
      "Un concept de rencontres propre autour des nigounim, événements et concerts live.",
    profile: {
      myProfile: "Mon profil",
      editProfile: "Modifier le profil",
      musicTaste: "Goûts musicaux",
      shabbat: "Chabbat & fêtes",
      aboutMe: "À propos de moi",
    },
    match: {
      suggestionsTitle: "Suggestions de rencontres",
      empty:
        "Bientôt, vous verrez ici des propositions basées sur votre profil musical.",
      like: "J’aime",
      pass: "Passer",
      superLike: "Super like",
    },
  },

  fit: {
    pageTitle: "MATY-FIT – entraînements",
    pageSubtitle:
      "Programmes adaptés à la vie réelle d’un musicien, d’un père et d’un travailleur.",
    plan: {
      currentPlanTitle: "Programme actuel",
      noPlan:
        "Aucun programme actif pour l’instant. Nous construirons une routine réaliste.",
    },
  },

  jam: {
    pageTitle: "Groupes JAM – musiciens",
    pageSubtitle:
      "Trouvez des musiciens par ville, style, instrument et DAW, et créez des groupes de jam.",
    list: {
      filtersTitle: "Filtrer les groupes",
      genresLabel: "Genres",
      dawsLabel: "DAWs",
      cityLabel: "Ville",
      joinButton: "Rejoindre le groupe",
      leaveButton: "Quitter le groupe",
      membersCount: "Membres",
    },
  },

  gallery: {
    pageTitle: "Galerie",
    pageSubtitle:
      "Photos et vidéos de concerts, houppas, mariages, farbrengens et moments forts.",
    empty:
      "Nous allons bientôt mettre en ligne de nombreuses photos et vidéos récentes.",
  },

  payments: {
    paywall: {
      title: "Contenu réservé",
      description:
        "Certains contenus nécessitent un compte ou un abonnement. Inscrivez-vous gratuitement ou passez en premium.",
      upgradeButton: "Passer en abonnement",
    },
    checkout: {
      title: "Paiement & réservation",
      cardcomOption: "Carte bancaire (Cardcom)",
      paypalOption: "PayPal",
      success: "Paiement effectué avec succès.",
      failure: "Échec du paiement. Vérifiez vos informations ou réessayez.",
    },
  },

  errors: {
    notFoundTitle: "Page introuvable",
    notFoundText: "Le lien est peut-être erroné ou la page a été déplacée.",
    serverErrorTitle: "Erreur serveur",
    serverErrorText:
      "Une erreur s’est produite côté serveur. Réessayez plus tard.",
    unauthorizedTitle: "Non autorisé",
    unauthorizedText: "Vous n’avez pas l’autorisation d’accéder à cette page.",
  },
};

/* ============================================================================
 *  RUSSIAN
 * ==========================================================================*/

const ruMessages: Messages = {
  site: {
    brand: "MATY-MUSIC",
    superBrand: "MATY+",
    tagline: "Музыка • Сообщество • Знакомства • Фитнес • Jam – в одном месте",
    seoDescription:
      "MATY-MUSIC – живая музыка, хабадские нигуним, свадьбы, события, сообщество и ИИ-инструменты для подготовки вашего праздника.",
  },

  layout: {
    header: {
      nav: {
        home: "Главная",
        music: "Музыка",
        events: "События",
        club: "CLUB",
        date: "MATY-DATE",
        fit: "MATY-FIT",
        jam: "JAM-группы",
        gallery: "Галерея",
        about: "О проекте",
        contact: "Контакты",
        admin: "Админ",
        assistant: "ИИ-ассистент",
      },
      cta: {
        bookShow: "Заказать выступление",
        login: "Войти",
        signup: "Регистрация",
      },
      userMenu: {
        profile: "Мой профиль",
        settings: "Настройки",
        logout: "Выйти",
      },
      status: {
        liveNow: "В эфире",
        youAreLive: "Вы сейчас в прямом эфире",
      },
    },

    footer: {
      title: "MATY-MUSIC • Мати Горфинкель (MG)",
      subtitle: "Живые выступления • Свадьбы • Хупы • Фарбренгены • Бар-мицвы",
      contactTitle: "Контакты",
      contactText:
        "Чтобы заказать выступление, свадьбу, хупу или общинное мероприятие – оставьте свои данные.",
      phoneLabel: "Телефон",
      emailLabel: "Email",
      siteLabel: "Сайт",
      rights: "Все права защищены © MATY-MUSIC",
      madeWithLove: "Создано с любовью и вниманием к деталям.",
      linksTitle: "Важные ссылки",
      links: {
        musicPage: "Библиотека нигуним",
        eventsPage: "События и заказ",
        clubPage: "Лента CLUB – сообщество",
        datePage: "MATY-DATE – знакомства",
        fitPage: "MATY-FIT – тренировки",
        jamPage: "JAM-группы – музыканты",
        terms: "Условия использования",
        privacy: "Политика конфиденциальности",
      },
    },
  },

  common: {
    language: {
      label: "Язык",
      he: "עברית",
      en: "English",
      fr: "Français",
      ru: "Русский",
    },
    buttons: {
      save: "Сохранить",
      cancel: "Отмена",
      edit: "Редактировать",
      delete: "Удалить",
      close: "Закрыть",
      back: "Назад",
      next: "Далее",
      previous: "Назад",
      confirm: "Подтвердить",
      continue: "Продолжить",
      send: "Отправить",
      search: "Поиск",
      viewAll: "Показать всё",
      seeMore: "Показать ещё",
      seeLess: "Показать меньше",
      learnMore: "Подробнее",
      apply: "Применить",
      filter: "Фильтр",
      resetFilters: "Сбросить фильтры",
      share: "Поделиться",
      copyLink: "Скопировать ссылку",
      tryAgain: "Попробовать ещё раз",
      goHome: "На главную",
      bookNow: "Заказать",
      goToMusic: "К странице музыки",
      goToEvents: "К странице событий",
      goToClub: "К ленте CLUB",
    },
    states: {
      loading: "Загрузка...",
      submitting: "Отправка...",
      noResults: "Ничего не найдено.",
      error: "Произошла ошибка. Попробуйте позже.",
      emptyState: "Здесь пока ничего нет.",
    },
    validation: {
      required: "Обязательное поле",
      invalidEmail: "Некорректный email",
      minLength: "Слишком коротко",
      maxLength: "Слишком длинно",
      invalidPhone: "Некорректный телефон",
    },
  },

  auth: {
    title: "Вход / Регистрация",
    subtitle:
      "Войдите, чтобы сохранять плейлисты, следить за событиями и участвовать в сообществе.",
    login: {
      title: "Вход",
      emailLabel: "Email",
      passwordLabel: "Пароль",
      submit: "Войти",
      forgot: "Забыли пароль",
    },
    register: {
      title: "Регистрация",
      nameLabel: "Полное имя",
      emailLabel: "Email",
      passwordLabel: "Пароль",
      confirmPasswordLabel: "Подтвердите пароль",
      submit: "Создать аккаунт",
    },
    social: {
      continueWithGoogle: "Продолжить через Google",
    },
    messages: {
      loginSuccess: "Вы успешно вошли.",
      registerSuccess: "Аккаунт успешно создан.",
      logoutSuccess: "Вы вышли из системы.",
    },
  },

  home: {
    heroTitle: "Живая музыка. Настоящие эмоции.",
    heroSubtitle:
      "Хабадские нигуним, хасидская музыка, мизрахи, медленные композиции и танцевальные сеты – под ваш формат.",
    heroCtaPrimary: "Заказать выступление",
    heroCtaSecondary: "Слушать нигуним",

    ctaSectionTitle: "Всё, что нужно для вашего праздника – в одном месте",
    ctaSectionSubtitle:
      "Песни, сеты, знакомства, группы музыкантов, тренировки и даже ИИ, помогающий собрать программу.",

    cards: {
      events: {
        title: "События",
        text: "Свадьбы, хупы, бар/бат-мицвы, фарбренген и общинные мероприятия – полные сеты.",
      },
      music: {
        title: "Библиотека нигуним",
        text: "Сотни хабадских нигуним, хасидские песни и свадебные мелодии – с аккордами и готовыми сетами.",
      },
      club: {
        title: "CLUB – сообщество",
        text: "Чистая лента музыки, нигуним и событий – без лишнего шума.",
      },
      date: {
        title: "MATY-DATE",
        text: "Новый формат знакомств вокруг музыки, нигуним и живых мероприятий.",
      },
      fit: {
        title: "MATY-FIT",
        text: "Программы тренировок, адаптированные к жизни музыканта и семьи.",
      },
      jam: {
        title: "JAM-группы",
        text: "Группы джема по городу, стилю и DAW – найдите музыкантов рядом.",
      },
    },

    sections: {
      howItWorks: {
        title: "Как это работает",
        steps: {
          step1Title: "Выберите стиль",
          step1Text:
            "Хабад, хасидская музыка, мизрахи, мягко или танцевально – или микс.",
          step2Title: "Соберите программу",
          step2Text:
            "Плейлисты, списки песен, структура фарбренгена и переходы.",
          step3Title: "Выход на сцену",
          step3Text:
            "Профессиональный звук, сопровождение и атмосфера, которую гости запомнят.",
        },
      },
      gear: {
        title: "Оборудование и звук",
        text: "Korg PA5X MG, профессиональная акустика, качественные микрофоны и микшер с записью.",
      },
      ai: {
        title: "MATY-AI",
        text: "Ассистент, который подбирает сеты, предлагает песни и учится на каждом мероприятии.",
      },
    },
  },

  music: {
    pageTitle: "Библиотека нигуним и песен",
    pageSubtitle:
      "Хабадские нигуним, хасидские песни, мизрахи, атмосферные композиции и готовые сеты для свадеб и фарбренгенов.",
    filters: {
      searchPlaceholder: "Поиск по песне, нигуну или исполнителю...",
      categoryLabel: "Категория",
      tempoLabel: "Темп",
      moodLabel: "Настроение",
      chabad: "Нигуним Хабада",
      hassidic: "Хасидская",
      mizrahi: "Мизрахи / хафла",
      soft: "Спокойная",
      dance: "Танцевальная",
    },
    table: {
      columns: {
        title: "Название",
        artist: "Исполнитель",
        category: "Категория",
        bpm: "BPM",
        key: "Тональность",
        length: "Длительность",
        actions: "Действия",
      },
      actions: {
        play: "Играть",
        pause: "Пауза",
        addToPlaylist: "В плейлист",
        viewChords: "Показать аккорды",
      },
    },
    messages: {
      empty:
        "Мы ещё загружаем основную библиотеку. Пока можно послушать первые треки.",
    },
  },

  events: {
    pageTitle: "События и заказ",
    pageDescription:
      "Календарь живых выступлений и форма для заказа свадьбы, хупы, бар/бат-мицвы и частных мероприятий.",
    list: {
      upcomingTitle: "Ближайшие события",
      pastTitle: "Прошедшие события",
      emptyUpcoming: "Сейчас нет публичных событий.",
      emptyPast: "Скоро появится большая галерея прошедших мероприятий.",
    },
    booking: {
      title: "Форма заказа мероприятия",
      eventTypeLabel: "Тип события",
      dateLabel: "Предполагаемая дата",
      locationLabel: "Место",
      guestsLabel: "Количество гостей",
      notesLabel: "Дополнительные замечания",
      eventTypes: {
        wedding: "Свадьба",
        chuppa: "Только хупа",
        barMitzvah: "Бар-мицва",
        batMitzvah: "Бат-мицва",
        farbrengen: "Фарбренген",
        community: "Общинное мероприятие",
        other: "Другое",
      },
      submitLabel: "Отправить заявку",
      successMessage:
        "Ваша заявка получена. Мы свяжемся с вами для уточнения деталей и даты.",
    },
  },

  club: {
    pageTitle: "CLUB – лента сообщества",
    pageSubtitle:
      "Посты, нигуним, видео, прямые эфиры и общинные события – всё в одном месте.",
    composer: {
      placeholder: "Чем хотите поделиться сегодня?",
      postButton: "Опубликовать",
      attachMedia: "Добавить фото / видео",
      attachAudio: "Добавить аудио",
      aiAssist: "MATY-AI – подсказать текст",
    },
    feed: {
      empty: "Постов пока нет – станьте первым.",
      loadMore: "Загрузить ещё посты",
    },
    post: {
      comments: "Комментарии",
      addCommentPlaceholder: "Добавить комментарий...",
      like: "Нравится",
      unlike: "Больше не нравится",
      share: "Поделиться",
      report: "Пожаловаться",
      you: "Вы",
      edited: "Изменено",
      justNow: "Только что",
    },
  },

  date: {
    pageTitle: "MATY-DATE – знакомства вокруг музыки",
    pageSubtitle:
      "Формат чистых знакомств вокруг нигуним, событий и живых выступлений.",
    profile: {
      myProfile: "Мой профиль",
      editProfile: "Редактировать профиль",
      musicTaste: "Музыкальные предпочтения",
      shabbat: "Шаббат и праздники",
      aboutMe: "О себе",
    },
    match: {
      suggestionsTitle: "Подборки знакомств",
      empty:
        "Скоро здесь появятся рекомендации на основе вашего музыкального профиля.",
      like: "Лайк",
      pass: "Пропустить",
      superLike: "Супер-лайк",
    },
  },

  fit: {
    pageTitle: "MATY-FIT – тренировки",
    pageSubtitle:
      "Планы тренировок под реальную жизнь музыканта, отца и работающего человека.",
    plan: {
      currentPlanTitle: "Текущий план",
      noPlan:
        "Пока нет активного плана. Мы построим устойчивую и реальную систему тренировок.",
    },
  },

  jam: {
    pageTitle: "JAM-группы – музыканты",
    pageSubtitle:
      "Найдите музыкантов по городу, стилю, инструменту и DAW, создайте джем-группы и коллаборации.",
    list: {
      filtersTitle: "Фильтр групп",
      genresLabel: "Жанры",
      dawsLabel: "DAW",
      cityLabel: "Город",
      joinButton: "Вступить в группу",
      leaveButton: "Выйти из группы",
      membersCount: "Участники",
    },
  },

  gallery: {
    pageTitle: "Галерея",
    pageSubtitle:
      "Фото и видео с выступлений, хуп, свадеб, фарбренгенов и особых моментов.",
    empty: "Совсем скоро здесь появятся новые фотографии и видео.",
  },

  payments: {
    paywall: {
      title: "Контент для подписчиков",
      description:
        "Часть материалов доступна только зарегистрированным пользователям или по подписке.",
      upgradeButton: "Оформить подписку",
    },
    checkout: {
      title: "Оплата и заказ",
      cardcomOption: "Оплата картой (Cardcom)",
      paypalOption: "PayPal",
      success: "Оплата прошла успешно.",
      failure:
        "Не удалось провести оплату. Проверьте данные или попробуйте ещё раз.",
    },
  },

  errors: {
    notFoundTitle: "Страница не найдена",
    notFoundText: "Возможно, ссылка неверна или страница была перемещена.",
    serverErrorTitle: "Ошибка сервера",
    serverErrorText: "Произошла ошибка на сервере. Попробуйте ещё раз позже.",
    unauthorizedTitle: "Нет доступа",
    unauthorizedText: "У вас нет прав для просмотра этой страницы.",
  },
};

/* ============================================================================
 *  EXPORT
 * ==========================================================================*/

const messagesByLocale: Record<Locale, Messages> = {
  he: heMessages,
  en: enMessages,
  fr: frMessages,
  ru: ruMessages,
};

export function getMessagesForLocale(rawLocale: string | null | undefined): {
  locale: Locale;
  messages: Messages;
} {
  const fallback: Locale = DEFAULT_LOCALE;
  const normalized =
    SUPPORTED_LOCALES.find((lc) => lc === rawLocale) ?? fallback;

  return {
    locale: normalized,
    messages: messagesByLocale[normalized],
  };
}
