import type { Category } from "../types";

export const CATEGORIES: Category[] = ["work", "training", "learning", "leisure", "other"];

export const CATEGORY_BLOCK: Record<Category, string> = {
  work: "bg-blue-600 border-blue-400 text-white",
  training: "bg-emerald-600 border-emerald-400 text-white",
  learning: "bg-violet-600 border-violet-400 text-white",
  leisure: "bg-amber-600 border-amber-400 text-white",
  other: "bg-slate-600 border-slate-400 text-white",
};

export const CATEGORY_DOT: Record<Category, string> = {
  work: "bg-blue-500",
  training: "bg-emerald-500",
  learning: "bg-violet-500",
  leisure: "bg-amber-500",
  other: "bg-slate-500",
};
