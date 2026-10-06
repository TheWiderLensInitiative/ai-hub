// Hugging Face Hub collector. Public API, no key required.
// Reports only real Hub metadata — never invented specs or growth numbers.

import { fetchJson } from "../fetch";
import { REVALIDATE } from "../sources/registry";
import type { AiModel } from "../types";

interface HubModelJson {
  id: string;
  author: string;
  likes: number;
  downloads?: number;
  tags: string[];
  pipeline_tag?: string | null;
  library_name?: string | null;
  createdAt?: string;
  lastModified?: string;
  private?: boolean;
  gated?: boolean | string;
  sha?: string;
}

const OPEN_LICENSE_HINTS = ["apache-2.0", "mit", "bsd", "cc-by", "openrail", "gpl", "artistic-2.0", "unlicense"];

function taskBucket(pipelineTag?: string | null, tags: string[] = []): AiModel["task"] {
  const t = (pipelineTag ?? "").toLowerCase();
  const tagSet = tags.map((x) => x.toLowerCase());
  const has = (...ws: string[]) => ws.some((w) => t.includes(w) || tagSet.some((x) => x.includes(w)));
  if (has("reasoning")) return "reasoning";
  if (has("text-generation", "text2text-generation", "conversational")) return "llm";
  if (has("text-to-image", "image-to-image", "unconditional-image-generation", "image")) return "image";
  if (has("text-to-video", "video")) return "video";
  if (has("text-to-speech", "automatic-speech-recognition", "audio", "speech")) return "audio";
  if (has("code", "fill-mask") && has("code")) return "coding";
  if (has("feature-extraction", "sentence-similarity", "embedding")) return "embeddings";
  if (has("multimodal", "image-text-to-text", "visual-question-answering")) return "multimodal";
  if (t) return "other";
  return "other";
}

function openWeights(tags: string[]): boolean | null {
  const lower = tags.map((x) => x.toLowerCase());
  if (lower.some((x) => OPEN_LICENSE_HINTS.some((h) => x.includes(h)))) return true;
  if (lower.some((x) => x.includes("license:other") || x.includes("unknown"))) return null;
  return null; // unknown — never guess
}

function toModel(j: HubModelJson): AiModel {
  const tags = j.tags ?? [];
  return {
    id: j.id,
    name: j.id.split("/").pop() ?? j.id,
    author: j.author,
    authorUrl: `https://huggingface.co/${j.author}`,
    url: `https://huggingface.co/${j.id}`,
    pipelineTag: j.pipeline_tag ?? undefined,
    tags: tags.slice(0, 12),
    likes: j.likes ?? 0,
    downloads: j.downloads ?? 0,
    lastModified: j.lastModified ?? j.createdAt ?? new Date().toISOString(),
    createdAt: j.createdAt,
    gated: j.gated === true || j.gated === "true" || j.gated === "auto",
    license: tags.find((x) => x.toLowerCase().startsWith("license:"))?.replace(/^license:/i, ""),
    library: j.library_name ?? undefined,
    task: taskBucket(j.pipeline_tag, tags),
    openWeights: openWeights(tags),
  };
}

/** Recently updated models with real community traction (likes/downloads). */
export async function collectModels(limit = 30): Promise<AiModel[]> {
  const url =
    `https://huggingface.co/api/models?sort=lastModified&direction=-1` +
    `&limit=${limit}&filter=&full=false&config=false`;
  const data = await fetchJson<HubModelJson[]>(url, { timeoutMs: 15000, revalidate: REVALIDATE.models });
  return data.map(toModel);
}

/** One model by id (e.g. our own), with the same real Hub metadata as the lists. */
export async function collectModel(id: string): Promise<AiModel> {
  const url = `https://huggingface.co/api/models/${id}`;
  return toModel(await fetchJson<HubModelJson>(url, { timeoutMs: 15000, revalidate: REVALIDATE.models }));
}

/** Most-liked models — a stable "interesting right now" list. */
export async function collectTrendingModels(limit = 15): Promise<AiModel[]> {
  const url =
    `https://huggingface.co/api/models?sort=likes&direction=-1` +
    `&limit=${limit}&filter=&full=false&config=false`;
  const data = await fetchJson<HubModelJson[]>(url, { timeoutMs: 15000, revalidate: REVALIDATE.models });
  return data.map(toModel);
}
