// src/lib/date/room-id.ts
export function dmRoomId(a: string, b: string) {
  return ["dm", ...[a, b].sort()].join(":");
}
