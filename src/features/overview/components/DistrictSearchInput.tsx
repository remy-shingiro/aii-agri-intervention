import {
  ChevronDown,
  MapPin,
  Search,
  X,
} from 'lucide-react'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'

interface DistrictSearchInputProps {
  districts: readonly string[]
  value: string
  onChange: (value: string) => void
  onSelect: (district: string) => void
  placeholder?: string
}

export function DistrictSearchInput({
  districts,
  value,
  onChange,
  onSelect,
  placeholder = 'Search district',
}: DistrictSearchInputProps) {
  const inputId = useId()
  const listboxId = `${inputId}-listbox`
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const searchTerm = value.trim().toLowerCase()

  const matchingDistricts = useMemo(() => {
    if (!searchTerm) {
      return []
    }

    return districts
      .filter((district) =>
        district.toLowerCase().includes(searchTerm),
      )
      .slice(0, 8)
  }, [districts, searchTerm])

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [searchTerm])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current) {
        return
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener(
        'mousedown',
        handlePointerDown,
      )
    }
  }, [])

  const selectDistrict = (district: string) => {
    onChange(district)
    onSelect(district)
    setIsOpen(false)
    setHighlightedIndex(-1)

    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const nextValue = event.target.value

    onChange(nextValue)
    setIsOpen(Boolean(nextValue.trim()))
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setIsOpen(false)
      setHighlightedIndex(-1)
      return
    }

    if (!isOpen || matchingDistricts.length === 0) {
      if (event.key === 'ArrowDown' && searchTerm) {
        event.preventDefault()
        setIsOpen(true)
        setHighlightedIndex(0)
      }

      if (
        event.key === 'Enter' &&
        matchingDistricts.length === 1
      ) {
        event.preventDefault()
        selectDistrict(matchingDistricts[0])
      }

      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()

        setHighlightedIndex((currentIndex) => {
          if (
            currentIndex < matchingDistricts.length - 1
          ) {
            return currentIndex + 1
          }

          return 0
        })
        break

      case 'ArrowUp':
        event.preventDefault()

        setHighlightedIndex((currentIndex) => {
          if (currentIndex > 0) {
            return currentIndex - 1
          }

          return matchingDistricts.length - 1
        })
        break

      case 'Enter':
        event.preventDefault()

        if (highlightedIndex >= 0) {
          selectDistrict(
            matchingDistricts[highlightedIndex],
          )
          return
        }

        if (matchingDistricts.length === 1) {
          selectDistrict(matchingDistricts[0])
        }
        break

      default:
        break
    }
  }

  const handleFocus = () => {
    if (searchTerm) {
      setIsOpen(true)
    }
  }

  const handleClear = () => {
    onChange('')
    onSelect('')
    setIsOpen(false)
    setHighlightedIndex(-1)

    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  const showSuggestions = isOpen && Boolean(searchTerm)

  const activeDescendant =
    highlightedIndex >= 0
      ? `${listboxId}-option-${highlightedIndex}`
      : undefined

  return (
    <div
      ref={containerRef}
      className="relative w-full"
    >
      <label
        className="sr-only"
        htmlFor={inputId}
      >
        Search district
      </label>

      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
        />

        <input
          ref={inputRef}
          id={inputId}
          name="district-search"
          type="search"
          role="combobox"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={showSuggestions ? listboxId : undefined}
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          aria-activedescendant={activeDescendant}
          className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-20 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-green-600 focus:ring-2 focus:ring-green-600/10"
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />

        {value && (
          <button
            aria-label="Clear district search"
            className="absolute right-9 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
            onClick={handleClear}
            type="button"
          >
            <X
              aria-hidden="true"
              className="size-4"
            />
          </button>
        )}

        <ChevronDown
          aria-hidden="true"
          className={`pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition-transform ${
            showSuggestions ? 'rotate-180' : ''
          }`}
        />
      </div>

      {showSuggestions && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          {matchingDistricts.length > 0 ? (
            <div className="max-h-64 overflow-y-auto py-1">
              {matchingDistricts.map((district, index) => {
                const isHighlighted =
                  index === highlightedIndex

                return (
                  <button
                    key={district}
                    id={`${listboxId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isHighlighted}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                      isHighlighted
                        ? 'bg-green-50 text-green-800'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    onMouseDown={(event) => {
                      event.preventDefault()
                    }}
                    onMouseEnter={() => {
                      setHighlightedIndex(index)
                    }}
                    onClick={() => {
                      selectDistrict(district)
                    }}
                  >
                    <MapPin
                      aria-hidden="true"
                      className={`size-4 shrink-0 ${
                        isHighlighted
                          ? 'text-green-600'
                          : 'text-slate-400'
                      }`}
                    />

                    <span className="truncate">
                      {district}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="px-3 py-4">
              <p className="text-sm font-medium text-slate-700">
                No districts found
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                Try a different district name.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
