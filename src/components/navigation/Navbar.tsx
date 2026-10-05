import { Leaf } from 'lucide-react'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 w-full max-w-[1600px] items-center gap-3 px-4 sm:min-h-20 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-800 sm:size-10"
          >
            <Leaf className="size-5 sm:size-6" strokeWidth={2} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-slate-900 sm:text-base lg:text-lg">
              Agricultural Intervention Intelligence
            </p>

            <p className="hidden truncate text-xs text-slate-500 sm:block">
              Rwanda · Official agricultural statistics
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
