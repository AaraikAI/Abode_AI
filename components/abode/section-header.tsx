import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  eyebrow?: string
  heading: string
  description?: string
  className?: string
  action?: ReactNode
}

export function SectionHeader({
  eyebrow,
  heading,
  description,
  className,
  action
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 text-left md:flex-row md:items-end md:justify-between md:gap-6",
        className
      )}
    >
      <div className="max-w-3xl space-y-2">
        {eyebrow ? (
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-primary/80">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {heading}
        </h2>
        {description ? (
          <p className="text-base text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  )
}
