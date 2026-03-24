import { CATEGORY_COLORS } from '@/types'

interface CategoryPillProps {
  category: string
  size?: 'sm' | 'md'
  onClick?: () => void
  active?: boolean
}

export function CategoryPill({ category, size = 'sm', onClick, active }: CategoryPillProps) {
  const colors = CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-700'
  const baseClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs rounded-full font-medium'
    : 'px-3 py-1 text-sm rounded-full font-medium'

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} transition-all ${
          active
            ? 'ring-2 ring-white/30 scale-105 ' + colors
            : colors + ' opacity-80 hover:opacity-100'
        }`}
      >
        {category}
      </button>
    )
  }

  return (
    <span className={`${baseClasses} ${colors}`}>
      {category}
    </span>
  )
}
