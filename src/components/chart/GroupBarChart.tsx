import {
  type AxisDomain,
  type AxisScale,
  pointer,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  select,
} from 'd3';
import { type PointerEventHandler, useCallback, useEffect, useMemo, useRef } from 'react';

import { useChartTooltip } from '../../hooks/useChartTooltip';
import { useParentSize } from '../../hooks/useParentSize';
import { getEventPointerType, getTooltipAlign, resolveTooltipPositionMode } from '../../util/tooltip';
import type {
  CartesianChartProps,
  ColorListProps,
  TooltipOffset,
  TooltipPositionMode,
  TooltipRenderer,
  XYDatum,
} from '../../util/types';
import { getClosestIndex } from '../../util/utils';
import CartesianFrame from '../common/CartesianFrame';
import ChartTooltip from '../common/ChartTooltip';
import type { GroupedDatum } from './GroupedChart.types';

/**
 * Props for {@link GroupBarChart}.
 */
export type GroupBarChartProps = CartesianChartProps<GroupedDatum> &
  ColorListProps & {
  /**
   * Data to display in the chart.
   */
  data: GroupedDatum[];
  /**
   * Tooltip children.
   * @param tooltipData
   */
  children?: TooltipRenderer<XYDatum>;
  /**
   * Offset of the tooltip from the mouse pointer.
   */
  tooltipOffset?: TooltipOffset;
  /**
   * Gap between bars.
   */
  padding?: number;
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

/**
 * Renders grouped bars for each x-axis category.
 */
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
    '#17becf',
  ],
  tooltipOffset = { x: 10, y: -10 },
  padding = 0.1,
  tooltipPosition = 'point',
  maxY,
  minY,
  showGridHorizontal = true,
  showGridVertical = true,
}: GroupBarChartProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<XYDatum>();

  const { ref: parentRef, width: parentWidth, height: parentHeight } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const keyList = useMemo(() => {
    return Object.keys(data[0]).filter((key) => key !== 'x');
  }, [data]);

  const x = useMemo(() => {
    return scaleBand()
      .domain(data.map((d) => d.x))
      .range([margin.left, (parentWidth ?? 0) - margin.right])
      .padding(padding);
  }, [data, margin.left, margin.right, padding, parentWidth]);

  const y = useMemo(() => {
    const maxYList = keyList.map((key) => {
      return Math.max(...data.map((d) => d[key] as number));
    });
    const max = Math.max(...maxYList);

    return scaleLinear()
      .domain([minY ?? 0, maxY ?? max])
      .range([(parentHeight ?? 0) - margin.bottom, margin.top]);
  }, [data, keyList, margin.bottom, margin.top, maxY, minY, parentHeight]);

  const colorScale = useMemo(() => {
    return scaleOrdinal().domain(keyList).range(colorList);
  }, [colorList, keyList]);

  const barScale = useMemo(() => {
    return scaleBand().domain(keyList).range([0, x.bandwidth()]).padding(padding);
  }, [keyList, padding, x]);

  const groupPositions = useMemo(() => {
    return data.map((d) => (x(d.x) ?? 0) + x.bandwidth() / 2);
  }, [data, x]);

  const barPositions = useMemo(() => {
    return keyList.map((key) => (barScale(key) ?? 0) + barScale.bandwidth() / 2);
  }, [barScale, keyList]);

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select('.chart');

    const bars = chartContainer
      .selectAll('.bar-group')
      .data(data)
      .join('g')
      .attr('class', 'bar-group')
      .attr('transform', (d) => `translate(${x(d.x)}, 0)`);

    bars
      .selectAll('rect')
      .data((d) => keyList.map((key) => ({ key, value: d[key] as number })))
      .join('rect')
      .attr('x', (d) => barScale(d.key)!)
      .attr('y', (d) => y(d.value))
      .attr('width', barScale.bandwidth())
      .attr('height', (d) => y(0) - y(d.value))
      .attr('fill', (d) => colorScale(d.key) as string);
  }, [barScale, colorScale, data, keyList, x, y]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const onMouseMove: PointerEventHandler = useCallback(
    (e) => {
      if (children) {
        const [xPoint, yPoint] = pointer(e);
        const groupIndex = getClosestIndex(groupPositions, xPoint);
        const point = data[groupIndex];

        if (!point) {
          return;
        }

        const groupStart = x(point.x);
        if (groupStart === undefined) {
          return;
        }

        const barIndex = getClosestIndex(barPositions, xPoint - groupStart);
        const key = keyList[barIndex];

        if (!key) {
          return;
        }

        const value = point[key];
        if (typeof value !== 'number') {
          return;
        }

        const resolvedTooltipPosition = resolveTooltipPositionMode(
          tooltipPosition,
          getEventPointerType(e),
        );
        const isPointTooltip = resolvedTooltipPosition === 'point';

        showTooltip({
          left: isPointTooltip ? groupStart + barPositions[barIndex] : xPoint,
          top: isPointTooltip ? y(value) : yPoint,
          data: { x: point.x, y: value },
          positionMode: resolvedTooltipPosition,
        });
      }
    },
    [barPositions, children, data, groupPositions, keyList, showTooltip, tooltipPosition, x, y],
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
      onPointerUp={onMouseLeave}
      onPointerCancel={onMouseLeave}
      chart={<g className="chart" />}
      tooltip={
        children &&
        tooltip.isOpen &&
        tooltip.data && (
          <ChartTooltip
            left={tooltip.left}
            top={tooltip.top}
            align={getTooltipAlign(tooltip.positionMode)}
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

export default GroupBarChart;
