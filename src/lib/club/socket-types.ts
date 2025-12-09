// src/lib/club/socket-types.ts

export type ClubSocketHelloPayload = {
  userId: string | null;
  displayName?: string | null;
  areaName?: string | null;
  page?: "club" | "music" | "fit" | "date" | "jam" | "home" | "other";
  locale?: string;
};

export type ClubSocketPresencePayload = {
  onlineCount: number;
  areaName?: string | null;
  page?: string;
};

export type ClubSocketLiveItem = {
  _id: string;
  userId: string;
  userName?: string;
  userImage?: string;
  isAdmin?: boolean;
  lat?: number;
  lon?: number;
  areaName?: string;
  distanceKm?: number | null;
  kind?: "public" | "one_to_one" | "friends";
  startedAt?: string;
  lastPingAt?: string;
  isMe?: boolean;
};

export type ClubSocketLiveListPayload = {
  items: ClubSocketLiveItem[];
  source: "snapshot" | "update";
};

export type ClubSocketFeedEventPayload = {
  postId: string;
  kind: "like" | "comment" | "new_post";
  actorId: string;
  actorName?: string;
  at: string;
};

export type ClubSocketTypingPayload = {
  postId: string;
  userId: string;
  userName?: string;
  isTyping: boolean;
};

export type ClubSocketAiHintPayload = {
  scope: "feed" | "live" | "post";
  message: string;
  level: "info" | "tip" | "warning";
};

// מה הגיע אלינו מהשרת
export type ClubSocketInbound =
  | {
      kind: "hello_ack";
      payload: {
        ok: boolean;
        message?: string;
        onlineCount?: number;
      };
    }
  | {
      kind: "presence";
      payload: ClubSocketPresencePayload;
    }
  | {
      kind: "live_list";
      payload: ClubSocketLiveListPayload;
    }
  | {
      kind: "feed_event";
      payload: ClubSocketFeedEventPayload;
    }
  | {
      kind: "typing";
      payload: ClubSocketTypingPayload;
    }
  | {
      kind: "ai_hint";
      payload: ClubSocketAiHintPayload;
    }
  | {
      kind: "pong";
      payload?: { t?: number };
    };

// מה אנחנו שולחים לשרת
export type ClubSocketOutbound =
  | {
      kind: "hello";
      payload: ClubSocketHelloPayload;
    }
  | {
      kind: "ping";
      payload?: { t?: number };
    }
  | {
      kind: "subscribe_live";
      payload?: {
        lat?: number;
        lon?: number;
        radius?: number;
      };
    }
  | {
      kind: "unsubscribe_live";
      payload?: Record<string, never>;
    }
  | {
      kind: "typing";
      payload: ClubSocketTypingPayload;
    }
  | {
      kind: "feed_event";
      payload: ClubSocketFeedEventPayload;
    };

// סטטוס חיבור
export type ClubSocketStatus =
  | "idle"
  | "connecting"
  | "open"
  | "closed"
  | "error";
