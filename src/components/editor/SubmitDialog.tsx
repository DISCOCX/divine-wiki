"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, ExternalLink, X } from "lucide-react";
import Link from "next/link";

interface SubmitPayload {
  frontmatter: { title: string; description: string; category: string };
  slug: string;
  mdx: string;
  discord?: string;
}

export function SubmitDialog({
  open,
  onOpenChange,
  githubUser,
  payload,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  githubUser: { login: string; avatar: string } | null;
  payload: SubmitPayload;
  onSuccess?: () => void;
}) {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "submitting" }
    | { kind: "done"; prUrl: string; prNumber: number }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [discord, setDiscord] = useState(payload.discord ?? "");
  const [ack, setAck] = useState(false);

  async function submit() {
    if (!githubUser) return;
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, discord: discord || undefined }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({ error: "Submit failed" }))) as {
          error?: string;
        };
        setState({ kind: "error", message: data.error ?? "Submit failed" });
        return;
      }
      const data = (await res.json()) as { prUrl: string; prNumber: number };
      setState({ kind: "done", prUrl: data.prUrl, prNumber: data.prNumber });
      onSuccess?.();
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-divine-border bg-card p-6 shadow-2xl",
          )}
        >
          <div className="flex items-start justify-between">
            <Dialog.Title className="text-lg font-semibold">
              Submit for review
            </Dialog.Title>
            <Dialog.Close aria-label="Close">
              <X className="size-4 text-muted-foreground hover:text-foreground" />
            </Dialog.Close>
          </div>

          {!githubUser && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Your guide ships as a pull request on GitHub. Sign in once, then
                submit as many guides as you like.
              </p>
              <Button asChild className="w-full">
                <Link
                  href={`/api/oauth/github?start=1&return=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/en/contribute")}`}
                >
                  Sign in with GitHub
                </Link>
              </Button>
            </div>
          )}

          {githubUser && state.kind === "idle" && (
            <div className="mt-4 space-y-4">
              <div className="text-sm">
                <div className="text-muted-foreground">Signed in as</div>
                <div className="mt-1 flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={githubUser.avatar}
                    alt=""
                    className="size-6 rounded-full"
                  />
                  <span className="font-medium">@{githubUser.login}</span>
                </div>
              </div>

              <label className="block text-sm">
                <span className="text-muted-foreground">
                  Discord handle (optional)
                </span>
                <input
                  type="text"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  placeholder="e.g. creatorname"
                  className="mt-1 block w-full rounded-md border border-divine-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I understand this opens a public pull request on GitHub under
                  my username.
                </span>
              </label>

              <Button onClick={submit} disabled={!ack} className="w-full">
                Open pull request
              </Button>
            </div>
          )}

          {state.kind === "submitting" && (
            <div className="mt-6 flex flex-col items-center gap-3 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <span>Forking, branching, committing, opening PR…</span>
            </div>
          )}

          {state.kind === "done" && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="size-5" />
                <span className="font-medium">
                  Pull request #{state.prNumber} opened
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                A maintainer will review it. You&apos;ll get a GitHub
                notification when they approve or request changes.
              </p>
              <Button asChild className="w-full">
                <Link href={state.prUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  View PR on GitHub
                </Link>
              </Button>
            </div>
          )}

          {state.kind === "error" && (
            <div className="mt-4 space-y-3">
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
                {state.message}
              </div>
              <Button
                onClick={() => setState({ kind: "idle" })}
                variant="secondary"
                className="w-full"
              >
                Try again
              </Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
