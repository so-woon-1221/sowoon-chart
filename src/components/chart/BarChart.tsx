import { type AxisDomain, type AxisScale, pointer, scaleBand, scaleLinear, select } from 'd3';
import { type PointerEventHandler, useCallback, useEffect, useMemo, useRef } from 'react';

import { useChartTooltip } from '../../hooks/useChartTooltip';
import { useParentSize } from '../../hooks/useParentSize';
import type { ChartProps, TooltipPositionMode } from '../../util/types';
import { getClosestIndex } from '../../util/utils';
import CartesianFrame from '../common/CartesianFrame';
import ChartTooltip from '../common/ChartTooltip';

type BarChartProps = ChartProps & {
  /**
   * padding between bars.
   */
  padding?: number;
  children?: ({ tooltipData }: { tooltipData: { x: string; y: number } }) => React.ReactNode;
  /**
   * Tooltip anchor position.
   * `cursor` follows the mouse and `point` sticks to the matched data point.
   * @default "point"
   */
  tooltipPosition?: TooltipPositionMode;
};

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50,
};

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
  showGridHorizontal = true,
}: BarChartProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<{ x: string; y: number }>();

  const { ref: parentRef, width: parentWidth, height: parentHeight } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const x = useMemo(() => {
    return scaleBand()
      .domain(data.map((d) => d.x))
      .range([margin.left, (parentWidth ?? 0) - margin.right])
      .padding(padding);
  }, [data, margin.left, margin.right, padding, parentWidth]);

  const y = useMemo(() => {
    return scaleLinear()
      .domain([minY ?? 0, maxY ?? Math.max(...data.map((d) => d.y))])
      .range([(parentHeight ?? 0) - margin.bottom, margin.top]);
  }, [data, margin.bottom, margin.top, maxY, minY, parentHeight]);

  const xPositions = useMemo(() => {
    return data.map((d) => (x(d.x) ?? 0) + x.bandwidth() / 2);
  }, [data, x]);

  const drawChart = useCallback(() => {
    const svg = select(ref.current);

    const barArea = svg.select('.bar');

    const bars = barArea.selectAll('rect').data(data);
    bars
      .join('rect')
      .attr('x', (d) => x(d.x) ?? 0)
      .attr('y', (d) => y(d.y) ?? 0)
      .attr('fill', color)
      .attr('width', x.bandwidth())
      .attr('height', (d) => (parentHeight ?? 0) - y(d.y) - margin.bottom);
  }, [color, data, margin.bottom, parentHeight, x, y]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const onMouseMove: PointerEventHandler = useCallback(
    (e) => {
      if (children) {
        const [xPoint, yPoint] = pointer(e);
        const index = getClosestIndex(xPositions, xPoint);
        const point = data[index];

        if (!point) {
          return;
        }

        const isPointTooltip = tooltipPosition === 'point';

        showTooltip({
          left: isPointTooltip ? xPositions[index] : xPoint,
          top: isPointTooltip ? y(point.y) : yPoint,
          data: point,
        });
      }
    },
    [children, data, showTooltip, tooltipPosition, xPositions, y],
  );

  const onMouseLeave = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  return (
    <CartesianFrame
      containerRef={parentRef}
      svgRef={ref}
      width={width}
      height={height}
      parentWidth={parentWidth}
      parentHeight={parentHeight}
      margin={margin}
      xScale={x as AxisScale<AxisDomain>}
      yScale={y as AxisScale<AxisDomain>}
      showGridVertical={showGridVertical}
      showGridHorizontal={showGridHorizontal}
      onPointerMove={onMouseMove}
      onPointerLeave={onMouseLeave}
      chart={<g className="bar" />}
      tooltip={
        children &&
        tooltip.isOpen &&
        tooltip.data && (
          <ChartTooltip
            left={tooltip.left}
            top={tooltip.top}
            align={tooltipPosition === 'point' ? 'center' : 'cursor'}
          >
            {children({ tooltipData: tooltip.data })}
          </ChartTooltip>
        )
      }
    />
  );
};

export default BarChart;
