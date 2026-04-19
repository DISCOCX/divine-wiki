import Image from "next/image";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import { discordInviteUrl } from "@/lib/config";

export function DocsFooter() {
  return (
    <footer className="border-divine-border text-divine-text-muted mt-16 border-t pt-8 pb-12 text-sm">
      <div className="mx-auto flex max-w-[var(--fd-layout-width)] flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/footer-logo.webp"
            width={106}
            height={40}
            alt="Divine Skins"
            className="h-8 w-auto opacity-80"
          />
          <span>
            Written by the Divine Skins community. Open source on{" "}
            <Link
              href="https://github.com/DivineSkins/divine-wiki"
              target="_blank"
              rel="noopener noreferrer"
              className="text-divine-primary-light underline-offset-4 hover:text-white hover:underline"
            >
              GitHub
            </Link>
            .
          </span>
        </div>
        <Link
          href={discordInviteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-divine-primary-light inline-flex items-center gap-1.5 transition-colors"
        >
          Get help in Discord
          <ExternalLinkIcon className="size-3.5" aria-hidden />
        </Link>
      </div>
    </footer>
  );
}
