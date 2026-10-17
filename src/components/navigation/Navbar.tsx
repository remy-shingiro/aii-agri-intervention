import { Leaf } from 'lucide-react'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white">
      <div className="mx-auto flex min-h-16 w-full max-w-[1640px] items-center gap-3 px-4 sm:px-6 lg:min-h-[4.25rem] lg:px-8">
        <div className="flex min-w-0 items-center gap-3 lg:pl-1">
          <div
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-forest-950 text-white sm:size-10"
          >
            <Leaf className="size-5 sm:size-6" strokeWidth={2} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-tight text-forest-950 sm:text-lg">
              AII
            </p>

            <p className="hidden truncate text-xs font-medium text-slate-500 sm:block">
              Agricultural Intervention Intelligence · Rwanda
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
