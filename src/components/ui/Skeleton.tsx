import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string
  height?: string
  rounded?: string
}

export function Skeleton({ className, width, height, rounded = 'rounded-xl', ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse bg-milk-200 dark:bg-cream-200/30', rounded, className)}
      style={{ width, height: height || '1rem' }}
      aria-hidden="true"
      {...props}
    />
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white dark:bg-warm-white border border-milk-300 dark:border-border rounded-brand-lg p-6', className)}>
      <Skeleton height="1.5rem" width="60%" className="mb-3" />
      <Skeleton height="1rem" width="90%" className="mb-2" />
      <Skeleton height="1rem" width="75%" />
    </div>
  )
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-milk-200 dark:border-border">
      <Skeleton height="2.5rem" width="2.5rem" rounded="rounded-full" className="flex-shrink-0" />
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          width={`${Math.floor(Math.random() * 40 + 40)}%`}
          className="flex-1"
        />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-warm-white border border-milk-300 dark:border-border rounded-brand-lg overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}
