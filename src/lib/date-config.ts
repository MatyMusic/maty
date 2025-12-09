// src/lib/date-config.ts
export const DATE_CONF = {
  CHAT_REQUIRE_MUTUAL_LIKE: true, // צ'אט רק אחרי לייק הדדי
  MAX_MEDIA_PER_USER: 12,
  RATE_LIMIT: {
    WINDOW_SEC: 30,
    MAX_REQ: 60, // לכל משתמש/דפוס
  },
  SEARCH: {
    PAGE_SIZE: 24,
    MAX_PAGE_SIZE: 60,
  },
};
