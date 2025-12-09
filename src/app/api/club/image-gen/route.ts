// src/app/api/club/image-gen/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Provider = "huggingface" | "openai" | "stability" | "replicate";

type Body = {
  prompt?: string;
  kind?: "avatar" | "cover" | "post-image" | "background";
  style?: string;
  provider?: Provider;
};

type AiImageResult = {
  ok: boolean;
  url?: string;
  provider?: Provider;
  prompt?: string;
  kind?: string;
  style?: string;
  error?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    const prompt = (body.prompt || "").trim();
    const kind = body.kind || "post-image";
    const style = body.style || "";
    const provider: Provider =
      body.provider ||
      (process.env.MATY_IMAGE_PROVIDER as Provider) ||
      "huggingface";

    if (!prompt) {
      return NextResponse.json<AiImageResult>(
        { ok: false, error: "missing_prompt" },
        { status: 400 },
      );
    }

    let url: string | undefined;

    if (provider === "huggingface") {
      url = await callHuggingFaceImageApi(prompt, kind, style);
    } else if (provider === "openai") {
      url = await callOpenAiImageApi(prompt, kind, style);
    } else if (provider === "stability") {
      url = await callStabilityImageApi(prompt, kind, style);
    } else if (provider === "replicate") {
      url = await callReplicateImageApi(prompt, kind, style);
    }

    if (!url) {
      return NextResponse.json<AiImageResult>(
        {
          ok: false,
          error: "image_generation_failed",
          provider,
        },
        { status: 500 },
      );
    }

    return NextResponse.json<AiImageResult>({
      ok: true,
      url,
      provider,
      prompt,
      kind,
      style,
    });
  } catch (err: any) {
    console.error("[/api/club/image-gen] error:", err);
    return NextResponse.json<AiImageResult>(
      { ok: false, error: err?.message || "server_error" },
      { status: 500 },
    );
  }
}

/* ───────── HUGGING FACE – טקסט→תמונה (router.huggingface.co) ───────── */

async function callHuggingFaceImageApi(
  prompt: string,
  kind: string,
  style: string,
): Promise<string | undefined> {
  const apiKey = process.env.HF_TOKEN;
  if (!apiKey) {
    console.warn("[image-gen] missing HF_TOKEN");
    return undefined;
  }

  const modelId =
    process.env.HF_IMAGE_MODEL_ID || "black-forest-labs/FLUX.1-dev";
  const fullPrompt = buildFullPrompt(prompt, kind, style);

  // 💡 שימוש ב-router.huggingface.co במקום api-inference.huggingface.co
  const url = `https://router.huggingface.co/models/${modelId}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "image/png",
    },
    body: JSON.stringify({
      inputs: fullPrompt,
    }),
  });

  if (!res.ok) {
    const errText = await safeText(res);
    console.error(
      "[image-gen] HuggingFace error",
      res.status,
      res.statusText,
      errText,
    );
    return undefined;
  }

  // HF מחזיר בינארי של תמונה – ממירים ל-data URL
  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;
  return dataUrl;
}

/* ───────── ספקים אחרים – TODO (נשארים כ-STUB) ───────── */

async function callOpenAiImageApi(
  prompt: string,
  kind: string,
  style: string,
): Promise<string | undefined> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[image-gen] missing OPENAI_API_KEY");
    return undefined;
  }

  const fullPrompt = buildFullPrompt(prompt, kind, style);
  console.log("[image-gen] callOpenAiImageApi demo prompt:", fullPrompt);

  // כאן בעתיד תוכל להוסיף את הקריאה האמיתית ל-OpenAI
  return undefined;
}

async function callStabilityImageApi(
  prompt: string,
  kind: string,
  style: string,
): Promise<string | undefined> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    console.warn("[image-gen] missing STABILITY_API_KEY");
    return undefined;
  }

  const fullPrompt = buildFullPrompt(prompt, kind, style);
  console.log("[image-gen] callStabilityImageApi demo prompt:", fullPrompt);

  // כאן בעתיד תוסיף קריאה ל-Stability (Stable Diffusion וכו')
  return undefined;
}

async function callReplicateImageApi(
  prompt: string,
  kind: string,
  style: string,
): Promise<string | undefined> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.warn("[image-gen] missing REPLICATE_API_TOKEN");
    return undefined;
  }

  const fullPrompt = buildFullPrompt(prompt, kind, style);
  console.log("[image-gen] callReplicateImageApi demo prompt:", fullPrompt);

  // כאן בעתיד תוסיף קריאה ל-Replicate
  return undefined;
}

/* ───────── עזר – בניית פרומפט "חכם" לפי סוג ───────── */

function buildFullPrompt(prompt: string, kind: string, style: string): string {
  const base =
    kind === "avatar"
      ? "3d game character avatar, high quality, clean background, sharp lighting, full body or bust"
      : kind === "cover"
        ? "cinematic wide artwork, social media cover, detailed but clean composition, high resolution"
        : kind === "background"
          ? "abstract but clean background, soft gradients, subtle shapes, suitable for app UI"
          : "social media post illustration, clear main subject, visually striking but not too busy";

  const stylePart = style ? `, style: ${style}` : "";
  return `${base}${stylePart}. concept: ${prompt}`;
}

async function safeText(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t;
  } catch {
    return "";
  }
}
