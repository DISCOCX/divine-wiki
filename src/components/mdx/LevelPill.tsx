interface LevelPillProps {
  level: "beginner" | "intermediate" | "advanced";
  label?: string;
}

const styles: Record<LevelPillProps["level"], string> = {
  beginner:
    "bg-[color-mix(in_srgb,var(--color-divine-success)_15%,transparent)] text-divine-success ring-1 ring-[color-mix(in_srgb,var(--color-divine-success)_25%,transparent)]",
  intermediate:
    "bg-[color-mix(in_srgb,var(--color-divine-secondary)_15%,transparent)] text-divine-secondary ring-1 ring-[color-mix(in_srgb,var(--color-divine-secondary)_30%,transparent)]",
  advanced:
    "bg-[color-mix(in_srgb,var(--color-divine-primary)_25%,transparent)] text-divine-primary-light ring-1 ring-[color-mix(in_srgb,var(--color-divine-primary)_40%,transparent)]",
};

const defaults: Record<LevelPillProps["level"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function LevelPill({ level, label }: LevelPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-[var(--font-ui)] font-semibold tracking-wider uppercase ${styles[level]}`}
    >
      {label ?? defaults[level]}
    </span>
  );
}
