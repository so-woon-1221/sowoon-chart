import { type AxisDomain, type AxisScale, line, pointer, scaleBand, scaleLinear, select } from 'd3';
import { type PointerEventHandler, useCallback, useEffect, useMemo, useRef } from 'react';

import { useChartTooltip } from '../../hooks/useChartTooltip';
import { useParentSize } from '../../hooks/useParentSize';
import type { ChartProps, TooltipPositionMode } from '../../util/types';
import { getClosestIndex } from '../../util/utils';
import CartesianFrame from '../common/CartesianFrame';
import ChartTooltip from '../common/ChartTooltip';

type LineChartProps = ChartProps & {
  children?: ({ tooltipData }: { tooltipData: { x: string; y: number } }) => React.ReactNode;
  /**
   * Tooltip anchor position.
   * `cursor` follows the mouse and `point` sticks to the matched data point.
   * @default "cursor"
   */
  tooltipPosition?: TooltipPositionMode;
};

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50,
};

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
  tooltipPosition = 'cursor',
  showGridVertical = true,
  showGridHorizontal = true,
}: LineChartProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<{ x: string; y: number }>();

  const { ref: parentRef, width: parentWidth, height: parentHeight } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const x = useMemo(() => {
    return scaleBand()
      .domain(data.map((d) => d.x))
      .range([margin.left, (parentWidth ?? 0) - margin.right]);
  }, [data, margin.left, margin.right, parentWidth]);

  const y = useMemo(() => {
    return scaleLinear()
      .domain([minY ?? 0, maxY ?? Math.max(...data.map((d) => d.y))])
      .range([(parentHeight ?? 0) - margin.bottom, margin.top]);
  }, [data, margin.bottom, margin.top, maxY, minY, parentHeight]);

  const xPositions = useMemo(() => {
    return data.map((d) => (x(d.x) ?? 0) + x.bandwidth() / 2);
  }, [data, x]);

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

  const drawChart = useCallback(() => {
    const svg = select(ref.current);

    const lineArea = svg.select('.line');
    const lineGenerator = line<{ x: string; y: number }>()
      .x((d) => x(d.x)! + x.bandwidth() / 2)
      .y((d) => y(d.y));

    lineArea
      .selectAll('path')
      .data([data])
      .join('path')
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1.5);
  }, [color, data, x, y]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

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
      onPointerLeave={hideTooltip}
      chart={<g className="line" />}
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

export default LineChart;
