// src/app/api/date/profile/suggestions/route.ts
import {
  computeProfileCompleteness,
  type ProfileLike,
} from "@/lib/date/completeness";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SuggestionsRequestBody = {
  profile: ProfileLike;
};

type SuggestionsSuccessResponse = {
  ok: true;
  percent: number;
  missingLabels: string[];
  suggestions: string[];
  summary: string;
};

type SuggestionsErrorResponse = {
  ok: false;
  error: string;
};

const SUGGESTION_BY_LABEL: Record<string, string> = {
  שם: "מומלץ למלא שם פרטי ברור – זה מעלה אמון ומגדיל את כמות הפניות.",
  "תאריך לידה":
    "מומלץ למלא תאריך לידה מדויק – כך המערכת תוכל להציע התאמות טובות יותר בגיל.",
  מין: "בחירה במין שלך עוזרת לנו להבין למי להציג אותך ולמי לחפש עבורך.",
  מדינה: "מומלץ לבחור מדינה – התאמות לפי מיקום הן קריטיות לדייטים.",
  עיר: "הוספת עיר מאפשרת התאמות מקומיות יותר ומשפרת את הסיכוי למפגשים אמיתיים.",
  שפות: "הוספת שפות עוזרת לנו למצוא אנשים שמדברים בשפה שאתה מרגיש בה בבית.",
  "זרם ביהדות":
    "מומלץ להגדיר את הזרם הדתי שלך – זה שדה משמעותי להתאמות בקהל שלך.",
  "רמת כשרות":
    "הגדרת רמת כשרות עוזרת לנו להימנע מהתאמות שלא יתאימו לסגנון החיים שלך.",
  "שמירת שבת":
    "שמירת שבת היא פקטור חשוב – שווה לציין כדי לחסוך חוסר התאמות מיותר.",
  מטרה: "כדאי לבחור מטרה (קשר רציני, נישואין, חברות) – זה מונע ציפיות לא תואמות.",
};

function buildSummary(percent: number, missingLabels: string[]): string {
  if (percent >= 90) {
    return "הפרופיל שלך כמעט מלא – נגיעה קלה בשדות החסרים תשדרג אותו ל־100%.";
  }
  if (percent >= 70) {
    return "יש לך פרופיל טוב, אבל כמה שדות חסרים ימנעו התאמות חזקות – שווה להשלים אותם.";
  }
  if (percent >= 40) {
    return "הפרופיל חלקי – מומלץ להשקיע עוד כמה דקות ולהשלים את הפרטים הבסיסיים.";
  }
  if (!missingLabels.length) {
    return "הפרופיל שלך נראה מלא, אבל הציון נמוך – שווה לבדוק שוב את השדות החשובים.";
  }
  return "הפרופיל עדיין בתחילת הדרך – אחרי שתמלא את השדות החסרים נקפיץ לך את כמות ההתאמות.";
}

export async function POST(
  req: NextRequest,
): Promise<
  NextResponse<SuggestionsSuccessResponse | SuggestionsErrorResponse>
> {
  try {
    const body = (await req.json()) as SuggestionsRequestBody | null;

    if (!body?.profile) {
      return NextResponse.json(
        { ok: false, error: "missing_profile" },
        { status: 400 },
      );
    }

    const result = computeProfileCompleteness(body.profile);
    const { percent, missingLabels } = result;

    const suggestions = missingLabels.map((label) => {
      return (
        SUGGESTION_BY_LABEL[label] ||
        `מומלץ להשלים את השדה "${label}" כדי לחזק את הפרופיל.`
      );
    });

    const summary = buildSummary(percent, missingLabels);

    return NextResponse.json(
      {
        ok: true,
        percent,
        missingLabels,
        suggestions,
        summary,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("POST /api/date/profile/suggestions error:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
