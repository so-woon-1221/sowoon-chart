import AxisBottom from '../common/AxisBottom.tsx'
import {
  type AxisDomain,
  type AxisScale,
  extent,
  pointer,
  scaleBand,
  scaleLinear,
  select
} from 'd3'
import AxisLeft from '../common/AxisLeft.tsx'
import { defaultStyles, useTooltip, useTooltipInPortal } from '@visx/tooltip'
import { useParentSize } from '../../hooks/useParentSize.tsx'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { mergeRefs } from '../../util/utils.ts'
import GridVertical from '../common/GridVertical.tsx'
import GridHorizontal from '../common/GridHorizontal.tsx'

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
  showGridVertical = true
}: Props) => {
  const {
    ref: parentRef,
    height: parentHeight,
    width: parentWidth
  } = useParentSize()

  const ref = useRef<SVGSVGElement>(null)

  const {
    showTooltip,
    tooltipOpen,
    tooltipData,
    tooltipLeft,
    tooltipTop,
    hideTooltip
  } = useTooltip()
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    detectBounds: true
  })

  const parent = mergeRefs(parentRef, containerRef)

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

    updateSelection
      .join('circle')
      .attr('cx', d => x(d.x)! + x.bandwidth() / 2)
      .attr('cy', d => y(d.y))
      .attr('r', d => sizeScale(d.value))
      .attr('fill', color)
      .on('pointermove', (e, d) => {
        const [x, y] = pointer(e)
        showTooltip({
          tooltipData: { x: d.x, y: d.y, value: d.value },
          tooltipLeft: x + tooltipOffset.x,
          tooltipTop: y + tooltipOffset.y
        })
      })
      .on('pointerleave', hideTooltip)
  }, [
    data,
    hideTooltip,
    showTooltip,
    sizeScale,
    tooltipOffset.x,
    tooltipOffset.y,
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
      ref={parent}
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
      {children && tooltipOpen && (
        <TooltipInPortal
          left={tooltipLeft}
          top={tooltipTop}
          style={{
            ...defaultStyles,
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            padding: 0
          }}
        >
          {children({
            tooltipData: tooltipData as {
              x: string
              y: number
              value: number
            }
          })}
        </TooltipInPortal>
      )}
    </div>
  )
}

export default ScatterChart
