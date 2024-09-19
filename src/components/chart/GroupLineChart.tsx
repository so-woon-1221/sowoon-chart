import AxisBottom from '../common/AxisBottom.tsx'
import {
  type AxisDomain,
  type AxisScale,
  bisectCenter,
  bisectLeft,
  line,
  pointer,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  select
} from 'd3'
import AxisLeft from '../common/AxisLeft.tsx'
import { defaultStyles, useTooltip, useTooltipInPortal } from '@visx/tooltip'
import { useParentSize } from '../../hooks/useParentSize.tsx'
import {
  type PointerEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef
} from 'react'
import { mergeRefs } from '../../util/utils.ts'
import type { ChartProps } from '../../util/types.ts'
import GridVertical from '../common/GridVertical.tsx'
import GridHorizontal from '../common/GridHorizontal.tsx'

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
  showGridHorizontal = true,
  showGridVertical = true
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
  }, [data, margin.left, margin.right, parentWidth])

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
        const xDomain = data.map(d => x(d.x) as number)
        const index = bisectLeft(xDomain, xPoint) - 1

        const yData = y.invert(yPoint)
        const yDomain = keyList.map(key => {
          return data[index][key] as number
        })
        const yIndex = Math.max(
          0,
          Math.min(yDomain.length - 1, bisectCenter(yDomain, yData))
        )

        if (data[index]) {
          const tooltipX = x(data[index].x)! + x.bandwidth() / 2
          const tooltipY = y(data[index][keyList[yIndex]] as number)
          showTooltip({
            tooltipLeft: tooltipX + tooltipOffset.x,
            tooltipTop: tooltipY + tooltipOffset.y,
            tooltipData: {
              x: data[index].x,
              y: data[index][keyList[yIndex]] as number
            }
          })
        }
      }
    },
    [
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

export default GroupLineChart
