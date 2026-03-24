export function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] animate-pulse">
      <div className="aspect-video bg-[var(--muted-surface)]" />
      <div className="p-3 space-y-2">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-[var(--muted-surface)] rounded-full" />
          <div className="h-5 w-20 bg-[var(--muted-surface)] rounded-full" />
        </div>
        <div className="h-4 w-3/4 bg-[var(--muted-surface)] rounded" />
        <div className="h-3 w-full bg-[var(--muted-surface)] rounded" />
        <div className="h-3 w-2/3 bg-[var(--muted-surface)] rounded" />
        <div className="flex justify-between pt-1">
          <div className="h-3 w-24 bg-[var(--muted-surface)] rounded" />
          <div className="h-6 w-12 bg-[var(--muted-surface)] rounded-full" />
        </div>
      </div>
    </div>
  )
}
