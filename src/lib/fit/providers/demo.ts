import type { ExerciseItem } from "@/types/fit";
import { slugify } from "@/lib/fit/util";

const DEMO: ExerciseItem[] = [
  {
    id: "demo:31",
    provider: "demo",
    name: "לחיצת חזה בדאמבלים",
    slug: slugify("לחיצת חזה בדאמבלים"),
    muscle: "חזה",
    equipment: ["דאמבלים", "ספסל"],
    level: "בינוני",
    instructions: "שכב על ספסל, דאמבלים מעל החזה, הורדה איטית ודחיפה.",
    images: ["/assets/images/fit/exercises/chest-press.jpg"],
  },
  {
    id: "demo:44",
    provider: "demo",
    name: "סקוואט חופשי",
    slug: slugify("סקוואט חופשי"),
    muscle: "רגליים",
    equipment: ["מוט"],
    level: "בינוני",
    instructions: "עמידה ברוחב כתפיים, ירידה נשלטת ועלייה עם גב ניטרלי.",
    images: ["/assets/images/fit/exercises/squat.jpg"],
  },
];

export async function demoList(): Promise<ExerciseItem[]> {
  return DEMO;
}
export async function demoGet(id: string) {
  return DEMO.find((x) => x.id === id) || null;
}
