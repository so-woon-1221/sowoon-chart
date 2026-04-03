import AxisBottom from '../common/AxisBottom'
import {
  type AxisDomain,
  type AxisScale,
  line,
  pointer,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  select
} from 'd3'
import AxisLeft from '../common/AxisLeft'
import { useParentSize } from '../../hooks/useParentSize'
import {
  type PointerEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef
} from 'react'
import { getClosestIndex } from '../../util/utils'
import type { ChartProps, TooltipPositionMode } from '../../util/types'
import GridVertical from '../common/GridVertical'
import GridHorizontal from '../common/GridHorizontal'
import { useChartTooltip } from '../../hooks/useChartTooltip'
import ChartTooltip from '../common/ChartTooltip'

type DataType = {
  x: string
  [key: string]: number | string
}

type Props = Omit<ChartProps, 'data' | 'color'> & {
  /**
   * Data to display in the chart.
   */
  data: DataType[]
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
   * List of colors to use for the chart.
   */
  colorList?: string[]
  /**
   * Offset of the tooltip from the mouse pointer.
   */
  tooltipOffset?: { x: number; y: number }
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

const GroupLineChart = ({
  width,
  height,
  margin = defaultMargin,
  children,
  data,
  minY,
  maxY,
  colorList = [
    '#98abc5',
    '#8a89a6',
    '#7b6888',
    '#6b486b',
    '#a05d56',
    '#d0743c',
    '#ff8c00'
  ],
  tooltipOffset = { x: 10, y: -10 },
  tooltipPosition = 'point',
  showGridHorizontal = true,
  showGridVertical = true
}: Props) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<{
    x: string
    y: number
    value: number
  }>()

  const {
    ref: parentRef,
    width: parentWidth,
    height: parentHeight
  } = useParentSize()

  const ref = useRef<SVGSVGElement>(null)

  const keyList = useMemo(() => {
    return Object.keys(data[0]).filter(key => key !== 'x')
  }, [data])

  const x = useMemo(() => {
    return scaleBand()
      .domain(data.map(d => d.x))
      .range([margin.left, (parentWidth ?? 0) - margin.right])
  }, [data, margin.left, margin.right, parentWidth])

  const xPositions = useMemo(() => {
    return data.map(d => (x(d.x) ?? 0) + x.bandwidth() / 2)
  }, [data, x])

  const y = useMemo(() => {
    const maxYList = keyList.map(key => {
      return Math.max(...data.map(d => d[key] as number))
    })
    const max = Math.max(...maxYList)

    return scaleLinear()
      .domain([minY ?? 0, maxY ?? max])
      .range([(parentHeight ?? 0) - margin.bottom, margin.top])
  }, [data, keyList, margin.bottom, margin.top, maxY, minY, parentHeight])

  const colorScale = useMemo(() => {
    return scaleOrdinal().domain(keyList).range(colorList)
  }, [colorList, keyList])

  const lineGenerator = useMemo(() => {
    return line<{ x: string; y: number }>()
      .x(d => (x(d.x) as number) + x.bandwidth() / 2)
      .y(d => y(d.y))
  }, [x, y])

  const drawChart = useCallback(() => {
    const svg = select(ref.current)
    const chartContainer = svg.select('.chart')

    const lines = chartContainer.selectAll('g').data(keyList)

    lines
      .join('g')
      .attr('stroke', key => colorScale(key) as string)
      .selectAll('path')
      .data(key => {
        return [data.map(d => ({ x: d.x, y: d[key] as number }))]
      })
      .join('path')
      .attr('fill', 'none')
      .attr('stroke-width', 1.5)
      .attr('d', lineGenerator)
  }, [colorScale, data, keyList, lineGenerator])

  useEffect(() => {
    drawChart()
  }, [drawChart])

  const onMouseMove: PointerEventHandler = useCallback(
    e => {
      if (children) {
        const [xPoint, yPoint] = pointer(e)
        const index = getClosestIndex(xPositions, xPoint)
        const point = data[index]

        if (!point || keyList.length === 0) {
          return
        }

        const yData = y.invert(yPoint)
        const yIndex = keyList.reduce((closestIndex, key, currentIndex) => {
          const currentValue = point[key]
          const closestValue = point[keyList[closestIndex]]

          if (
            typeof currentValue !== 'number' ||
            typeof closestValue !== 'number'
          ) {
            return closestIndex
          }

          return Math.abs(currentValue - yData) < Math.abs(closestValue - yData)
            ? currentIndex
            : closestIndex
        }, 0)
        const value = point[keyList[yIndex]]

        if (typeof value !== 'number') {
          return
        }

        const isPointTooltip = tooltipPosition === 'point'

        showTooltip({
          left: isPointTooltip ? xPositions[index] : xPoint,
          top: isPointTooltip ? y(value) : yPoint,
          data: {
            x: point.x,
            y: value,
            value
          }
        })
      }
    },
    [
      children,
      data,
      keyList,
      showTooltip,
      tooltipPosition,
      xPositions,
      y
    ]
  )

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
        onPointerLeave={hideTooltip}
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
        <g className="chart" />
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

export default GroupLineChart
