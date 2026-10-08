export type SearchCategory =
  | "general"
  | "images"
  | "videos"
  | "news"
  | "map"
  | "files"
  | "science";

export type SearchResult = {
  title: string;
  url: string;
  content?: string;
  engine?: string;
  category?: string;
  template?: string;
  thumbnail?: string;
  thumbnail_src?: string;
  img_src?: string;
  iframe_src?: string;
  source?: string;
  resolution?: string;
  img_format?: string;
  publishedDate?: string;
  pubdate?: string;
  author?: string;
  views?: string;
  length?: string;
  [key: string]: unknown;
};

export type SearchResponse = {
  query: string;
  number_of_results?: number;
  results: SearchResult[];
  suggestions?: string[];
  infoboxes?: unknown[];
  answers?: unknown[];
};

export function getCategoryParam(category: SearchCategory) {
  return category === "general" ? "general" : category;
}
