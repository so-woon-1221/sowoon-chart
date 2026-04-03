import AxisBottom from '../common/AxisBottom'
import {
  type AxisDomain,
  type AxisScale,
  extent,
  pointer,
  scaleBand,
  scaleLinear,
  select
} from 'd3'
import AxisLeft from '../common/AxisLeft'
import { useParentSize } from '../../hooks/useParentSize'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import GridVertical from '../common/GridVertical'
import GridHorizontal from '../common/GridHorizontal'
import { useChartTooltip } from '../../hooks/useChartTooltip'
import ChartTooltip from '../common/ChartTooltip'
import type { TooltipPositionMode } from '../../util/types'

type Props = {
  /**
   * Width of the chart.
   */
  width?: number
  /**
   * Height of the chart.
   */
  height?: number
  /**
   * Margin of the chart.
   * @default { top: 20, right: 20, bottom: 50, left: 50 }
   */
  margin?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  /**
   * Tooltip children.
   * @param tooltipData
   */
  children?: ({
    tooltipData
  }: {
    tooltipData: { x: string; y: number; value: number }
  }) => React.ReactNode
  /**
   * Data for the chart.
   */
  data: {
    x: string
    y: number
    value: number
  }[]
  /**
   * Min size of circle.
   */
  minSize?: number
  /**
   * Max size of circle.
   */
  maxSize?: number
  /**
   * Min y value.
   */
  minY?: number
  /**
   * Max y value.
   */
  maxY?: number
  /**
   * Offset of tooltip.
   * @default { x: 20, y: -20 }
   */
  tooltipOffset?: { x: number; y: number }
  /**
   * color of the chart.
   */
  color?: string
  /**
   * Display grid lines along the x-axis.
   */
  showGridVertical?: boolean
  /**
   * Display grid lines along the y-axis.
   */
  showGridHorizontal?: boolean
  /**
   * Tooltip anchor position.
   * `cursor` follows the mouse and `point` sticks to the matched data point.
   * @default "cursor"
   */
  tooltipPosition?: TooltipPositionMode
}

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50
}

const ScatterChart = ({
  width,
  height,
  data,
  margin = defaultMargin,
  children,
  minSize,
  maxSize,
  minY,
  maxY,
  tooltipOffset = { x: 20, y: -20 },
  color = 'black',
  showGridHorizontal = true,
  showGridVertical = true,
  tooltipPosition = 'cursor'
}: Props) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<{
    x: string
    y: number
    value: number
  }>()

  const {
    ref: parentRef,
    height: parentHeight,
    width: parentWidth
  } = useParentSize()

  const ref = useRef<SVGSVGElement>(null)

  const x = useMemo(() => {
    return scaleBand()
      .domain(data.map(d => d.x))
      .range([margin.left, (parentWidth ?? 0) - margin.right])
  }, [data, margin.left, margin.right, parentWidth])

  const y = useMemo(() => {
    return scaleLinear()
      .domain([minY ?? 0, maxY ?? Math.max(...data.map(d => d.y))])
      .nice()
      .range([(parentHeight ?? 0) - margin.bottom, margin.top])
  }, [data, margin.bottom, margin.top, maxY, minY, parentHeight])

  const sizeScale = useMemo(() => {
    return scaleLinear()
      .domain(extent(data, d => d.value) as [number, number])
      .range([minSize ?? 5, maxSize ?? 20])
  }, [data, maxSize, minSize])

  const drawChart = useCallback(() => {
    const svg = select(ref.current)
    const chartContainer = svg.select('g.bar')

    const updateSelection = chartContainer.selectAll('circle').data(data)

    const circles = updateSelection.join('circle')
    circles
      .attr('cx', d => x(d.x)! + x.bandwidth() / 2)
      .attr('cy', d => y(d.y))
      .attr('r', 0)
      .transition()
      .attr('r', d => sizeScale(d.value))
      .attr('fill', color)
    circles
      .on('pointermove', (e, d) => {
        const [xPoint, yPoint] = pointer(e, ref.current)
        const isPointTooltip = tooltipPosition === 'point'
        showTooltip({
          left: isPointTooltip ? x(d.x)! + x.bandwidth() / 2 : xPoint,
          top: isPointTooltip ? y(d.y) : yPoint,
          data: { x: d.x, y: d.y, value: d.value }
        })
      })
      .on('pointerleave', hideTooltip)
  }, [
    color,
    data,
    hideTooltip,
    showTooltip,
    sizeScale,
    tooltipPosition,
    x,
    y
  ])

  useEffect(() => {
    drawChart()
  }, [drawChart])

  return (
    <div
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        position: 'relative'
      }}
      ref={parentRef}
    >
      <svg width={'100%'} height={'100%'} ref={ref}>
        {showGridVertical && (
          <GridVertical
            scale={x as AxisScale<AxisDomain>}
            size={parentHeight - margin.bottom - margin.top}
            top={parentHeight - margin.bottom}
          />
        )}
        {showGridHorizontal && (
          <GridHorizontal
            scale={y as AxisScale<AxisDomain>}
            size={parentWidth - margin.left - margin.right}
            left={margin.left}
          />
        )}
        <AxisBottom
          scale={x as AxisScale<AxisDomain>}
          top={(parentHeight ?? 0) - margin.bottom}
        />
        <AxisLeft scale={y as AxisScale<AxisDomain>} left={margin.left} />
        <g className="bar" />
      </svg>
      {children && tooltip.isOpen && tooltip.data && (
        <ChartTooltip
          left={tooltip.left}
          top={tooltip.top}
          align={tooltipPosition === 'point' ? 'center' : 'cursor'}
          offsetX={tooltipOffset.x}
          offsetY={tooltipOffset.y}
        >
          {children({
            tooltipData: tooltip.data
          })}
        </ChartTooltip>
      )}
    </div>
  )
}

export default ScatterChart
