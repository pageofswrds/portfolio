import type { Cell, ComputeConfig } from './ArboretumProvider'

export const getCellValue = (cell: Cell, computeConfig: ComputeConfig): number => {
  switch (computeConfig.metric) {
    case 'ALL':
      return cell.accessions
    case 'FAMILY':
      return cell.families
    case 'SPECIES':
      return cell.species
    case 'Z-SCORE':
      return (cell.zscoreA + cell.zscoreF + cell.zscoreS) / 3
    case 'Z-SCORE-UNIQUE':
      return (cell.zscoreF + cell.zscoreS) / 2
    case 'DIVERSITY':
      return cell.diversity
    case 'PERCENTAGE':
      return cell.percentage
    default:
      return cell.accessions
  }
}

const getColorScheme = (metric: ComputeConfig['metric']) => {
  switch (metric) {
    case 'ALL':
      return { hue: 42, saturation: 85, name: 'Gold' }
    case 'FAMILY':
      return { hue: 160, saturation: 65, name: 'Teal' }
    case 'SPECIES':
      return { hue: 120, saturation: 60, name: 'Green' }
    case 'Z-SCORE':
      return { hue: 280, saturation: 70, name: 'Purple' }
    case 'Z-SCORE-UNIQUE':
      return { hue: 320, saturation: 65, name: 'Magenta' }
    case 'DIVERSITY':
      return { hue: 45, saturation: 75, name: 'Orange' }
    case 'PERCENTAGE':
      return { hue: 0, saturation: 70, name: 'Red' }
    default:
      return { hue: 210, saturation: 70, name: 'Blue' }
  }
}

export const getCellColor = (
  cell: Cell,
  computeConfig: ComputeConfig,
  minValue?: number,
  maxValue?: number,
): string => {
  const value = getCellValue(cell, computeConfig)

  if (cell.accessions === 0) {
    return '#f5f5f5'
  }

  const min = minValue ?? 0
  const max = maxValue ?? Math.max(value, 1)
  const range = max - min
  const normalizedValue = range > 0 ? (value - min) / range : 0
  const clampedValue = Math.max(0, Math.min(1, normalizedValue))

  const colorScheme = getColorScheme(computeConfig.metric)
  const lightness = 90 - clampedValue * 60

  return `hsl(${colorScheme.hue}, ${colorScheme.saturation}%, ${lightness}%)`
}

export const formatCellValue = (cell: Cell, computeConfig: ComputeConfig): string => {
  const value = getCellValue(cell, computeConfig)

  switch (computeConfig.metric) {
    case 'Z-SCORE':
    case 'Z-SCORE-UNIQUE':
    case 'DIVERSITY':
      return value.toFixed(2)
    case 'PERCENTAGE':
      return `${value.toFixed(1)}%`
    default:
      return Math.round(value).toString()
  }
}

export const getMetricDisplayName = (metric: ComputeConfig['metric']): string => {
  switch (metric) {
    case 'ALL':
      return 'Total Accessions'
    case 'FAMILY':
      return 'Unique Families'
    case 'SPECIES':
      return 'Unique Species'
    case 'Z-SCORE':
      return 'Average Z-Score'
    case 'Z-SCORE-UNIQUE':
      return 'Uniqueness Z-Score'
    case 'DIVERSITY':
      return 'Diversity Index'
    case 'PERCENTAGE':
      return 'Percentage'
    default:
      return 'Total Accessions'
  }
}
