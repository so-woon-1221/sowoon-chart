import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  axisBottom,
  type AxisDomain,
  type AxisScale,
  select,
  Selection
} from 'd3'

interface Props {
  scale: AxisScale<AxisDomain>
  size: number
  count?: number
  top?: number
}

const GridVertical = ({ scale, size, count = 4, top }: Props) => {
  const ref = useRef<SVGGElement>(null)

  const gridScale = useMemo(() => {
    return axisBottom(scale)
      .ticks(count)
      .tickSize(-size)
      .tickFormat(() => '')
  }, [scale, count, size])

  const drawGrid = useCallback(() => {
    const container = select(ref.current) as Selection<
      SVGGElement,
      unknown,
      null,
      undefined
    >

    // Draw grid lines
    container
      .attr('transform', `translate(0, ${top})`)
      .attr('stroke', '#e0e0e044')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '2,2')
      .call(gridScale)
  }, [gridScale, top])

  useEffect(() => {
    drawGrid()
  }, [drawGrid])

  return <g ref={ref} />
}

export default GridVertical
