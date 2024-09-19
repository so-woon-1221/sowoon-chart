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
  bisectLeft,
  line,
  pointer,
  scaleBand,
  scaleLinear,
  select
} from 'd3'
import { useParentSize } from '../../hooks/useParentSize.tsx'
import AxisBottom from '../common/AxisBottom.tsx'
import AxisLeft from '../common/AxisLeft.tsx'
import { defaultStyles, useTooltip, useTooltipInPortal } from '@visx/tooltip'
import { mergeRefs } from '../../util/utils.ts'
import type { ChartProps } from '../../util/types.ts'
import GridVertical from '../common/GridVertical.tsx'
import GridHorizontal from '../common/GridHorizontal.tsx'

type LineChartProps = ChartProps & {
  children?: ({
    tooltipData
  }: {
    tooltipData: { x: string; y: number }
  }) => React.ReactNode
}

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50
}

/**
 * Line chart component.
 */
const LineChart = ({
  data,
  margin = defaultMargin,
  color = 'black',
  minY,
  maxY,
  width,
  height,
  children,
  showGridVertical = true,
  showGridHorizontal = true
}: LineChartProps) => {
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

  const {
    ref: parentRef,
    width: parentWidth,
    height: parentHeight
  } = useParentSize()

  const parent = mergeRefs(containerRef, parentRef)
  const ref = useRef<SVGSVGElement>(null)

  const x = useMemo(() => {
    return scaleBand()
      .domain(data.map(d => d.x))
      .range([margin.left, (parentWidth ?? 0) - margin.right])
  }, [data, margin.left, margin.right, parentWidth])

  const y = useMemo(() => {
    return scaleLinear()
      .domain([minY ?? 0, maxY ?? Math.max(...data.map(d => d.y))])
      .range([(parentHeight ?? 0) - margin.bottom, margin.top])
  }, [data, margin.bottom, margin.top, maxY, minY, parentHeight])

  const onMouseMove: PointerEventHandler = useCallback(
    e => {
      if (children) {
        const [xPoint] = pointer(e)
        const xDomain = data.map(d => x(d.x) as number)
        const index = bisectLeft(xDomain, xPoint) - 1
        if (data[index]) {
          const tooltipX = x(data[index].x)! + x.bandwidth() / 2
          const tooltipY = y(data[index].y)
          showTooltip({
            tooltipLeft: tooltipX,
            tooltipTop: tooltipY,
            tooltipData: data[index]
          })
        }
      }
    },
    [children, data, showTooltip, x, y]
  )

  const drawChart = useCallback(() => {
    const svg = select(ref.current)

    const lineArea = svg.select('.line')
    const lineGenerator = line<{ x: string; y: number }>()
      .x(d => x(d.x)! + x.bandwidth() / 2)
      .y(d => y(d.y))

    lineArea
      .selectAll('path')
      .data([data])
      .join('path')
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1.5)
  }, [color, data, x, y])

  useEffect(() => {
    drawChart()
  }, [drawChart])

  return (
    <div
      ref={parent}
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        position: 'relative'
      }}
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
        <g className="line" />
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
          {children({ tooltipData: tooltipData as { x: string; y: number } })}
        </TooltipInPortal>
      )}
    </div>
  )
}

export default LineChart
