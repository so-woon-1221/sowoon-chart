import AxisBottom from '../common/AxisBottom.tsx'
import {
  type AxisDomain,
  type AxisScale,
  bisectLeft,
  pointer,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  select
} from 'd3'
import AxisLeft from '../common/AxisLeft.tsx'
import { defaultStyles, useTooltip, useTooltipInPortal } from '@visx/tooltip'
import type { ChartProps } from '../../util/types.ts'
import { useParentSize } from '../../hooks/useParentSize.tsx'
import {
  type PointerEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef
} from 'react'
import { mergeRefs } from '../../util/utils.ts'

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
  maxY,
  minY
}: Props) => {
  const {
    ref: parentRef,
    width: parentWidth,
    height: parentHeight
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
        const [xPoint] = pointer(e)
        const xDomain = data.map(d => x(d.x) as number)
        const index = bisectLeft(xDomain, xPoint) - 1

        const yDomain = keyList.map(key => data[index][key] as number)
        const barDomain = keyList.map(key => barScale(key)! + x(data[index].x)!)
        const barIndex = bisectLeft(barDomain, xPoint) - 1
        const [nowX, nowY] = [data[index].x, yDomain[barIndex]]
        if (nowX && nowY) {
          const tooltipX =
            x(data[index].x)! +
            barScale(keyList[barIndex])! +
            barScale.bandwidth() / 2 +
            tooltipOffset.x
          const tooltipY = y(nowY as number) + tooltipOffset.y
          showTooltip({
            tooltipLeft: tooltipX,
            tooltipTop: tooltipY,
            tooltipData: { x: nowX, y: nowY }
          })
        }
      }
    },
    [
      barScale,
      children,
      data,
      keyList,
      showTooltip,
      tooltipOffset.x,
      tooltipOffset.y,
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
      ref={parent}
    >
      <svg
        width={'100%'}
        height={'100%'}
        ref={ref}
        onPointerLeave={onMouseLeave}
        onPointerMove={onMouseMove}
      >
        <AxisBottom
          scale={x as AxisScale<AxisDomain>}
          top={(parentHeight ?? 0) - margin.bottom}
        />
        <AxisLeft scale={y as AxisScale<AxisDomain>} left={margin.left} />
        <g className="chart" />
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
            }
          })}
        </TooltipInPortal>
      )}
    </div>
  )
}

export default GroupBarChart
