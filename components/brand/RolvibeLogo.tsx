import Image from 'next/image'
import { cn } from '@/lib/utils'

interface RolvibeLogoProps {
  size?: number
  withWordmark?: boolean
  className?: string
  iconClassName?: string
  wordmarkClassName?: string
  priority?: boolean
}

export function RolvibeLogo({
  size = 32,
  withWordmark = false,
  className,
  iconClassName,
  wordmarkClassName,
  priority = false,
}: RolvibeLogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        src="/rolvibe-logo.png"
        alt="Rolvibe logo"
        width={size}
        height={size}
        priority={priority}
        className={cn(
          'shrink-0 object-contain',
          iconClassName
        )}
      />
      {withWordmark && (
        <span className={cn('font-bold text-[var(--text-primary)]', wordmarkClassName)}>
          Rolvibe
        </span>
      )}
    </div>
  )
}
