interface BuiltWithBadgeProps {
  builtWith: string
}

export function BuiltWithBadge({ builtWith }: BuiltWithBadgeProps) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1A1A1E] border border-[#2A2A30] text-[#A1A1AA] font-medium">
      ⚡ {builtWith}
    </span>
  )
}
