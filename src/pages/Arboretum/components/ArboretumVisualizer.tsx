import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import validRows from '../data/validrows.json'
import validCols from '../data/validcols.json'
import { useArboretum, type Cell, type ComputeConfig } from '../lib/ArboretumProvider'
import { getCellColor, formatCellValue } from '../lib/ArboretumUtils'

const METRIC_OPTIONS: { value: ComputeConfig['metric']; label: string }[] = [
  { value: 'ALL', label: 'Total Accessions' },
  { value: 'FAMILY', label: 'Unique Families' },
  { value: 'SPECIES', label: 'Unique Species' },
  { value: 'Z-SCORE', label: 'Average Z-Score' },
  { value: 'Z-SCORE-UNIQUE', label: 'Uniqueness Z-Score' },
  { value: 'DIVERSITY', label: 'Diversity' },
  { value: 'PERCENTAGE', label: 'Percentage' },
]

function formatScaleValue(value: number, metric: ComputeConfig['metric']): string {
  if (value == null || Number.isNaN(value)) return '0'
  if (metric.includes('Z-SCORE') || metric === 'DIVERSITY') return value.toFixed(2)
  if (metric === 'PERCENTAGE') return `${value.toFixed(1)}%`
  return Math.round(value).toString()
}

export default function ArboretumVisualizer() {
  const { cellData, computeConfig, selectedCell, selectCell, statistics, setCompute } =
    useArboretum()
  const svgRef = useRef<SVGSVGElement>(null)

  const numRows = 59
  const numCols = 17
  const cellWidth = 15
  const cellHeight = 15
  const padding = 15
  const labelWidth = 25
  const labelHeight = 20
  const w = numCols * cellWidth + 2 * padding + labelWidth
  const h = numRows * cellHeight + 2 * padding + labelHeight

  useEffect(() => {
    if (!svgRef.current || cellData.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const xScale = d3
      .scaleLinear()
      .domain([0, numCols])
      .range([padding + labelWidth, w - padding])

    const yScale = d3
      .scaleLinear()
      .domain([0, numRows - 1])
      .range([h - padding, padding + labelHeight])

    const gridGroup = svg.append('g').attr('class', 'grid')

    for (let col = 0; col <= numCols; col++) {
      gridGroup
        .append('line')
        .attr('x1', xScale(col))
        .attr('y1', yScale(0))
        .attr('x2', xScale(col))
        .attr('y2', yScale(numRows - 1))
        .attr('stroke', 'currentColor')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,4')
        .attr('opacity', 0.15)
    }

    for (let row = 0; row <= numRows - 1; row++) {
      gridGroup
        .append('line')
        .attr('x1', xScale(0))
        .attr('y1', yScale(row))
        .attr('x2', xScale(numCols))
        .attr('y2', yScale(row))
        .attr('stroke', 'currentColor')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,4')
        .attr('opacity', 0.15)
    }

    const colLabelsGroup = svg.append('g').attr('class', 'col-labels')
    for (let col = 0; col < numCols; col++) {
      const colLabel = (validCols as unknown as string[])[col]
      if (colLabel) {
        colLabelsGroup
          .append('text')
          .attr('x', xScale(col) + cellWidth / 2)
          .attr('y', padding + labelHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-family', 'var(--font-mono)')
          .attr('font-size', '10px')
          .attr('fill', 'currentColor')
          .attr('opacity', 0.45)
          .text(colLabel)
      }
    }

    const rowLabelsGroup = svg.append('g').attr('class', 'row-labels')
    for (let row = 0; row < numRows; row++) {
      const rowLabel = (validRows as unknown as string[])[row]
      if (rowLabel) {
        rowLabelsGroup
          .append('text')
          .attr('x', padding + labelWidth / 2)
          .attr('y', yScale(numRows - 1 - row) + cellHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-family', 'var(--font-mono)')
          .attr('font-size', '10px')
          .attr('fill', 'currentColor')
          .attr('opacity', 0.45)
          .text(rowLabel)
      }
    }

    const validCellData = cellData.filter((cell) => {
      const [rowStr, colStr] = cell.id.split('-')
      const rowValid = (validRows as unknown as string[]).includes(rowStr)
      const colValid = (validCols as unknown as string[]).includes(colStr)
      return rowValid && colValid
    })

    const finalValidCellData = validCellData.length > 0 ? validCellData : cellData

    const minValue = statistics.minValues[computeConfig.metric]
    const maxValue = statistics.maxValues[computeConfig.metric]

    const cellGroups = svg
      .selectAll<SVGGElement, Cell>('.cell')
      .data(finalValidCellData, (d: Cell) => d.id)
      .enter()
      .append('g')
      .attr('class', 'cell')
      .style('cursor', 'pointer')

    cellGroups
      .append('rect')
      .attr('x', (d) => {
        const [, colStr] = d.id.split('-')
        const colIndex = (validCols as unknown as string[]).indexOf(colStr)
        return colIndex >= 0 ? xScale(colIndex) : xScale(d.col)
      })
      .attr('y', (d) => {
        const [rowStr] = d.id.split('-')
        const rowIndex = (validRows as unknown as string[]).indexOf(rowStr)
        return rowIndex >= 0 ? yScale(numRows - 1 - rowIndex) : yScale(d.row)
      })
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('fill', (d) => getCellColor(d, computeConfig, minValue, maxValue))
      .attr('stroke', (d) => (selectedCell?.id === d.id ? 'currentColor' : 'transparent'))
      .attr('stroke-width', (d) => (selectedCell?.id === d.id ? 2 : 0.5))
      .on('click', function (_event, d) {
        selectCell(d)
      })
      .on('mouseover', function (event, d) {
        d3.select(this).attr('stroke', 'currentColor').attr('stroke-width', 1)

        const existingTooltip = document.querySelector('.arboretum-tooltip')
        if (existingTooltip) existingTooltip.remove()

        const tooltip = document.createElement('div')
        tooltip.className = 'arboretum-tooltip'
        tooltip.innerHTML = `
          <div><strong>Cell:</strong> ${d.id}</div>
          <div><strong>Value:</strong> ${formatCellValue(d, computeConfig)}</div>
          <div><strong>Accessions:</strong> ${d.accessions}</div>
          <div><strong>Families:</strong> ${d.families}</div>
          <div><strong>Species:</strong> ${d.species}</div>
        `
        Object.assign(tooltip.style, {
          position: 'absolute',
          background: 'var(--bg-button)',
          color: 'var(--tx-button)',
          padding: '8px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          fontFamily: 'var(--font-sans)',
          lineHeight: '1.4',
          pointerEvents: 'none',
          zIndex: '1000',
          left: event.pageX + 12 + 'px',
          top: event.pageY - 8 + 'px',
        })
        document.body.appendChild(tooltip)
      })
      .on('mousemove', function (event) {
        const tooltip = document.querySelector<HTMLElement>('.arboretum-tooltip')
        if (tooltip) {
          tooltip.style.left = event.pageX + 12 + 'px'
          tooltip.style.top = event.pageY - 8 + 'px'
        }
      })
      .on('mouseout', function (_event, d) {
        if (selectedCell?.id !== d.id) {
          d3.select(this).attr('stroke', 'transparent').attr('stroke-width', 0.5)
        }
        document.querySelector('.arboretum-tooltip')?.remove()
      })

    return () => {
      document.querySelector('.arboretum-tooltip')?.remove()
    }
  }, [cellData, computeConfig, selectedCell, statistics, h, selectCell, w])

  const minScaleSample: Cell = {
    id: 'min',
    row: 0,
    col: 0,
    accessions: computeConfig.metric === 'ALL' ? statistics.minValues[computeConfig.metric] : 1,
    families: computeConfig.metric === 'FAMILY' ? statistics.minValues[computeConfig.metric] : 1,
    species: computeConfig.metric === 'SPECIES' ? statistics.minValues[computeConfig.metric] : 1,
    zscoreA: computeConfig.metric === 'Z-SCORE' ? statistics.minValues[computeConfig.metric] * 3 : 0,
    zscoreF:
      computeConfig.metric === 'Z-SCORE'
        ? statistics.minValues[computeConfig.metric] * 3
        : computeConfig.metric === 'Z-SCORE-UNIQUE'
          ? statistics.minValues[computeConfig.metric] * 2
          : 0,
    zscoreS:
      computeConfig.metric === 'Z-SCORE'
        ? statistics.minValues[computeConfig.metric] * 3
        : computeConfig.metric === 'Z-SCORE-UNIQUE'
          ? statistics.minValues[computeConfig.metric] * 2
          : 0,
    diversity:
      computeConfig.metric === 'DIVERSITY' ? statistics.minValues[computeConfig.metric] : 0,
    percentage:
      computeConfig.metric === 'PERCENTAGE' ? statistics.minValues[computeConfig.metric] : 0,
    percentageU: 0,
    uniqueFamilies: [],
    uniqueSpecies: [],
    rodHeight: 0,
    blocks: 0,
  }

  const maxScaleSample: Cell = {
    ...minScaleSample,
    id: 'max',
    accessions: computeConfig.metric === 'ALL' ? statistics.maxValues[computeConfig.metric] : 1,
    families: computeConfig.metric === 'FAMILY' ? statistics.maxValues[computeConfig.metric] : 1,
    species: computeConfig.metric === 'SPECIES' ? statistics.maxValues[computeConfig.metric] : 1,
    zscoreA: computeConfig.metric === 'Z-SCORE' ? statistics.maxValues[computeConfig.metric] * 3 : 0,
    zscoreF:
      computeConfig.metric === 'Z-SCORE'
        ? statistics.maxValues[computeConfig.metric] * 3
        : computeConfig.metric === 'Z-SCORE-UNIQUE'
          ? statistics.maxValues[computeConfig.metric] * 2
          : 0,
    zscoreS:
      computeConfig.metric === 'Z-SCORE'
        ? statistics.maxValues[computeConfig.metric] * 3
        : computeConfig.metric === 'Z-SCORE-UNIQUE'
          ? statistics.maxValues[computeConfig.metric] * 2
          : 0,
    diversity:
      computeConfig.metric === 'DIVERSITY' ? statistics.maxValues[computeConfig.metric] : 0,
    percentage:
      computeConfig.metric === 'PERCENTAGE' ? statistics.maxValues[computeConfig.metric] : 0,
  }

  const minColor = getCellColor(
    minScaleSample,
    computeConfig,
    statistics.minValues[computeConfig.metric],
    statistics.maxValues[computeConfig.metric],
  )
  const maxColor = getCellColor(
    maxScaleSample,
    computeConfig,
    statistics.minValues[computeConfig.metric],
    statistics.maxValues[computeConfig.metric],
  )

  return (
    <div className="arboretum-viz">
      <div className="arboretum-viz__header">
        <label className="arboretum-viz__label" htmlFor="metric-select">
          Display
        </label>
        <select
          id="metric-select"
          className="arboretum-viz__select"
          value={computeConfig.metric}
          onChange={(e) => setCompute({ metric: e.target.value as ComputeConfig['metric'] })}
        >
          {METRIC_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="arboretum-viz__scale">
          <div className="arboretum-viz__scale-item">
            <span
              className="arboretum-viz__swatch"
              style={{ background: minColor }}
              aria-hidden="true"
            />
            <span>Min: {formatScaleValue(statistics.minValues[computeConfig.metric], computeConfig.metric)}</span>
          </div>
          <div className="arboretum-viz__scale-item">
            <span
              className="arboretum-viz__swatch"
              style={{ background: maxColor }}
              aria-hidden="true"
            />
            <span>Max: {formatScaleValue(statistics.maxValues[computeConfig.metric], computeConfig.metric)}</span>
          </div>
        </div>
      </div>

      <div className="arboretum-viz__grid">
        <svg
          ref={svgRef}
          width="100%"
          height="auto"
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ aspectRatio: `${w}/${h}`, maxWidth: '100%' }}
        />
      </div>

      <p className="arboretum-viz__hint">
        Click a cell to view details. Colors represent {computeConfig.metric.toLowerCase().replace(/-/g, ' ')}.
      </p>
    </div>
  )
}
