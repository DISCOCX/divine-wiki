import Link from "next/link";
import type { ReactNode } from "react";

interface GlowCTAProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
}

export function GlowCTA({
  href,
  children,
  variant = "primary",
  size = "md",
}: GlowCTAProps) {
  const isExternal = /^https?:\/\//i.test(href);
  const Tag = isExternal ? "a" : Link;
  const externalProps = isExternal
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  const sizeClasses =
    size === "lg" ? "px-7 py-3.5 text-sm" : "px-5 py-2.5 text-[13px]";

  if (variant === "ghost") {
    return (
      <Tag
        href={href}
        {...externalProps}
        className={`border-divine-border text-divine-text hover:border-divine-primary/60 hover:text-divine-primary-light inline-flex items-center justify-center gap-2 rounded-[12px] border bg-transparent font-[var(--font-ui)] font-semibold tracking-wide uppercase no-underline transition-colors duration-200 ${sizeClasses}`}
      >
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      href={href}
      {...externalProps}
      className={`divine-glow hover:divine-glow-hover inline-flex items-center justify-center gap-2 rounded-[12px] font-[var(--font-ui)] font-semibold tracking-wide text-white uppercase no-underline transition-shadow duration-500 ${sizeClasses}`}
      style={{
        background: "linear-gradient(90deg, #B472FF 0%, #783CB5 100%)",
      }}
    >
      {children}
    </Tag>
  );
}
