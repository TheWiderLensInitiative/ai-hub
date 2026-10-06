import type { Metadata } from "next";
import Link from "next/link";
import { getModels, getTrendingModels, getProviderModels, getOwnModels } from "@/lib/data";
import { ModelCard, ProviderModelCard, SectionHeader, EmptyState } from "@/components/cards";
import { OwnModelCard } from "@/components/clara-card";
import { TASK_LABELS } from "@/lib/format";

export const revalidate = 3600; // 60 min — model trackers

export const metadata: Metadata = {
  title: "Model Tracker",
  description: "Recently updated and most-liked AI models on the Hugging Face Hub, with real metadata.",
};

const TASKS = ["llm", "image", "video", "audio", "coding", "embeddings", "reasoning", "multimodal"] as const;

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>;
}) {
  const { task } = await searchParams;
  const [models, trending, fresh, own] = await Promise.all([getModels(), getTrendingModels(), getProviderModels(), getOwnModels()]);
  const filtered = task ? models.filter((m) => m.task === task) : models;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Model Tracker</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Recently updated models from the Hugging Face Hub. Likes are lifetime figures; downloads
          are the last 30 days as reported by the Hub. Open-weight status is shown only when the
          license reliably indicates it.
        </p>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by task">
          <TaskChip task={undefined} active={!task} label="All" />
          {TASKS.map((t) => (
            <TaskChip key={t} task={t} active={task === t} label={TASK_LABELS[t]} />
          ))}
        </div>
      </div>

      {!task && own.length > 0 && (
        <section aria-labelledby="ours">
          <SectionHeader title="From The Wider Lens" />
          <p className="-mt-2 mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            Our own model, shown separately: it isn&apos;t part of the tracker lists below.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {own.map((m) => (
              <OwnModelCard key={m.id} model={m} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="recent">
        <SectionHeader title={task ? `${TASK_LABELS[task] ?? task} models` : "Recently updated"} />
        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <ModelCard key={m.id} model={m} />
            ))}
          </div>
        ) : (
          <EmptyState message="No models match this filter right now." />
        )}
      </section>

      {!task && (
        <>
          <section aria-labelledby="fresh">
            <SectionHeader title="Newly released" blurb="Models recently onboarded to OpenRouter, newest first (real release timestamps)." />
            {fresh.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {fresh.map((m) => (
                  <ProviderModelCard key={m.id} model={m} />
                ))}
              </div>
            ) : (
              <EmptyState message="Release data is temporarily unavailable." />
            )}
          </section>
          <section aria-labelledby="liked">
            <SectionHeader title="Most liked" blurb="Community favorites on the Hub." />
            {trending.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {trending.map((m) => (
                  <ModelCard key={m.id} model={m} />
                ))}
              </div>
            ) : (
              <EmptyState message="Trending model data is temporarily unavailable." />
            )}
          </section>
        </>
      )}
    </div>
  );
}

function TaskChip({ task, active, label }: { task?: string; active: boolean; label: string }) {
  return (
    <Link
      href={task ? `/models?task=${task}` : "/models"}
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
          : "border border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
      }`}
    >
      {label}
    </Link>
  );
}
