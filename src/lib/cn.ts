// כלי קטן לאיחוד מחלקות CSS
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
