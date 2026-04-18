"use client";

import { useMemo, useRef, useState } from "react";
import {
  MDXEditor,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  InsertCodeBlock,
  ListsToggle,
  Separator,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { Button } from "@/components/ui/button";
import { SubmitDialog } from "./SubmitDialog";
import { useDraft } from "./autosave";
import { cn } from "@/lib/utils";
import { CircleAlert, CheckCircle2, Trash2 } from "lucide-react";

const CATEGORIES = [
  { value: "guided-walkthrough", label: "Start here" },
  { value: "tools", label: "Tools" },
  { value: "maya", label: "Maya" },
  { value: "blender", label: "Blender" },
  { value: "animations", label: "Animations" },
  { value: "vfx-bins", label: "VFX & bins" },
  { value: "assets-library", label: "Assets library" },
  { value: "errors", label: "Errors & fixes" },
];

async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/upload-image", { method: "POST", body });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Upload failed (${res.status})`);
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

interface GithubUser {
  login: string;
  avatar: string;
  createdAt: string;
}

function readUserCookie(): GithubUser | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/divine_gh_user=([^;]+)/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    return {
      login: parsed.login,
      avatar: parsed.avatar,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

export function GuideEditor() {
  const editorRef = useRef<MDXEditorMethods>(null);
  const { draft, restored, ready, update, clear } = useDraft({
    title: "",
    description: "",
    category: "tools",
    slug: "",
    mdx: "# Your guide title\n\nStart writing. Drafts save automatically.\n",
  });
  const [submitOpen, setSubmitOpen] = useState(false);
  const githubUser = useMemo<GithubUser | null>(() => readUserCookie(), []);

  const autoSlug = slugify(draft.title);
  const effectiveSlug = draft.slug.trim() || autoSlug;

  const canSubmit =
    draft.title.trim().length >= 3 &&
    draft.description.trim().length >= 10 &&
    draft.mdx.trim().length >= 50 &&
    effectiveSlug.length >= 2;

  if (!ready) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-divine-border bg-card">
          <MDXEditor
            ref={editorRef}
            markdown={draft.mdx}
            onChange={(md) => update({ mdx: md })}
            contentEditableClassName="prose prose-invert max-w-none min-h-[500px] px-6 py-4"
            plugins={[
              headingsPlugin(),
              listsPlugin(),
              quotePlugin(),
              linkPlugin(),
              linkDialogPlugin(),
              imagePlugin({ imageUploadHandler: uploadImage }),
              tablePlugin(),
              thematicBreakPlugin(),
              markdownShortcutPlugin(),
              codeBlockPlugin({ defaultCodeBlockLanguage: "bash" }),
              codeMirrorPlugin({
                codeBlockLanguages: {
                  bash: "Bash",
                  json: "JSON",
                  javascript: "JavaScript",
                  typescript: "TypeScript",
                  python: "Python",
                },
              }),
              toolbarPlugin({
                toolbarContents: () => (
                  <>
                    <UndoRedo />
                    <Separator />
                    <BoldItalicUnderlineToggles />
                    <BlockTypeSelect />
                    <Separator />
                    <ListsToggle />
                    <Separator />
                    <CreateLink />
                    <InsertImage />
                    <InsertTable />
                    <InsertThematicBreak />
                    <InsertCodeBlock />
                  </>
                ),
              }),
            ]}
          />
        </div>
        {restored && (
          <div className="flex items-center justify-between rounded-md border border-divine-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="size-4 text-green-400" />
              Draft restored from your last session.
            </span>
            <button
              onClick={clear}
              className="inline-flex items-center gap-1 text-xs hover:text-foreground"
            >
              <Trash2 className="size-3.5" />
              Start fresh
            </button>
          </div>
        )}
      </div>

      <aside className="flex flex-col gap-4 rounded-lg border border-divine-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Guide details
        </h2>

        <label className="block text-sm">
          <span className="text-muted-foreground">Title</span>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="How to rig a custom champion"
            maxLength={80}
            className="mt-1 block w-full rounded-md border border-divine-border bg-secondary/40 px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <label className="block text-sm">
          <span className="text-muted-foreground">
            Short description
            <span className="ml-2 text-xs">
              ({draft.description.length}/200)
            </span>
          </span>
          <textarea
            value={draft.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="One sentence. Appears in search results and social previews."
            maxLength={200}
            rows={3}
            className="mt-1 block w-full resize-none rounded-md border border-divine-border bg-secondary/40 px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <label className="block text-sm">
          <span className="text-muted-foreground">Category</span>
          <select
            value={draft.category}
            onChange={(e) => update({ category: e.target.value })}
            className="mt-1 block w-full rounded-md border border-divine-border bg-secondary/40 px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-muted-foreground">
            Slug
            <span className="ml-2 text-xs">
              (kebab-case; auto from title if empty)
            </span>
          </span>
          <input
            type="text"
            value={draft.slug}
            onChange={(e) => update({ slug: slugify(e.target.value) })}
            placeholder={autoSlug || "your-guide"}
            className="mt-1 block w-full rounded-md border border-divine-border bg-secondary/40 px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <div className="rounded-md bg-secondary/30 p-3 text-xs text-muted-foreground">
          <div className="mb-1 text-foreground">Target path</div>
          <code className="break-all font-mono">
            content/docs/en/{draft.category}/{effectiveSlug || "your-guide"}.mdx
          </code>
        </div>

        {!canSubmit && (
          <div
            className={cn(
              "flex items-start gap-2 rounded-md border border-divine-border p-3 text-xs text-muted-foreground",
            )}
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              Title (3+ chars), description (10+ chars), and at least 50 chars
              of content are required before you can submit.
            </span>
          </div>
        )}

        <Button
          disabled={!canSubmit}
          onClick={() => setSubmitOpen(true)}
          className="mt-auto"
        >
          Submit for review
        </Button>

        <SubmitDialog
          open={submitOpen}
          onOpenChange={setSubmitOpen}
          githubUser={
            githubUser
              ? { login: githubUser.login, avatar: githubUser.avatar }
              : null
          }
          payload={{
            frontmatter: {
              title: draft.title.trim(),
              description: draft.description.trim(),
              category: draft.category,
            },
            slug: effectiveSlug,
            mdx: draft.mdx,
          }}
          onSuccess={() => {
            // Clear the draft once the PR is open so the next visit is fresh.
            void clear();
          }}
        />
      </aside>
    </div>
  );
}
