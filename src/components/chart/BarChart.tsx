import { type AxisDomain, type AxisScale, pointer, scaleBand, scaleLinear } from 'd3';
import { type PointerEventHandler, useCallback, useMemo, useRef } from 'react';

import { useChartTooltip } from '../../hooks/useChartTooltip';
import { useParentSize } from '../../hooks/useParentSize';
import {
  getEventPointerType,
  getTooltipAlign,
  resolveTooltipPositionMode,
} from '../../util/tooltip';
import type {
  ChartProps,
  LegendProps,
  TooltipPositionMode,
  TooltipRenderer,
  XYDatum,
} from '../../util/types';
import { getClosestIndex, getZeroBaselineDomain } from '../../util/utils';
import CartesianFrame from '../common/CartesianFrame';
import ChartLegend from '../common/ChartLegend';
import { getLegendRightInset } from '../common/chartLegend.utils';
import ChartTooltip from '../common/ChartTooltip';

/**
 * Props for {@link BarChart}.
 */
export type BarChartProps = ChartProps &
  LegendProps & {
    /**
     * Padding between bars.
     * @default 0.1
     */
    padding?: number;
    /**
     * Custom tooltip renderer shown while hovering.
     */
    children?: TooltipRenderer<XYDatum>;
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
 * Renders a single-series bar chart with optional tooltip support.
 */
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
  showLegend = false,
  legendItems,
  legendPosition = 'bottom',
  legendTitle,
  seriesName,
  tooltipPosition = 'point',
  showGridVertical = true,
  showGridHorizontal = true,
  ariaLabel = 'Bar chart',
  ariaDescription,
}: BarChartProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<XYDatum>();

  const { ref: parentRef, width: parentWidth, height: parentHeight } = useParentSize();

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
      .range([chartMargin.left, (parentWidth ?? 0) - chartMargin.right])
      .padding(padding);
  }, [chartMargin.left, chartMargin.right, data, padding, parentWidth]);

  const y = useMemo(() => {
    return scaleLinear()
      .domain(getZeroBaselineDomain(data.map((d) => d.y), minY, maxY))
      .range([(parentHeight ?? 0) - chartMargin.bottom, chartMargin.top]);
  }, [chartMargin.bottom, chartMargin.top, data, maxY, minY, parentHeight]);

  const xPositions = useMemo(() => {
    return data.map((d) => (x(d.x) ?? 0) + x.bandwidth() / 2);
  }, [data, x]);

  const resolvedLegendItems = useMemo(() => {
    if (!showLegend) {
      return [];
    }

    if (legendItems?.length) {
      return legendItems;
    }

    return [
      {
        key: 'bar',
        label: seriesName ?? 'Bars',
        color,
      },
    ];
  }, [color, legendItems, seriesName, showLegend]);

  const onMouseMove: PointerEventHandler = useCallback(
    (e) => {
      if (children) {
        const [xPoint, yPoint] = pointer(e);
        const index = getClosestIndex(xPositions, xPoint);
        const point = data[index];

        if (!point) {
          return;
        }

        const resolvedTooltipPosition = resolveTooltipPositionMode(
          tooltipPosition,
          getEventPointerType(e),
        );
        const isPointTooltip = resolvedTooltipPosition === 'point';

        showTooltip({
          left: isPointTooltip ? xPositions[index] : xPoint,
          top: isPointTooltip ? y(point.y) : yPoint,
          data: point,
          positionMode: resolvedTooltipPosition,
        });
      }
    },
    [children, data, showTooltip, tooltipPosition, xPositions, y],
  );

  const onMouseLeave = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  const onBarFocus = useCallback(
    (datum: XYDatum) => {
      if (!children) {
        return;
      }

      showTooltip({
        left: (x(datum.x) ?? 0) + x.bandwidth() / 2,
        top: y(datum.y),
        data: datum,
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
      onPointerMove={onMouseMove}
      onPointerLeave={onMouseLeave}
      onPointerUp={onMouseLeave}
      onPointerCancel={onMouseLeave}
      ariaLabel={ariaLabel}
      ariaDescription={ariaDescription}
      chart={
        <g className="bar">
          {data.map((datum, index) => (
            <rect
              key={`${datum.x}-${index}`}
              x={x(datum.x) ?? 0}
              y={Math.min(y(0), y(datum.y))}
              fill={color}
              width={x.bandwidth()}
              height={Math.abs(y(0) - y(datum.y))}
              tabIndex={children ? 0 : undefined}
              aria-label={children ? `${datum.x}: ${datum.y}` : undefined}
              onFocus={() => onBarFocus(datum)}
              onBlur={onMouseLeave}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  onMouseLeave();
                }
              }}
            />
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
          >
            {children({ tooltipData: tooltip.data })}
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

export default BarChart;
