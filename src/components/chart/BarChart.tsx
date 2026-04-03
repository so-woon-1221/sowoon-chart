import {
  PointerEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef
} from 'react'
import {
  type AxisDomain,
  type AxisScale,
  pointer,
  scaleBand,
  scaleLinear,
  select
} from 'd3'
import { useParentSize } from '../../hooks/useParentSize'
import AxisBottom from '../common/AxisBottom'
import AxisLeft from '../common/AxisLeft'
import { getClosestIndex } from '../../util/utils'
import type { ChartProps, TooltipPositionMode } from '../../util/types'
import GridVertical from '../common/GridVertical'
import GridHorizontal from '../common/GridHorizontal'
import { useChartTooltip } from '../../hooks/useChartTooltip'
import ChartTooltip from '../common/ChartTooltip'

type BarChartProps = ChartProps & {
  /**
   * padding between bars.
   */
  padding?: number
  children?: ({
    tooltipData
  }: {
    tooltipData: { x: string; y: number }
  }) => React.ReactNode
  /**
   * Tooltip anchor position.
   * `cursor` follows the mouse and `point` sticks to the matched data point.
   * @default "point"
   */
  tooltipPosition?: TooltipPositionMode
}

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50
}

const BarChart = ({
  data,
  width,
  height,
  margin = defaultMargin,
  color = 'black',
  minY,
  maxY,
  padding = 0.1,
  children,
  tooltipPosition = 'point',
  showGridVertical = true,
  showGridHorizontal = true
}: BarChartProps) => {
  const { tooltip, showTooltip, hideTooltip } =
    useChartTooltip<{ x: string; y: number }>()

  const {
    ref: parentRef,
    width: parentWidth,
    height: parentHeight
  } = useParentSize()

  const ref = useRef<SVGSVGElement>(null)

  const x = useMemo(() => {
    return scaleBand()
      .domain(data.map(d => d.x))
      .range([margin.left, (parentWidth ?? 0) - margin.right])
      .padding(padding)
  }, [data, margin.left, margin.right, padding, parentWidth])

  const y = useMemo(() => {
    return scaleLinear()
      .domain([minY ?? 0, maxY ?? Math.max(...data.map(d => d.y))])
      .range([(parentHeight ?? 0) - margin.bottom, margin.top])
  }, [data, margin.bottom, margin.top, maxY, minY, parentHeight])

  const xPositions = useMemo(() => {
    return data.map(d => (x(d.x) ?? 0) + x.bandwidth() / 2)
  }, [data, x])

  const drawChart = useCallback(() => {
    const svg = select(ref.current)

    const barArea = svg.select('.bar')

    const bars = barArea.selectAll('rect').data(data)
    bars
      .join('rect')
      .attr('x', d => x(d.x) ?? 0)
      .attr('y', d => y(d.y) ?? 0)
      .attr('fill', color)
      .attr('width', x.bandwidth())
      .attr('height', d => (parentHeight ?? 0) - y(d.y) - margin.bottom)
  }, [color, data, margin.bottom, parentHeight, x, y])

  useEffect(() => {
    drawChart()
  }, [drawChart])

  const onMouseMove: PointerEventHandler = useCallback(
    e => {
      if (children) {
        const [xPoint, yPoint] = pointer(e)
        const index = getClosestIndex(xPositions, xPoint)
        const point = data[index]

        if (!point) {
          return
        }

        const isPointTooltip = tooltipPosition === 'point'

        showTooltip({
          left: isPointTooltip ? xPositions[index] : xPoint,
          top: isPointTooltip ? y(point.y) : yPoint,
          data: point
        })
      }
    },
    [children, data, showTooltip, tooltipPosition, xPositions, y]
  )

  const onMouseLeave = useCallback(() => {
    hideTooltip()
  }, [hideTooltip])

  return (
    <div
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        position: 'relative'
      }}
      ref={parentRef}
    >
      <svg
        width={'100%'}
        height={'100%'}
        ref={ref}
        onPointerMove={onMouseMove}
        onPointerLeave={onMouseLeave}
      >
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
        >
          {children({ tooltipData: tooltip.data })}
        </ChartTooltip>
      )}
    </div>
  )
}

export default BarChart
