// src/app/ai/page.tsx
import AiGlobalSearchPage from "@/components/ai/AiGlobalSearchPage";
import AiPage from "@/components/ai/AiPage";

type AiMode = "setlist" | "lyrics" | "tips";
type RouteMode = AiMode | "search";

type Props = {
  searchParams?: {
    mode?: string;
    q?: string;
  };
};

export default function AiRoute({ searchParams }: Props) {
  const rawMode = (searchParams?.mode as RouteMode | undefined) || "setlist";
  const initialQuery = (searchParams?.q as string | undefined) || "";

  const mode: RouteMode = ["setlist", "lyrics", "tips", "search"].includes(
    rawMode,
  )
    ? rawMode
    : "setlist";

  if (mode === "search") {
    // מצב חדש: חיפוש AI על כל האתר
    return <AiGlobalSearchPage initialQuery={initialQuery} />;
  }

  // המצב הישן שלך – סטים, מילים, טיפים
  return <AiPage initialMode={mode as AiMode} />;
}
