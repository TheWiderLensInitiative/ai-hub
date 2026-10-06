// Aggregation: collectors → normalize → filter → categorize → cluster → rank.
// All server-side. One broken source never breaks the page (allSettled).

import { collectFeed } from "./collectors/rss";
import { collectArxiv } from "./collectors/arxiv";
import { collectRepos, collectRepo } from "./collectors/github";
import { collectModel, collectModels, collectTrendingModels } from "./collectors/huggingface";
import { enabledFeeds } from "./sources/registry";
import { clusterArticles, rankClusters } from "./pipeline";
import { isAiRelevant, categorize, extractTags } from "./relevance";
import { companiesInText } from "./companies";
import { collectOpenRouterModels } from "./collectors/openrouter";
import type { Article, StoryCluster, AiModel, ResearchPaper, Repo, ProviderModel } from "./types";

// ─── In-process result cache ────────────────────────────────────────────────
// Next's fetch cache persists across requests, but many pages render in the
// same process (build, dev, warm serverless). This dedupes concurrent renders
// so one slow upstream is only ever fetched once per TTL window.
const inflight = new Map<string, { promise: Promise<unknown>; expires: number }>();

function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = inflight.get(key);
  if (hit && hit.expires > now) return hit.promise as Promise<T>;
  const promise = fn().catch((e) => {
    inflight.delete(key); // failures evict so the next call retries
    throw e;
  });
  inflight.set(key, { promise, expires: now + ttlMs });
  return promise;
}

function stableId(sourceId: string, url: string): string {
  let h = 0;
  const s = `${sourceId}|${url}`;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `${sourceId}-${Math.abs(h).toString(36)}`;
}

/** RSS/Atom feeds → normalized, filtered, categorized articles. */
export async function getArticles(): Promise<Article[]> {
  return cached("articles", 900_000, async () => {
    const feeds = enabledFeeds();
    const results = await Promise.allSettled(feeds.map((f) => collectFeed(f)));
    const articles: Article[] = [];
    results.forEach((r, i) => {
      if (r.status !== "fulfilled") {
        console.error(`[ai-hub] feed failed: ${feeds[i].id} — ${String(r.reason)}`);
        return;
      }
      const feed = feeds[i];
      for (const item of r.value) {
        if (!isAiRelevant(item.title, item.description)) continue;
        const publishedAt = item.pubDate ?? new Date().toISOString();
        const companies = companiesInText(`${item.title} ${item.description}`);
        const category = categorize(item.title, item.description);
        articles.push({
          id: stableId(feed.id, item.link),
          title: item.title,
          description: item.description || item.title,
          url: item.link,
          imageUrl: item.imageUrl ?? undefined,
          source: feed.name,
          sourceType: feed.type,
          author: item.author ?? undefined,
          publishedAt,
          category,
          tags: extractTags(item.title, item.description, companies),
          companies,
          importanceScore: 0, // set by rankClusters via cluster
        });
      }
    });
    return articles;
  });
}

/** Full story pipeline: articles → clustered + ranked stories. */
export async function getStories(): Promise<StoryCluster[]> {
  return cached("stories", 900_000, async () => {
    const articles = await getArticles();
    return rankClusters(clusterArticles(articles));
  });
}

/** Stories from roughly the last N days. */
export async function getStoriesForDays(days: number): Promise<StoryCluster[]> {
  const stories = await getStories();
  const cutoff = Date.now() - days * 24 * 3_600_000;
  return stories.filter((s) => +new Date(s.publishedAt) >= cutoff);
}

/** Stories from roughly the last 24 hours. */
export async function getTodayStories(): Promise<StoryCluster[]> {
  return getStoriesForDays(1);
}

export async function getModels(): Promise<AiModel[]> {
  return cached("models", 3_600_000, async () => {
    try {
      return await collectModels(30);
    } catch (e) {
      console.error(`[ai-hub] huggingface models failed — ${String(e)}`);
      return [];
    }
  });
}

export async function getTrendingModels(): Promise<AiModel[]> {
  return cached("models-trending", 3_600_000, async () => {
    try {
      return await collectTrendingModels(12);
    } catch (e) {
      console.error(`[ai-hub] huggingface trending failed — ${String(e)}`);
      return [];
    }
  });
}

/** Newly onboarded models via OpenRouter, sorted by real release timestamp. */
export async function getProviderModels(): Promise<ProviderModel[]> {
  return cached("models-provider", 3_600_000, async () => {
    try {
      return await collectOpenRouterModels(15);
    } catch (e) {
      console.error(`[ai-hub] openrouter failed — ${String(e)}`);
      return [];
    }
  });
}

export async function getPapers(): Promise<ResearchPaper[]> {
  return cached("papers", 3_600_000, async () => {
    try {
      return await collectArxiv(30);
    } catch (e) {
      console.error(`[ai-hub] arxiv failed — ${String(e)}`);
      return [];
    }
  });
}

/** Models published by The Wider Lens on the Hugging Face Hub, shown apart from the tracker lists. */
export async function getOwnModels(): Promise<AiModel[]> {
  return cached("own-models", 3_600_000, async () => {
    try {
      return [await collectModel("TheWiderLensInitiative/laya-for-clara")];
    } catch (e) {
      console.error(`[ai-hub] huggingface (own models) failed — ${String(e)}`);
      return [];
    }
  });
}

/** Open-source projects made by The Wider Lens, shown apart from the ranked list. */
export async function getOwnRepos(): Promise<Repo[]> {
  return cached("own-repos", 1_800_000, async () => {
    try {
      return [await collectRepo("TheWiderLensInitiative/clara")];
    } catch (e) {
      console.error(`[ai-hub] github (own repos) failed — ${String(e)}`);
      return [];
    }
  });
}

export async function getRepos(): Promise<Repo[]> {
  return cached("repos", 1_800_000, async () => {
    try {
      return await collectRepos(6, 12);
    } catch (e) {
      console.error(`[ai-hub] github failed — ${String(e)}`);
      return [];
    }
  });
}
