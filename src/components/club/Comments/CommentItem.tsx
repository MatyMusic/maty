// src/components/club/Comments/CommentItem.tsx
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  ThumbsUp,
  Reply,
  Pencil,
  Trash2,
  Flag,
  Link as LinkIcon,
  User as UserIcon,
} from "lucide-react";

type Item = {
  _id: string;
  authorName?: string | null;
  authorAvatar?: string | null;
  authorId: string;
  text: string;
  createdAt: string | Date;
  likes?: number;
  // אופציונלי: אם תרצה להציג כמה תגובות משנה (במידה ותוסיף thread)
  repliesCount?: number;
};

type Props = {
  item: Item;
  onReply?: (item: Item) => void;
  onDelete?: (id: string) => void;
  onLike?: (id: string) => void | Promise<void>;
  /** מצב עריכה אופציונלי — אם לא תעביר, לא יוצג */
  canEdit?: boolean;
  /** האם המשתמש נוכחי הוא המחבר — להפעלת עריכה */
  isAuthor?: boolean;
  /** האם אדמין — למחיקה/ניהול */
  isAdmin?: boolean;
  /** שמירת עריכה — אם לא תעביר, נשמור לוקאלית בלבד ולא נציג עריכה */
  onEdit?: (id: string, newText: string) => void | Promise<boolean>;
  /** דיווח / העברת לדף פרופיל / קופי לינק — אופציונלי */
  onReport?: (id: string) => void;
  onCopyLink?: (id: string) => void;
  onViewProfile?: (authorId: string) => void;
};

export default function CommentItem({
  item,
  onReply,
  onDelete,
  onLike,
  canEdit = true,
  isAuthor = false,
  isAdmin = false,
  onEdit,
  onReport,
  onCopyLink,
  onViewProfile,
}: Props) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [liked, setLiked] = React.useState(false);
  const [likes, setLikes] = React.useState(item.likes || 0);
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(item.text || "");
  const [busy, setBusy] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const created = React.useMemo(
    () => (item.createdAt ? new Date(item.createdAt) : new Date()),
    [item.createdAt],
  );

  const rel = React.useMemo(() => formatRelative(created), [created]);

  // מניעת טקסט ארוך שמפרק את הפיד
  const isLong = (item.text || "").length > 500;

  async function handleLike() {
    if (!onLike || liked) return;
    setLiked(true);
    setLikes((n) => n + 1); // אופטימי
    try {
      await onLike(String(item._id));
    } catch {
      // במקרה כשל — החזר
      setLiked(false);
      setLikes((n) => Math.max(0, n - 1));
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setBusy(true);
    try {
      await onDelete(String(item._id));
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit() {
    if (!onEdit) return setIsEditing(false);
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    try {
      const ok = (await onEdit(String(item._id), text)) ?? true;
      if (ok) {
        setIsEditing(false);
      }
    } finally {
      setBusy(false);
    }
  }

  const bodyNode = isEditing ? (
    <div className="mt-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        dir="rtl"
        className="w-full min-h-[84px] rounded-xl p-3 outline-none bg-background border"
        placeholder="עדכן את התגובה…"
      />
      <div className="mt-2 flex gap-2 text-sm">
        <button
          onClick={handleSaveEdit}
          disabled={busy || !draft.trim()}
          className="px-3 py-1.5 rounded-lg border hover:shadow disabled:opacity-50"
        >
          שמור
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setDraft(item.text || "");
          }}
          className="px-3 py-1.5 rounded-lg border"
        >
          ביטול
        </button>
      </div>
    </div>
  ) : (
    <div className="mt-1 text-sm whitespace-pre-wrap">
      {linkify(
        expanded || !isLong
          ? item.text || ""
          : (item.text || "").slice(0, 500) + "…",
      )}
      {isLong && !expanded && (
        <button
          className="ms-2 text-xs underline opacity-80 hover:opacity-100"
          onClick={() => setExpanded(true)}
        >
          הצג עוד
        </button>
      )}
    </div>
  );

  return (
    <div className="flex gap-3 py-3" dir="rtl">
      <Avatar
        src={item.authorAvatar}
        name={item.authorName || "משתמש"}
        onClick={() => onViewProfile?.(item.authorId)}
      />
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <b
              className="cursor-pointer hover:underline"
              onClick={() => onViewProfile?.(item.authorId)}
            >
              {item.authorName || "משתמש"}
            </b>
            <span className="opacity-60">• {rel}</span>
          </div>

          <div className="relative">
            <button
              className="p-1 rounded hover:bg-muted/40"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="תפריט תגובה"
              title="עוד"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                className="absolute end-0 mt-1 z-10 min-w-[160px] rounded-xl border bg-background shadow"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <MenuItem
                  icon={<Reply className="w-4 h-4" />}
                  label="השב"
                  onClick={() => {
                    setMenuOpen(false);
                    onReply?.(item);
                  }}
                />
                {canEdit && isAuthor && (
                  <MenuItem
                    icon={<Pencil className="w-4 h-4" />}
                    label="ערוך"
                    onClick={() => {
                      setMenuOpen(false);
                      setIsEditing(true);
                    }}
                  />
                )}
                {(isAdmin || isAuthor) && onDelete && (
                  <MenuItem
                    icon={<Trash2 className="w-4 h-4" />}
                    label="מחק"
                    onClick={() => {
                      setMenuOpen(false);
                      handleDelete();
                    }}
                  />
                )}
                {onCopyLink && (
                  <MenuItem
                    icon={<LinkIcon className="w-4 h-4" />}
                    label="קישור לתגובה"
                    onClick={() => {
                      setMenuOpen(false);
                      onCopyLink(String(item._id));
                    }}
                  />
                )}
                {onReport && (
                  <MenuItem
                    icon={<Flag className="w-4 h-4" />}
                    label="דווח"
                    onClick={() => {
                      setMenuOpen(false);
                      onReport(String(item._id));
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {bodyNode}

        <div className="mt-2 flex items-center gap-4 text-xs">
          <button
            className={`inline-flex items-center gap-1 opacity-80 hover:opacity-100 ${liked ? "font-semibold" : ""}`}
            onClick={handleLike}
            aria-label="לייק לתגובה"
            title="לייק"
            disabled={liked}
          >
            <ThumbsUp className="w-4 h-4" />
            לייק ({likes})
          </button>

          <button
            className="inline-flex items-center gap-1 opacity-80 hover:opacity-100"
            onClick={() => onReply?.(item)}
            aria-label="השב לתגובה"
            title="השב"
          >
            <Reply className="w-4 h-4" />
            השב
            {typeof item.repliesCount === "number" && item.repliesCount > 0 && (
              <span className="opacity-60">({item.repliesCount})</span>
            )}
          </button>

          {(isAdmin || isAuthor) && onDelete && (
            <button
              className="inline-flex items-center gap-1 opacity-60 hover:opacity-100"
              onClick={handleDelete}
              aria-label="מחק תגובה"
              title="מחק"
              disabled={busy}
            >
              <Trash2 className="w-4 h-4" />
              מחק
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ======================= Helpers & Subcomponents ======================= */

function Avatar({
  src,
  name,
  onClick,
}: {
  src?: string | null;
  name: string;
  onClick?: () => void;
}) {
  if (!src) {
    return (
      <div
        onClick={onClick}
        className="w-9 h-9 rounded-full bg-muted text-foreground/80 flex items-center justify-center cursor-pointer select-none"
        title={name}
        aria-label={name}
      >
        <UserIcon className="w-4 h-4" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      title={name}
      onClick={onClick}
      className="w-9 h-9 rounded-full object-cover cursor-pointer"
    />
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="w-full flex items-center gap-2 px-3 py-2 text-start text-sm hover:bg-muted/40"
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// לינקיפיי פשוט (ללא innerHTML, מונע XSS)
function linkify(text: string) {
  const parts: Array<string | JSX.Element> = [];
  const urlRe = /((https?:\/\/|www\.)[^\s/$.?#].[^\s]*)/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = urlRe.exec(text)) !== null) {
    const start = match.index;
    const url = match[0];
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    const href = url.startsWith("http") ? url : `https://${url}`;
    parts.push(
      <a
        key={`${start}-${href}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:opacity-90"
      >
        {url}
      </a>,
    );
    lastIndex = urlRe.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <>{parts}</>;
}

function formatRelative(date: Date) {
  const diff = Date.now() - date.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "לפני כמה שניות";
  const min = Math.round(sec / 60);
  if (min < 60) return `לפני ${min} דק׳`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `לפני ${hr} ש׳`;
  const day = Math.round(hr / 24);
  if (day < 30) return `לפני ${day} ימים`;
  // תאריך מלא אם ישן
  try {
    return date.toLocaleString("he-IL");
  } catch {
    return date.toISOString();
  }
}
