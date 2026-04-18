import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import ContributeClient from "./ContributeClient";
import { getMessages } from "@/lib/locale";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Write a guide — Divine Skins Wiki",
  description:
    "Write a new guide in the in-site editor. Your guide ships as a GitHub pull request — no Git needed.",
};

export default async function ContributePage({
  params,
}: PageProps<"/[lang]/contribute">) {
  const { lang } = await params;
  const messages = getMessages(lang);
  const t = messages.contribute;

  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 py-12">
      <header className="mb-8 flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t.subtitle}</p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <Link
            href="/CONTRIBUTING.md"
            className="inline-flex items-center gap-1 underline hover:text-foreground"
          >
            {t.manualLink}
            <ExternalLinkIcon className="size-3" />
          </Link>
          <span className="opacity-50">·</span>
          <Link
            href="https://discord.gg/divineskins"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            Need help? Ask in Discord
            <ExternalLinkIcon className="size-3" />
          </Link>
        </div>
      </header>

      <ContributeClient />
    </main>
  );
}
