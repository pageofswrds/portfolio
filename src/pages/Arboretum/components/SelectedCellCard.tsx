import { useMemo } from 'react'
import { useArboretum, type Accession } from '../lib/ArboretumProvider'

export function SelectedCellCard() {
  const { selectedCell, selectCell, accessions, filterConfig } = useArboretum()

  const shouldInclude = useMemo(() => {
    return (acc: Accession): boolean => {
      switch (filterConfig.type) {
        case 'FAMILY':
          return acc.family === filterConfig.value
        case 'SPECIES':
          return acc.species === filterConfig.value
        case 'MULTIPLE_SPECIES':
          return filterConfig.values ? filterConfig.values.includes(acc.species) : false
        case 'ALL':
        default:
          return true
      }
    }
  }, [filterConfig])

  const cellAccessions = useMemo(() => {
    if (!selectedCell || !accessions) return []
    return accessions.filter((acc) => acc.cell === selectedCell.id && shouldInclude(acc))
  }, [selectedCell, accessions, shouldInclude])

  const uniqueSpecies = useMemo(() => {
    const s = new Set(cellAccessions.map((a) => a.species))
    return [...s].sort()
  }, [cellAccessions])

  const uniqueFamilies = useMemo(() => {
    const s = new Set(cellAccessions.map((a) => a.family))
    return [...s].sort()
  }, [cellAccessions])

  if (!selectedCell) return null

  return (
    <section className="arboretum-card">
      <header className="arboretum-card__header">
        <h2 className="arboretum-card__title">
          Cell <span className="arboretum-card__title-mono">{selectedCell.id}</span>
        </h2>
        <button
          type="button"
          className="arboretum-card__clear"
          onClick={() => selectCell(null)}
        >
          Unselect
        </button>
      </header>

      <dl className="arboretum-stats">
        <div className="arboretum-stats__row">
          <dt>Accessions</dt>
          <dd>{cellAccessions.length}</dd>
        </div>
        <div className="arboretum-stats__row">
          <dt>Families</dt>
          <dd>{uniqueFamilies.length}</dd>
        </div>
        <div className="arboretum-stats__row">
          <dt>Species</dt>
          <dd>{uniqueSpecies.length}</dd>
        </div>
      </dl>

      {uniqueSpecies.length > 0 && (
        <div className="arboretum-card__section">
          <h3 className="arboretum-card__subtitle">Species in this cell</h3>
          <ul className="arboretum-tags">
            {uniqueSpecies.slice(0, 24).map((s) => (
              <li key={s} className="arboretum-tag" title={s}>
                {s}
              </li>
            ))}
            {uniqueSpecies.length > 24 && (
              <li className="arboretum-tag arboretum-tag--muted">
                +{uniqueSpecies.length - 24} more
              </li>
            )}
          </ul>
        </div>
      )}
    </section>
  )
}
