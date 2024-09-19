import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  type AxisDomain,
  axisLeft,
  type AxisScale,
  select,
  Selection
} from 'd3'

interface Props {
  scale: AxisScale<AxisDomain>
  size: number
  count?: number
  left?: number
}

const GridHorizontal = ({ scale, size, count = 4, left }: Props) => {
  const ref = useRef<SVGGElement>(null)

  const gridScale = useMemo(() => {
    return axisLeft(scale)
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

    container
      .attr('transform', `translate(${left ?? 0}, 0)`)
      .attr('stroke', '#e0e0e044')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '2,2')
      .call(gridScale)
  }, [gridScale, left])

  useEffect(() => {
    drawGrid()
  }, [drawGrid])

  return <g ref={ref} />
}

export default GridHorizontal
