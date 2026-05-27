import { useMemo, useState } from 'react'
import { useArboretum, type FilterConfig } from '../lib/ArboretumProvider'

type FilterMode = 'ALL' | 'FAMILY' | 'SPECIES'

interface CountedName {
  name: string
  count: number
}

export function FilterCard() {
  const { accessions, filterConfig, setFilter, isLoading } = useArboretum()
  const [mode, setMode] = useState<FilterMode>(
    filterConfig.type === 'ALL' ? 'ALL' : (filterConfig.type as FilterMode),
  )
  const [search, setSearch] = useState('')

  const { families, species } = useMemo(() => {
    const familyCounts = new Map<string, number>()
    const speciesCounts = new Map<string, number>()
    for (const acc of accessions) {
      if (acc.family) familyCounts.set(acc.family, (familyCounts.get(acc.family) ?? 0) + 1)
      if (acc.species) speciesCounts.set(acc.species, (speciesCounts.get(acc.species) ?? 0) + 1)
    }
    const sortByCount = (a: CountedName, b: CountedName) =>
      b.count - a.count || a.name.localeCompare(b.name)
    return {
      families: [...familyCounts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort(sortByCount),
      species: [...speciesCounts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort(sortByCount),
    }
  }, [accessions])

  const visibleList = useMemo(() => {
    const list = mode === 'FAMILY' ? families : mode === 'SPECIES' ? species : []
    if (!search.trim()) return list
    const q = search.trim().toLowerCase()
    return list.filter((item) => item.name.toLowerCase().includes(q))
  }, [mode, families, species, search])

  const handleModeChange = (newMode: FilterMode) => {
    setMode(newMode)
    setSearch('')
    if (newMode === 'ALL') {
      setFilter({ type: 'ALL', value: '' })
    }
  }

  const handleSelectItem = (name: string) => {
    const next: FilterConfig =
      filterConfig.value === name && filterConfig.type === mode
        ? { type: 'ALL', value: '' }
        : { type: mode as FilterConfig['type'], value: name }
    setFilter(next)
    if (next.type === 'ALL') setMode('ALL')
  }

  const activeName = filterConfig.type !== 'ALL' ? filterConfig.value : null

  return (
    <section className="arboretum-card">
      <header className="arboretum-card__header">
        <h2 className="arboretum-card__title">Filter</h2>
        {activeName && (
          <button
            type="button"
            className="arboretum-card__clear"
            onClick={() => {
              setFilter({ type: 'ALL', value: '' })
              setMode('ALL')
            }}
          >
            Clear
          </button>
        )}
      </header>

      <div className="arboretum-tabs" role="tablist">
        {(['ALL', 'FAMILY', 'SPECIES'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={`arboretum-tab ${mode === m ? 'is-active' : ''}`}
            onClick={() => handleModeChange(m)}
          >
            {m === 'ALL' ? 'All' : m === 'FAMILY' ? 'By family' : 'By species'}
          </button>
        ))}
      </div>

      {mode !== 'ALL' && (
        <>
          <input
            type="search"
            className="arboretum-input"
            placeholder={mode === 'FAMILY' ? 'Search families…' : 'Search species…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="arboretum-list" role="listbox">
            {isLoading && <p className="arboretum-list__empty">Loading…</p>}
            {!isLoading && visibleList.length === 0 && (
              <p className="arboretum-list__empty">No matches.</p>
            )}
            {visibleList.map((item) => {
              const isSelected = filterConfig.type === mode && filterConfig.value === item.name
              return (
                <button
                  key={item.name}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`arboretum-list__item ${isSelected ? 'is-active' : ''}`}
                  onClick={() => handleSelectItem(item.name)}
                  title={item.name}
                >
                  <span className="arboretum-list__name">{item.name}</span>
                  <span className="arboretum-list__count">{item.count}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {mode === 'ALL' && (
        <p className="arboretum-card__hint">
          Showing all {accessions.length.toLocaleString()} accessions. Use a tab above to filter by
          family or species.
        </p>
      )}
    </section>
  )
}
