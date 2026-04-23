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
import {
  getEventPointerType,
  getTooltipAlign,
  resolveTooltipPositionMode,
} from '../../util/tooltip';
import type {
  CartesianChartProps,
  LegendProps,
  Margin,
  TooltipOffset,
  TooltipPositionMode,
  TooltipRenderer,
  XYDatum,
} from '../../util/types';
import CartesianFrame from '../common/CartesianFrame';
import ChartLegend from '../common/ChartLegend';
import { getLegendRightInset } from '../common/chartLegend.utils';
import ChartTooltip from '../common/ChartTooltip';

/**
 * Data shape used by scatter charts.
 */
export type ScatterDatum = XYDatum & {
  value: number;
};

/**
 * Props for {@link ScatterChart}.
 */
export type ScatterChartProps = CartesianChartProps<ScatterDatum> &
  LegendProps & {
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

/**
 * Renders a scatter plot where `value` controls the point radius.
 */
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
  showLegend = false,
  legendItems,
  legendPosition = 'bottom',
  legendTitle,
  seriesName,
  showGridHorizontal = true,
  showGridVertical = true,
  tooltipPosition = 'cursor',
}: ScatterChartProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<ScatterDatum>();

  const { ref: parentRef, height: parentHeight, width: parentWidth } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const chartMargin = useMemo(() => {
    return {
      ...margin,
      right: margin.right + getLegendRightInset(showLegend, legendPosition),
    };
  }, [legendPosition, margin, showLegend]);

  const x = useMemo(() => {
    return scaleBand()
      .domain(data.map((d) => d.x))
      .range([chartMargin.left, (parentWidth ?? 0) - chartMargin.right]);
  }, [chartMargin.left, chartMargin.right, data, parentWidth]);

  const y = useMemo(() => {
    return scaleLinear()
      .domain([minY ?? 0, maxY ?? Math.max(...data.map((d) => d.y))])
      .nice()
      .range([(parentHeight ?? 0) - chartMargin.bottom, chartMargin.top]);
  }, [chartMargin.bottom, chartMargin.top, data, maxY, minY, parentHeight]);

  const sizeScale = useMemo(() => {
    return scaleLinear()
      .domain(extent(data, (d) => d.value) as [number, number])
      .range([minSize ?? 5, maxSize ?? 20]);
  }, [data, maxSize, minSize]);

  const resolvedLegendItems = useMemo(() => {
    if (!showLegend) {
      return [];
    }

    if (legendItems?.length) {
      return legendItems;
    }

    return [
      {
        key: 'scatter',
        label: seriesName ?? 'Scatter',
        color,
      },
    ];
  }, [color, legendItems, seriesName, showLegend]);

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select('g.bar');

    const circles = chartContainer
      .selectAll<SVGCircleElement, ScatterDatum>('circle')
      .data(data, (datum) => `${datum.x}-${datum.y}-${datum.value}`)
      .join(
        (enter) =>
          enter
            .append('circle')
            .attr('cx', (d) => x(d.x)! + x.bandwidth() / 2)
            .attr('cy', (d) => y(d.y))
            .attr('r', 0)
            .attr('fill', color)
            .call((selection) => {
              selection.transition().attr('r', (d) => sizeScale(d.value));
            }),
        (update) =>
          update
            .attr('cx', (d) => x(d.x)! + x.bandwidth() / 2)
            .attr('cy', (d) => y(d.y))
            .attr('fill', color)
            .call((selection) => {
              selection.transition().attr('r', (d) => sizeScale(d.value));
            }),
        (exit) => exit.interrupt().transition().attr('r', 0).remove(),
      );

    circles
      .on('pointermove', (e, d) => {
        const [xPoint, yPoint] = pointer(e, ref.current);
        const resolvedTooltipPosition = resolveTooltipPositionMode(
          tooltipPosition,
          getEventPointerType(e),
        );
        const isPointTooltip = resolvedTooltipPosition === 'point';
        showTooltip({
          left: isPointTooltip ? x(d.x)! + x.bandwidth() / 2 : xPoint,
          top: isPointTooltip ? y(d.y) : yPoint,
          data: { x: d.x, y: d.y, value: d.value },
          positionMode: resolvedTooltipPosition,
        });
      })
      .on('pointerleave', hideTooltip)
      .on('pointerup', hideTooltip)
      .on('pointercancel', hideTooltip);
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
      margin={chartMargin}
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
          <ChartLegend items={resolvedLegendItems} position={legendPosition} title={legendTitle} />
        ) : null
      }
    />
  );
};

export default ScatterChart;
