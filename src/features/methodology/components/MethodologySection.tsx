import type { ReactNode } from 'react'

interface MethodologySectionProps {
  id: string
  title: string
  intro?: string
  children: ReactNode
}

export function MethodologySection({
  id,
  title,
  intro,
  children,
}: MethodologySectionProps) {
  return (
    <section aria-labelledby={id} className="scroll-mt-24 space-y-3">
      <div>
        <h2
          className="text-lg font-bold tracking-tight text-forest-950"
          id={id}
        >
          {title}
        </h2>
        {intro && (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            {intro}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}
