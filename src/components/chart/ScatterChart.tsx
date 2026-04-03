import {
  type AxisDomain,
  type AxisScale,
  extent,
  pointer,
  scaleBand,
  scaleLinear,
  select,
} from 'd3';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useChartTooltip } from '../../hooks/useChartTooltip';
import { useParentSize } from '../../hooks/useParentSize';
import type {
  CartesianChartProps,
  Margin,
  ScatterDatum,
  TooltipOffset,
  TooltipPositionMode,
  TooltipRenderer,
} from '../../util/types';
import CartesianFrame from '../common/CartesianFrame';
import ChartTooltip from '../common/ChartTooltip';

type Props = CartesianChartProps<ScatterDatum> & {
  /**
   * Tooltip children.
   * @param tooltipData
   */
  children?: TooltipRenderer<ScatterDatum>;
  /**
   * Min size of circle.
   */
  minSize?: number;
  /**
   * Max size of circle.
   */
  maxSize?: number;
  /**
   * Min y value.
   */
  minY?: number;
  /**
   * Max y value.
   */
  maxY?: number;
  /**
   * Offset of tooltip.
   * @default { x: 20, y: -20 }
   */
  tooltipOffset?: TooltipOffset;
  /**
   * color of the chart.
   */
  color?: string;
  /**
   * Display grid lines along the x-axis.
   */
  showGridVertical?: boolean;
  /**
   * Display grid lines along the y-axis.
   */
  showGridHorizontal?: boolean;
  /**
   * Tooltip anchor position.
   * `cursor` follows the mouse and `point` sticks to the matched data point.
   * @default "cursor"
   */
  tooltipPosition?: TooltipPositionMode;
};

const defaultMargin: Margin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50,
};

const ScatterChart = ({
  width,
  height,
  data,
  margin = defaultMargin,
  children,
  minSize,
  maxSize,
  minY,
  maxY,
  tooltipOffset = { x: 20, y: -20 },
  color = 'black',
  showGridHorizontal = true,
  showGridVertical = true,
  tooltipPosition = 'cursor',
}: Props) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<ScatterDatum>();

  const { ref: parentRef, height: parentHeight, width: parentWidth } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const x = useMemo(() => {
    return scaleBand()
      .domain(data.map((d) => d.x))
      .range([margin.left, (parentWidth ?? 0) - margin.right]);
  }, [data, margin.left, margin.right, parentWidth]);

  const y = useMemo(() => {
    return scaleLinear()
      .domain([minY ?? 0, maxY ?? Math.max(...data.map((d) => d.y))])
      .nice()
      .range([(parentHeight ?? 0) - margin.bottom, margin.top]);
  }, [data, margin.bottom, margin.top, maxY, minY, parentHeight]);

  const sizeScale = useMemo(() => {
    return scaleLinear()
      .domain(extent(data, (d) => d.value) as [number, number])
      .range([minSize ?? 5, maxSize ?? 20]);
  }, [data, maxSize, minSize]);

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select('g.bar');

    const updateSelection = chartContainer.selectAll('circle').data(data);

    const circles = updateSelection.join('circle');
    circles
      .attr('cx', (d) => x(d.x)! + x.bandwidth() / 2)
      .attr('cy', (d) => y(d.y))
      .attr('r', 0)
      .transition()
      .attr('r', (d) => sizeScale(d.value))
      .attr('fill', color);
    circles
      .on('pointermove', (e, d) => {
        const [xPoint, yPoint] = pointer(e, ref.current);
        const isPointTooltip = tooltipPosition === 'point';
        showTooltip({
          left: isPointTooltip ? x(d.x)! + x.bandwidth() / 2 : xPoint,
          top: isPointTooltip ? y(d.y) : yPoint,
          data: { x: d.x, y: d.y, value: d.value },
        });
      })
      .on('pointerleave', hideTooltip);
  }, [color, data, hideTooltip, showTooltip, sizeScale, tooltipPosition, x, y]);

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
      chart={<g className="bar" />}
      tooltip={
        children &&
        tooltip.isOpen &&
        tooltip.data && (
          <ChartTooltip
            left={tooltip.left}
            top={tooltip.top}
            align={tooltipPosition === 'point' ? 'center' : 'cursor'}
            offsetX={tooltipOffset.x}
            offsetY={tooltipOffset.y}
          >
            {children({
              tooltipData: tooltip.data,
            })}
          </ChartTooltip>
        )
      }
    />
  );
};

export default ScatterChart;
