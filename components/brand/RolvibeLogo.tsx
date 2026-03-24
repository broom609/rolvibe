import Image from 'next/image'
import { cn } from '@/lib/utils'

interface RolvibeLogoProps {
  size?: number
  withWordmark?: boolean
  className?: string
  wordmarkClassName?: string
  priority?: boolean
}

export function RolvibeLogo({
  size = 32,
  withWordmark = false,
  className,
  wordmarkClassName,
  priority = false,
}: RolvibeLogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        src="/rolvibe-logo.svg"
        alt="Rolvibe logo"
        width={size}
        height={size}
        priority={priority}
        className="shrink-0"
      />
      {withWordmark && (
        <span className={cn('font-bold text-[#F4F4F5]', wordmarkClassName)}>
          Rolvibe
        </span>
      )}
    </div>
  )
}
