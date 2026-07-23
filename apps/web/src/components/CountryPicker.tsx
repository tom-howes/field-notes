import { useMemo, useState } from 'react'
import type { Country } from '../lib/api'
import './CountryPicker.css'

interface Props {
  countries: Country[]
  onGuess: (countryId: string) => void
  disabled: boolean
}

export function CountryPicker({ countries, onGuess, disabled }: Props) {
  const [query, setQuery] = useState('')

  const matches = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return countries.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8)
  }, [countries, query])

  return (
    <div className="country-picker">
      <input
        type="text"
        placeholder="Type a country name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={disabled}
      />
      {matches.length > 0 && (
        <ul className="country-picker-results">
          {matches.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setQuery('')
                  onGuess(c.id)
                }}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
