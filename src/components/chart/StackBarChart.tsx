import {
  type AxisDomain,
  type AxisScale,
  bisectCenter,
  pointer,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  select,
  stack,
} from 'd3';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useChartTooltip } from '../../hooks/useChartTooltip';
import { useParentSize } from '../../hooks/useParentSize';
import { getEventPointerType, getTooltipAlign, resolveTooltipPositionMode } from '../../util/tooltip';
import type {
  CartesianChartProps,
  ColorListProps,
  LegendProps,
  TooltipOffset,
  TooltipPositionMode,
  TooltipRenderer,
  XYDatum,
} from '../../util/types';
import CartesianFrame from '../common/CartesianFrame';
import ChartLegend from '../common/ChartLegend';
import { getLegendRightInset } from '../common/chartLegend.utils';
import ChartTooltip from '../common/ChartTooltip';
import type { GroupedDatum } from './GroupedChart.types';

/**
 * Props for {@link StackBarChart}.
 */
export type StackBarChartProps = CartesianChartProps<GroupedDatum> &
  ColorListProps & {
  /**
   * Data to display in the chart.
   */
  data: GroupedDatum[];
  /**
   * Gap between the bars.
   */
  padding?: number;
  /**
   * Children to render in the
   * tooltip when it is open.
   * It will receive the tooltipData
   * as a prop.
   * @param tooltipData - The data of the tooltip.
   * @returns The children to render.
   */
  children?: TooltipRenderer<XYDatum>;
  /**
   * Offset of the tooltip from the mouse pointer.
   * @default { x: 10, y: -10 }
   */
    tooltipOffset?: TooltipOffset;
    /**
     * Tooltip anchor position.
     * `cursor` follows the mouse and `point` sticks to the matched data point.
     * @default "point"
     */
    tooltipPosition?: TooltipPositionMode;
  } &
  LegendProps;

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50,
};

/**
 * Renders stacked bars where each row contributes multiple stacked segments.
 */
const StackBarChart = ({
  width,
  height,
  margin = defaultMargin,
  data,
  colorList = ['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00'],
  maxY,
  padding = 0.1,
  children,
  tooltipOffset = { x: 10, y: -10 },
  showLegend = true,
  legendItems,
  legendPosition = 'bottom',
  legendTitle,
  tooltipPosition = 'point',
  showGridHorizontal = true,
  showGridVertical = true,
}: StackBarChartProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<XYDatum>();

  const { ref: parentRef, height: parentHeight, width: parentWidth } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const chartMargin = useMemo(() => {
    return {
      ...margin,
      right: margin.right + getLegendRightInset(showLegend, legendPosition),
    };
  }, [legendPosition, margin, showLegend]);

  const keyList = useMemo(() => Object.keys(data[0]).filter((key) => key !== 'x'), [data]);

  const max = useMemo(() => {
    if (maxY) {
      return maxY;
    }
    return Math.max(...data.map((d) => keyList.reduce((acc, key) => acc + (d[key] as number), 0)));
  }, [data, keyList, maxY]);

  const colorScale = useMemo(() => {
    return scaleOrdinal().domain(keyList).range(colorList);
  }, [colorList, keyList]);

  const series = useMemo(() => {
    return stack<GroupedDatum>()
      .keys(keyList)
      .value((d, key) => (d[key] as number) ?? 0)(data);
  }, [data, keyList]);

  const resolvedLegendItems = useMemo(() => {
    if (!showLegend) {
      return [];
    }

    if (legendItems?.length) {
      return legendItems;
    }

    return keyList.map((key) => ({
      key,
      label: key,
      color: colorScale(key) as string,
    }));
  }, [colorScale, keyList, legendItems, showLegend]);

  const x = useMemo(
    () =>
      scaleBand()
        .domain(data.map((d) => d.x))
        .range([chartMargin.left, (parentWidth ?? 0) - chartMargin.right])
        .padding(padding),
    [chartMargin.left, chartMargin.right, data, padding, parentWidth],
  );

  const y = useMemo(
    () =>
      scaleLinear()
        .domain([0, max])
        .range([(parentHeight ?? 0) - chartMargin.bottom, chartMargin.top]),
    [chartMargin.bottom, chartMargin.top, max, parentHeight],
  );

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select('.chart');

    const barGroup = chartContainer
      .selectAll('g')
      .data(series)
      .join('g')
      .attr('fill', (d) => colorScale(d.key) as string);
    barGroup
      .selectAll('rect')
      .data((d) => d)
      .join('rect')
      .attr('x', (d) => x(d.data.x)!)
      .attr('y', (d) => y(d[1]))
      .attr('height', (d) => y(d[0]) - y(d[1]))
      .attr('width', x.bandwidth())
      .on('pointermove', (e, d) => {
        const [pointerX, pointerY] = pointer(e, ref.current);
        const xPoint = pointerX - x.bandwidth() / 2;
        const xDomain = data.map((d) => x(d.x) as number);
        const index = Math.max(0, Math.min(xDomain.length - 1, bisectCenter(xDomain, xPoint)));

        const point = data[index];
        if (point) {
          const resolvedTooltipPosition = resolveTooltipPositionMode(
            tooltipPosition,
            getEventPointerType(e),
          );
          const isPointTooltip = resolvedTooltipPosition === 'point';
          showTooltip({
            left: isPointTooltip ? x(point.x)! + x.bandwidth() / 2 : pointerX,
            top: isPointTooltip ? y(d[1]) : pointerY,
            data: { x: d.data.x, y: d[1] - d[0] },
            positionMode: resolvedTooltipPosition,
          });
        }
      })
      .on('pointerleave', hideTooltip)
      .on('pointerup', hideTooltip)
      .on('pointercancel', hideTooltip);
  }, [colorScale, data, hideTooltip, series, showTooltip, tooltipPosition, x, y]);

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
      margin={chartMargin}
      xScale={x as AxisScale<AxisDomain>}
      yScale={y as AxisScale<AxisDomain>}
      showGridVertical={showGridVertical}
      showGridHorizontal={showGridHorizontal}
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
      overlay={
        resolvedLegendItems.length > 0 ? (
          <ChartLegend
            items={resolvedLegendItems}
            position={legendPosition}
            title={legendTitle}
          />
        ) : null
      }
    />
  );
};

export default StackBarChart;
