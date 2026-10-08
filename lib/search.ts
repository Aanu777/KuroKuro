export type SearchCategory = "general" | "images" | "videos" | "news" | "map" | "files" | "science";

export type SearchResult = {
  title: string;
  url: string;
  content?: string;
  engine?: string;
  category?: string;
  thumbnail?: string;
};

export type SearchResponse = {
  query: string;
  number_of_results?: number;
  results: SearchResult[];
  suggestions?: string[];
  infoboxes?: unknown[];
};

export function getCategoryParam(category: SearchCategory) {
  if (category === "general") return "general";
  return category;
}
