export type AIGenStatus = "queued" | "running" | "done" | "error";

export type AIGenInput = {
  genre: "chabad" | "mizrahi" | "soft" | "fun";
  prompt: string;
  bpm?: number;
  key?: string; // למשל "Am"
  durationSec: number; // אורך בשניות
  seed?: number;
};

export type AITrack = {
  _id?: string;
  userId: string;
  title: string;
  input: AIGenInput;
  status: AIGenStatus;
  audioUrl?: string;
  mime?: string; // "audio/mpeg" וכו'
  tags?: string[];
  createdAt: Date;
  error?: string;
  jobId?: string;
};
