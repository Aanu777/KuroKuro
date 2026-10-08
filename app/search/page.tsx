import ResultsClient from "@/components/ResultsClient";
import type { SearchCategory } from "@/lib/search";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const allowed: SearchCategory[] = ["general", "images", "videos", "news", "map", "files", "science"];
  const category = allowed.includes(params.category as SearchCategory) ? params.category as SearchCategory : "general";

  if (!query) return <div className="state">No search query.</div>;
  return <ResultsClient query={query} category={category} />;
}
