import AxisBottom from '../common/AxisBottom'
import {
  type AxisDomain,
  type AxisScale,
  pointer,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  select
} from 'd3'
import AxisLeft from '../common/AxisLeft'
import type { ChartProps } from '../../util/types'
import { useParentSize } from '../../hooks/useParentSize'
import {
  type PointerEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef
} from 'react'
import { getClosestIndex } from '../../util/utils'
import GridVertical from '../common/GridVertical'
import GridHorizontal from '../common/GridHorizontal'
import { useChartTooltip } from '../../hooks/useChartTooltip'
import ChartTooltip from '../common/ChartTooltip'
import type { TooltipPositionMode } from '../../util/types'

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
    tooltipData: { x: string; y: number }
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
   * Gap between bars.
   */
  padding?: number
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

const GroupBarChart = ({
  width,
  height,
  margin = defaultMargin,
  data,
  children,
  colorList = [
    '#1f77b4',
    '#ff7f0e',
    '#2ca02c',
    '#d62728',
    '#9467bd',
    '#8c564b',
    '#e377c2',
    '#7f7f7f',
    '#bcbd22',
    '#17becf'
  ],
  tooltipOffset = { x: 10, y: -10 },
  padding = 0.1,
  tooltipPosition = 'point',
  maxY,
  minY,
  showGridHorizontal = true,
  showGridVertical = true
}: Props) => {
  const { tooltip, showTooltip, hideTooltip } =
    useChartTooltip<{ x: string; y: number }>()

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
      .padding(padding)
  }, [data, margin.left, margin.right, padding, parentWidth])

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

  const barScale = useMemo(() => {
    return scaleBand()
      .domain(keyList)
      .range([0, x.bandwidth()])
      .padding(padding)
  }, [keyList, padding, x])

  const groupPositions = useMemo(() => {
    return data.map(d => (x(d.x) ?? 0) + x.bandwidth() / 2)
  }, [data, x])

  const barPositions = useMemo(() => {
    return keyList.map(key => (barScale(key) ?? 0) + barScale.bandwidth() / 2)
  }, [barScale, keyList])

  const drawChart = useCallback(() => {
    const svg = select(ref.current)
    const chartContainer = svg.select('.chart')

    const bars = chartContainer
      .selectAll('.bar-group')
      .data(data)
      .join('g')
      .attr('class', 'bar-group')
      .attr('transform', d => `translate(${x(d.x)}, 0)`)

    bars
      .selectAll('rect')
      .data(d => keyList.map(key => ({ key, value: d[key] as number })))
      .join('rect')
      .attr('x', d => barScale(d.key)!)
      .attr('y', d => y(d.value))
      .attr('width', barScale.bandwidth())
      .attr('height', d => y(0) - y(d.value))
      .attr('fill', d => colorScale(d.key) as string)
  }, [barScale, colorScale, data, keyList, x, y])

  useEffect(() => {
    drawChart()
  }, [drawChart])

  const onMouseMove: PointerEventHandler = useCallback(
    e => {
      if (children) {
        const [xPoint, yPoint] = pointer(e)
        const groupIndex = getClosestIndex(groupPositions, xPoint)
        const point = data[groupIndex]

        if (!point) {
          return
        }

        const groupStart = x(point.x)
        if (groupStart == null) {
          return
        }

        const barIndex = getClosestIndex(barPositions, xPoint - groupStart)
        const key = keyList[barIndex]

        if (!key) {
          return
        }

        const value = point[key]
        if (typeof value !== 'number') {
          return
        }

        const isPointTooltip = tooltipPosition === 'point'

        showTooltip({
          left: isPointTooltip ? groupStart + barPositions[barIndex] : xPoint,
          top: isPointTooltip ? y(value) : yPoint,
          data: { x: point.x, y: value }
        })
      }
    },
    [
      barPositions,
      children,
      data,
      groupPositions,
      keyList,
      showTooltip,
      tooltipPosition,
      x,
      y
    ]
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
        onPointerLeave={onMouseLeave}
        onPointerMove={onMouseMove}
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

export default GroupBarChart
