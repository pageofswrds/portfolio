import { Link } from 'react-router-dom'
import { ArboretumProvider } from './lib/ArboretumProvider'
import ArboretumVisualizer from './components/ArboretumVisualizer'
import { FilterCard } from './components/FilterCard'
import { SelectedCellCard } from './components/SelectedCellCard'
import './arboretum.css'

const BackArrow = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M15 18l-6-6 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default function ArboretumPage() {
  return (
    <ArboretumProvider>
      <div className="arboretum-page">
        <header className="arboretum-page__header">
          <Link to="/" className="arboretum-page__back">
            {BackArrow}
            <span>Back to portfolio</span>
          </Link>
          <div className="arboretum-page__titleblock">
            <h1 className="arboretum-page__title">Diversity in the Arboretum</h1>
            <p className="arboretum-page__subtitle">
              2023 · D3.js · An interactive exploration of the Seattle Arboretum's plant accessions
            </p>
          </div>
        </header>

        <div className="arboretum-page__body">
          <aside className="arboretum-page__sidebar">
            <FilterCard />
            <SelectedCellCard />
          </aside>
          <main className="arboretum-page__main">
            <ArboretumVisualizer />
          </main>
        </div>
      </div>
    </ArboretumProvider>
  )
}
