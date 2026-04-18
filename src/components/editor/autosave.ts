"use client";
/**
 * Draft autosave — localStorage primary, IndexedDB fallback.
 *
 * localStorage is dead simple but gets cleared by some browsers under
 * privacy settings or quota pressure. IndexedDB survives more of that. We
 * mirror into both on every change and restore from whichever has the
 * newest writeTime on load.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";

export interface Draft {
  title: string;
  description: string;
  category: string;
  slug: string;
  mdx: string;
  writeTime: number;
}

const LS_KEY = "divine:contribute:draft";
const IDB_KEY = "contribute:draft";

function readLocal(): Draft | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Draft;
  } catch {
    return null;
  }
}

async function readIdb(): Promise<Draft | null> {
  try {
    const value = await idbGet(IDB_KEY);
    return (value as Draft | undefined) ?? null;
  } catch {
    return null;
  }
}

async function writeBoth(draft: Draft) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(draft));
  } catch {
    /* quota exceeded — IndexedDB may still succeed */
  }
  try {
    await idbSet(IDB_KEY, draft);
  } catch {
    /* fallback already attempted in LS */
  }
}

async function clearBoth() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
  try {
    await idbDel(IDB_KEY);
  } catch {
    /* ignore */
  }
}

export function useDraft(initial: Omit<Draft, "writeTime">) {
  const [draft, setDraft] = useState<Draft>({ ...initial, writeTime: 0 });
  const [restored, setRestored] = useState<Draft | null>(null);
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from the newer of LS/IDB on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [ls, idb] = await Promise.all([
        Promise.resolve(readLocal()),
        readIdb(),
      ]);
      const candidate =
        ls && idb ? (ls.writeTime >= idb.writeTime ? ls : idb) : (ls ?? idb);
      if (!cancelled) {
        if (candidate) {
          setDraft(candidate);
          setRestored(candidate);
        }
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((patch: Partial<Draft>) => {
    setDraft((prev) => {
      const next: Draft = { ...prev, ...patch, writeTime: Date.now() };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        writeBoth(next);
      }, 400);
      return next;
    });
  }, []);

  const clear = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await clearBoth();
    setDraft({ ...initial, writeTime: 0 });
    setRestored(null);
  }, [initial]);

  return { draft, restored, ready, update, clear };
}
