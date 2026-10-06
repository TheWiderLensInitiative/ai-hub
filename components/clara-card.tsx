import type { AiModel, Repo } from "@/lib/types";
import { formatNumber, timeAgo } from "@/lib/format";

/** A built-in card for our own app, Clara. Never interrupts; lives in the page like any other block. */
export function ClaraCard({ placement = "home" }: { placement?: string }) {
  const url = `https://clara.thewiderlens.info/beta?utm_source=thewiderlens&utm_medium=card&utm_content=${placement}`;
  return (
    <aside aria-label="Clara, from The Wider Lens" className="mt-6 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50">
      <div className="h-1 bg-gradient-to-r from-sky-400 via-violet-500 to-fuchsia-500" />
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/clara-logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-lg" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-400">From The Wider Lens</p>
            <p className="font-bold leading-tight">Clara</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          A private AI assistant that runs on your own PC. Free and open source. Beta testers wanted for the Android app!
        </p>
        <a
          href={url}
          className="mt-3 block rounded-md bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 px-3 py-2 text-center text-sm font-semibold text-white transition hover:opacity-90"
        >
          Join the beta
        </a>
      </div>
    </aside>
  );
}

/** Our own model on the Model Tracker: live Hugging Face figures, plus what it does in Clara. */
export function OwnModelCard({ model }: { model: AiModel }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50 sm:col-span-2 lg:col-span-3">
      <div className="h-1 bg-gradient-to-r from-sky-400 via-violet-500 to-fuchsia-500" />
      <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/clara-logo.png" alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-xl" />
          <div className="min-w-0">
            <h3 className="font-bold leading-snug">
              <a href={model.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {model.id} <span className="text-zinc-500">↗</span>
              </a>
            </h3>
            <p className="mt-1.5 text-sm text-zinc-400">
              The small model that reads every message to Clara, our private AI assistant. One model now answers
              four questions in about a third of a second on a CPU: chat or task, quick or deep, what kind of help
              it needs, and whether you&apos;re following up on what she just did. A fine-tune of ConvAI
              Innovations&apos; Laya (ModernBERT-large, 421M parameters).
            </p>
            <p className="mt-2 flex flex-wrap gap-x-2 text-xs text-zinc-500">
              {/* a brand-new model's likes and downloads say little: show them once they mean something */}
              <span>{model.likes >= 25 ? `♥ ${formatNumber(model.likes)} likes` : "New model"}</span>
              {model.license && (<><span aria-hidden="true">·</span><span>{model.license}</span></>)}
              <span aria-hidden="true">·</span>
              <span>updated {timeAgo(model.lastModified)}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:flex-col">
          <a href={model.url} target="_blank" rel="noopener noreferrer"
             className="rounded-md bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-center text-sm font-semibold text-white hover:opacity-90">
            View on Hugging Face
          </a>
          <a href="https://clara.thewiderlens.info/?utm_source=thewiderlens&utm_medium=models"
             className="rounded-md border border-zinc-700 px-4 py-2 text-center text-sm font-semibold text-zinc-100 hover:bg-zinc-800">
            Get Clara free
          </a>
        </div>
      </div>
    </div>
  );
}

/** Our own project on the Open Source page: its live GitHub card, plus links to its site and beta. */
export function OwnProjectCard({ repo }: { repo: Repo }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50 sm:col-span-2 lg:col-span-3">
      <div className="h-1 bg-gradient-to-r from-sky-400 via-violet-500 to-fuchsia-500" />
      <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/clara-logo.png" alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-xl" />
          <div className="min-w-0">
            <h3 className="font-bold leading-snug">
              <a href={repo.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {repo.fullName} <span className="text-zinc-500">↗</span>
              </a>
            </h3>
            {repo.description && <p className="mt-1.5 text-sm text-zinc-400">{repo.description}</p>}
            <p className="mt-2 flex flex-wrap gap-x-2 text-xs text-zinc-500">
              {/* a brand-new project's star count says little: show it once it means something */}
              <span>{repo.stars >= 25 ? `★ ${formatNumber(repo.stars)} stars` : "New project"}</span>
              {repo.language && (<><span aria-hidden="true">·</span><span>{repo.language}</span></>)}
              <span aria-hidden="true">·</span>
              <span>updated {timeAgo(repo.updatedAt)}</span>
            </p>
            {repo.latestRelease && (
              <p className="mt-1.5 text-xs text-zinc-500">
                Latest release:{" "}
                <a href={repo.latestRelease.url} target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:underline">
                  {repo.latestRelease.name} <span className="text-zinc-500">↗</span>
                </a>
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:flex-col">
          <a href="https://clara.thewiderlens.info/?utm_source=thewiderlens&utm_medium=opensource"
             className="rounded-md bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-center text-sm font-semibold text-white hover:opacity-90">
            Get Clara free
          </a>
          <a href="https://clara.thewiderlens.info/beta?utm_source=thewiderlens&utm_medium=opensource"
             className="rounded-md border border-zinc-700 px-4 py-2 text-center text-sm font-semibold text-zinc-100 hover:bg-zinc-800">
            Join the beta
          </a>
        </div>
      </div>
    </div>
  );
}
