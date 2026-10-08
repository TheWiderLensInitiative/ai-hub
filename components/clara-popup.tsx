"use client";

import { useEffect, useState } from "react";
import { isMyTurn } from "@/lib/popup-turn";

const CLARA_URL = "https://clara.thewiderlens.info/beta?utm_source=thewiderlens&utm_medium=popup";
const STORAGE_KEY = "thewiderlens-clara-popup-dismissed";
const DELAY_MS = 25000;

function markDismissed() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* storage unavailable — popup may show again next visit */
  }
}

/** Our own app: Clara, the private AI assistant. Shown in at most one visit in a few (see lib/popup-turn). */
export function ClaraPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isMyTurn("clara")) return;
    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.dataset.thewiderlensPopup = "open";
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      delete document.body.dataset.thewiderlensPopup;
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const close = () => {
    markDismissed();
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Clara, from The Wider Lens">
      <button aria-label="Dismiss" onClick={close} className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-50 shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-sky-400 via-violet-500 to-fuchsia-500" />
        <button
          onClick={close}
          aria-label="Close popup"
          className="absolute right-3 top-4 rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <div className="px-6 pb-5 pt-5">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/clara-logo.png" alt="" width={48} height={48} className="h-12 w-12 rounded-xl" />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-400">From The Wider Lens</p>
          </div>
          <h2 className="mt-3 text-xl font-bold leading-snug">Meet Clara, your private AI assistant</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            She runs on your own PC, not in the cloud: research, reminders, files, a browser of her own, and hands-free
            voice, all from an Android app. New: Outlook and Dropbox in one tap, and any site through logins saved on
            your phone. Free and open source, and we're looking for beta testers.
          </p>
          <a
            href={CLARA_URL}
            onClick={markDismissed}
            className="mt-4 block rounded-xl bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
          >
            Join the beta
          </a>
          <p className="mt-3 text-center text-[11px] text-zinc-500">Testers need an Android phone. Running Clara needs a Linux PC with an NVIDIA GPU.</p>
        </div>
      </div>
    </div>
  );
}
