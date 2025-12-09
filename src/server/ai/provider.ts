// src/server/ai/provider.ts
import type { AIGenInput } from "@/types/ai";

/* ========== Types & Interface ========== */
export interface AIProvider {
  generate(input: AIGenInput): Promise<{ jobId: string }>;
  status(jobId: string): Promise<{
    status: "queued" | "running" | "done" | "error";
    audioUrl?: string;
    mime?: string;
    error?: string;
  }>;
}

/* ========== Utils ========== */
function getEnv(name: string, fallback = "") {
  const v = process.env[name];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

// בסיס ה־URL של האתר שלך (ל-dev ול-prod)
function siteOrigin() {
  return (
    getEnv("NEXT_PUBLIC_SITE_URL") ||
    getEnv("SITE_URL") ||
    "http://localhost:3000"
  );
}

// מזהה Job עם timestamp בפנים → מאפשר לחשב סטטוס לפי זמן בלי זיכרון גלובלי
function makeJobId() {
  const ts = Date.now();
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${ts}_${rnd}`;
}
function parseTsFromJobId(jobId: string) {
  const ts = Number(jobId.split("_")[0]);
  return Number.isFinite(ts) ? ts : Date.now();
}

/* ========== 1) Dummy Provider ========== */
class DummyProvider implements AIProvider {
  async generate(_input: AIGenInput) {
    // מיידי: לא מדמה תור
    return { jobId: makeJobId() };
  }
  async status(_jobId: string) {
    return {
      status: "done",
      audioUrl: `${siteOrigin()}/audio/test.mp3`,
      mime: "audio/mpeg",
    };
  }
}

/* ========== 2) Sim Provider (queued→running→done) ========== */
class SimProvider implements AIProvider {
  private doneMs = Number(getEnv("AI_SIM_DONE_MS", "3000")); // זמן עד DONE
  private runningMs = Number(getEnv("AI_SIM_RUNNING_MS", "1200")); // אחרי זה → running
  private audioPath = getEnv("AI_SIM_AUDIO_PATH", "/audio/test.mp3");
  private mime = getEnv("AI_SIM_MIME", "audio/mpeg");
  private errRate = Number(getEnv("AI_SIM_ERROR_RATE", "0")); // 0..1

  async generate(_input: AIGenInput) {
    return { jobId: makeJobId() };
  }

  async status(jobId: string) {
    // שגיאה אקראית (אם הוגדר)
    if (this.errRate > 0 && Math.random() < this.errRate) {
      return { status: "error" as const, error: "simulated_error" };
    }

    const start = parseTsFromJobId(jobId);
    const elapsed = Date.now() - start;

    if (elapsed < this.runningMs) return { status: "queued" as const };
    if (elapsed < this.doneMs) return { status: "running" as const };

    return {
      status: "done" as const,
      audioUrl: `${siteOrigin()}${this.audioPath}`,
      mime: this.mime,
    };
  }
}

/* ========== 3) HTTP Provider (API חיצוני) ========== */
/*
  מצפה ל:
  - AI_HTTP_GEN_URL    (POST)  ← מקבל JSON של input ומחזיר { jobId }
  - AI_HTTP_STATUS_URL (GET)   ← נקרא עם ?jobId= ומחזיר { status, audioUrl?, mime?, error? }
  - AI_HTTP_API_KEY    (אופציונלי) יישלח בכותרת Authorization: Bearer <KEY>
*/
class HttpProvider implements AIProvider {
  private genUrl = getEnv("AI_HTTP_GEN_URL");
  private statusUrl = getEnv("AI_HTTP_STATUS_URL");
  private apiKey = getEnv("AI_HTTP_API_KEY", "");

  private async fetchJson(input: RequestInfo | URL, init?: RequestInit) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as any),
    };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;
    const res = await fetch(input, { ...init, headers, cache: "no-store" });
    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const j = await res.json();
        errMsg = j?.error || errMsg;
      } catch {}
      throw new Error(errMsg);
    }
    return res.json();
  }

  async generate(input: AIGenInput) {
    if (!this.genUrl) throw new Error("Missing AI_HTTP_GEN_URL");
    const data = await this.fetchJson(this.genUrl, {
      method: "POST",
      body: JSON.stringify(input),
    });
    const jobId = String(data?.jobId || "");
    if (!jobId) throw new Error("Bad response: missing jobId");
    return { jobId };
  }

  async status(jobId: string) {
    if (!this.statusUrl) throw new Error("Missing AI_HTTP_STATUS_URL");
    const url = new URL(this.statusUrl);
    url.searchParams.set("jobId", jobId);
    const data = await this.fetchJson(url.toString(), { method: "GET" });

    // מצופה מהשירות להחזיר: status, audioUrl?, mime?, error?
    const st = (data?.status || "").toLowerCase();
    if (!["queued", "running", "done", "error"].includes(st)) {
      throw new Error("Bad status from provider");
    }
    return {
      status: st as "queued" | "running" | "done" | "error",
      audioUrl: data?.audioUrl,
      mime: data?.mime,
      error: data?.error,
    };
  }
}

/* ========== Provider Selector ========== */
const KIND = getEnv("AI_PROVIDER", "sim").toLowerCase();
// אפשרויות: "dummy" | "sim" | "http"
let selected: AIProvider;
switch (KIND) {
  case "dummy":
    selected = new DummyProvider();
    break;
  case "http":
    selected = new HttpProvider();
    break;
  case "sim":
  default:
    selected = new SimProvider();
    break;
}
export const provider: AIProvider = selected;
