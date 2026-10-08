import ResultsClient from "@/components/ResultsClient";
import SearchEmptyState from "@/components/SearchEmptyState";
import type { SearchCategory } from "@/lib/search";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; pageno?: string; time_range?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const allowed: SearchCategory[] = ["general", "images", "videos", "news", "map", "files", "science"];
  const category = allowed.includes(params.category as SearchCategory)
    ? (params.category as SearchCategory)
    : "general";

  const parsedPage = Number.parseInt(params.pageno || "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 50) : 1;
  const allowedRanges = ["", "day", "week", "month", "year"];
  const timeRange = allowedRanges.includes(params.time_range || "") ? params.time_range || "" : "";

  if (!query) return <SearchEmptyState />;

  return (
    <ResultsClient
      query={query}
      category={category}
      page={page}
      timeRange={timeRange}
    />
  );
}
