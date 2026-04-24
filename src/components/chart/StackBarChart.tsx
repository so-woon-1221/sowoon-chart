import {
  type AxisDomain,
  type AxisScale,
  pointer,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  type SeriesPoint,
  stack,
} from 'd3';
import { type PointerEvent, useCallback, useMemo, useRef } from 'react';

import { useChartTooltip } from '../../hooks/useChartTooltip';
import { useParentSize } from '../../hooks/useParentSize';
import {
  getEventPointerType,
  getTooltipAlign,
  resolveTooltipPositionMode,
} from '../../util/tooltip';
import type {
  CartesianChartProps,
  ColorListProps,
  LegendProps,
  TooltipOffset,
  TooltipPositionMode,
  TooltipRenderer,
  XYDatum,
} from '../../util/types';
import { getZeroBaselineDomain } from '../../util/utils';
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
  } & LegendProps;

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
  minY,
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
  ariaLabel = 'Stacked bar chart',
  ariaDescription,
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

  const keyList = useMemo(() => Object.keys(data[0] ?? {}).filter((key) => key !== 'x'), [data]);

  const colorScale = useMemo(() => {
    return scaleOrdinal().domain(keyList).range(colorList);
  }, [colorList, keyList]);

  const series = useMemo(() => {
    return stack<GroupedDatum>()
      .keys(keyList)
      .value((d, key) => (d[key] as number) ?? 0)(data);
  }, [data, keyList]);

  const yDomain = useMemo(() => {
    const values = series.flatMap((stackedSeries) =>
      stackedSeries.flatMap((segment) => [segment[0], segment[1]]),
    );

    return getZeroBaselineDomain(values, minY, maxY);
  }, [maxY, minY, series]);

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
        .domain(yDomain)
        .range([(parentHeight ?? 0) - chartMargin.bottom, chartMargin.top]),
    [chartMargin.bottom, chartMargin.top, parentHeight, yDomain],
  );

  const onSegmentPointerMove = useCallback(
    (event: PointerEvent<SVGRectElement>, segment: SeriesPoint<GroupedDatum>) => {
      if (!children) {
        return;
      }

      const [pointerX, pointerY] = pointer(event, ref.current ?? event.currentTarget);
      const resolvedTooltipPosition = resolveTooltipPositionMode(
        tooltipPosition,
        getEventPointerType(event),
      );
      const isPointTooltip = resolvedTooltipPosition === 'point';

      showTooltip({
        left: isPointTooltip ? x(segment.data.x)! + x.bandwidth() / 2 : pointerX,
        top: isPointTooltip ? Math.min(y(segment[0]), y(segment[1])) : pointerY,
        data: { x: segment.data.x, y: segment[1] - segment[0] },
        positionMode: resolvedTooltipPosition,
      });
    },
    [children, showTooltip, tooltipPosition, x, y],
  );

  const onSegmentPointerEnd = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  const onSegmentFocus = useCallback(
    (segment: SeriesPoint<GroupedDatum>) => {
      if (!children) {
        return;
      }

      showTooltip({
        left: x(segment.data.x)! + x.bandwidth() / 2,
        top: Math.min(y(segment[0]), y(segment[1])),
        data: { x: segment.data.x, y: segment[1] - segment[0] },
        positionMode: 'point',
      });
    },
    [children, showTooltip, x, y],
  );

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
      ariaLabel={ariaLabel}
      ariaDescription={ariaDescription}
      chart={
        <g className="chart">
          {series.map((stackedSeries) => (
            <g key={stackedSeries.key} fill={colorScale(stackedSeries.key) as string}>
              {stackedSeries.map((segment) => (
                <rect
                  key={`${stackedSeries.key}-${segment.data.x}`}
                  x={x(segment.data.x)!}
                  y={Math.min(y(segment[0]), y(segment[1]))}
                  height={Math.abs(y(segment[0]) - y(segment[1]))}
                  width={x.bandwidth()}
                  tabIndex={children ? 0 : undefined}
                  aria-label={
                    children
                      ? `${stackedSeries.key}, ${segment.data.x}: ${segment[1] - segment[0]}`
                      : undefined
                  }
                  onPointerMove={(event) => onSegmentPointerMove(event, segment)}
                  onPointerLeave={onSegmentPointerEnd}
                  onPointerUp={onSegmentPointerEnd}
                  onPointerCancel={onSegmentPointerEnd}
                  onFocus={() => onSegmentFocus(segment)}
                  onBlur={onSegmentPointerEnd}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      onSegmentPointerEnd();
                    }
                  }}
                />
              ))}
            </g>
          ))}
        </g>
      }
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

export default StackBarChart;
