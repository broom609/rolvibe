interface BuiltWithBadgeProps {
  builtWith: string
}

export function BuiltWithBadge({ builtWith }: BuiltWithBadgeProps) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] font-medium">
      ⚡ {builtWith}
    </span>
  )
}
