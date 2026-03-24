export function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-[#1A1A1E] border border-[#2A2A30] animate-pulse">
      <div className="aspect-video bg-[#2A2A30]" />
      <div className="p-3 space-y-2">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-[#2A2A30] rounded-full" />
          <div className="h-5 w-20 bg-[#2A2A30] rounded-full" />
        </div>
        <div className="h-4 w-3/4 bg-[#2A2A30] rounded" />
        <div className="h-3 w-full bg-[#2A2A30] rounded" />
        <div className="h-3 w-2/3 bg-[#2A2A30] rounded" />
        <div className="flex justify-between pt-1">
          <div className="h-3 w-24 bg-[#2A2A30] rounded" />
          <div className="h-6 w-12 bg-[#2A2A30] rounded-full" />
        </div>
      </div>
    </div>
  )
}
