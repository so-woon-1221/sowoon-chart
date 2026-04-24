import { type AxisDomain, type AxisScale, pointer, scaleBand, scaleLinear } from 'd3';
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
  LegendProps,
  Margin,
  TooltipOffset,
  TooltipPositionMode,
  TooltipRenderer,
  XYDatum,
} from '../../util/types';
import { getFiniteExtentDomain, getZeroBaselineDomain } from '../../util/utils';
import CartesianFrame from '../common/CartesianFrame';
import ChartLegend from '../common/ChartLegend';
import { getLegendRightInset } from '../common/chartLegend.utils';
import ChartTooltip from '../common/ChartTooltip';
import { formatValueLabel } from '../common/valueLabel.utils';

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
  xTickCount,
  yTickCount,
  xTickFormat,
  yTickFormat,
  xTickAngle,
  xAxisLabel,
  yAxisLabel,
  showValueLabels = false,
  valueLabelFormatter,
  ariaLabel = 'Scatter chart',
  ariaDescription,
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
      .domain(getZeroBaselineDomain(data.map((d) => d.y), minY, maxY))
      .nice()
      .range([(parentHeight ?? 0) - chartMargin.bottom, chartMargin.top]);
  }, [chartMargin.bottom, chartMargin.top, data, maxY, minY, parentHeight]);

  const sizeScale = useMemo(() => {
    return scaleLinear()
      .domain(getFiniteExtentDomain(data.map((d) => d.value)))
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

  const onPointPointerMove = useCallback(
    (event: PointerEvent<SVGCircleElement>, datum: ScatterDatum) => {
      const [xPoint, yPoint] = pointer(event, ref.current ?? event.currentTarget);
      const resolvedTooltipPosition = resolveTooltipPositionMode(
        tooltipPosition,
        getEventPointerType(event),
      );
      const isPointTooltip = resolvedTooltipPosition === 'point';

      showTooltip({
        left: isPointTooltip ? x(datum.x)! + x.bandwidth() / 2 : xPoint,
        top: isPointTooltip ? y(datum.y) : yPoint,
        data: { x: datum.x, y: datum.y, value: datum.value },
        positionMode: resolvedTooltipPosition,
      });
    },
    [showTooltip, tooltipPosition, x, y],
  );

  const onPointPointerEnd = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  const onPointFocus = useCallback(
    (datum: ScatterDatum) => {
      showTooltip({
        left: x(datum.x)! + x.bandwidth() / 2,
        top: y(datum.y),
        data: { x: datum.x, y: datum.y, value: datum.value },
        positionMode: 'point',
      });
    },
    [showTooltip, x, y],
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
      xTickCount={xTickCount}
      yTickCount={yTickCount}
      xTickFormat={xTickFormat}
      yTickFormat={yTickFormat}
      xTickAngle={xTickAngle}
      xAxisLabel={xAxisLabel}
      yAxisLabel={yAxisLabel}
      ariaLabel={ariaLabel}
      ariaDescription={ariaDescription}
      chart={
        <g className="bar">
          {data.map((datum) => {
            const pointLeft = x(datum.x)! + x.bandwidth() / 2;
            const pointTop = y(datum.y);

            return (
              <g key={`${datum.x}-${datum.y}-${datum.value}`}>
                <circle
                  cx={pointLeft}
                  cy={pointTop}
                  r={sizeScale(datum.value)}
                  fill={color}
                  tabIndex={children ? 0 : undefined}
                  aria-label={children ? `${datum.x}: ${datum.y}, value ${datum.value}` : undefined}
                  onPointerMove={(event) => onPointPointerMove(event, datum)}
                  onPointerLeave={onPointPointerEnd}
                  onPointerUp={onPointPointerEnd}
                  onPointerCancel={onPointPointerEnd}
                  onFocus={() => onPointFocus(datum)}
                  onBlur={onPointPointerEnd}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      onPointPointerEnd();
                    }
                  }}
                />
                {showValueLabels && (
                  <text
                    x={pointLeft}
                    y={pointTop - sizeScale(datum.value) - 6}
                    textAnchor="middle"
                    fontFamily="sans-serif"
                    fontSize={10}
                    fill="currentColor"
                    pointerEvents="none"
                  >
                    {formatValueLabel(datum.value, datum, valueLabelFormatter)}
                  </text>
                )}
              </g>
            );
          })}
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

export default ScatterChart;
