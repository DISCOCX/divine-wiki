import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import ContributeClient from "./ContributeClient";
import { LevelPill } from "@/components/mdx/LevelPill";
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
      <header className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-divine-text text-3xl font-[var(--font-hero)] font-extrabold tracking-tight md:text-4xl">
            <span className="divine-gradient-text">Write</span> a guide
          </h1>
          <LevelPill level="advanced" label="Creator surface" />
        </div>
        <hr className="divine-hr w-24 opacity-80" />
        <p className="text-divine-text-muted max-w-2xl text-sm md:text-base">
          {t.subtitle}
        </p>
        <div className="text-divine-text-muted flex flex-wrap items-center gap-4 text-xs">
          <Link
            href="/CONTRIBUTING.md"
            className="text-divine-primary-light inline-flex items-center gap-1 underline-offset-4 hover:text-white hover:underline"
          >
            {t.manualLink}
            <ExternalLinkIcon className="size-3" aria-hidden />
          </Link>
          <span className="opacity-50">·</span>
          <Link
            href="https://discord.gg/divineskins"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-divine-primary-light inline-flex items-center gap-1"
          >
            Need help? Ask in Discord
            <ExternalLinkIcon className="size-3" aria-hidden />
          </Link>
        </div>
      </header>

      <ContributeClient />
    </main>
  );
}
