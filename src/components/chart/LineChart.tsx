import { type AxisDomain, type AxisScale, line, pointer, scaleBand, scaleLinear } from 'd3';
import { type PointerEventHandler, useCallback, useMemo, useRef, useState } from 'react';

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
  TooltipInteractionProps,
  TooltipRenderer,
  XYDatum,
} from '../../util/types';
import { getClosestIndex, getZeroBaselineDomain, isSameActivePoint } from '../../util/utils';
import CartesianFrame from '../common/CartesianFrame';
import ChartLegend from '../common/ChartLegend';
import { getLegendRightInset } from '../common/chartLegend.utils';
import ChartTooltip from '../common/ChartTooltip';
import { formatValueLabel, getValueLabelDy } from '../common/valueLabel.utils';

type ActivePoint = {
  left: number;
  top: number;
  color: string;
};

/**
 * Props for {@link LineChart}.
 */
export type LineChartProps = ChartProps &
  LegendProps &
  TooltipInteractionProps & {
    /**
     * Custom tooltip renderer shown while hovering.
     */
    children?: TooltipRenderer<XYDatum>;
  };

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50,
};

/**
 * Renders a single-series line chart with optional tooltip, crosshair, and active marker states.
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
  showLegend = false,
  legendItems,
  legendPosition = 'bottom',
  legendTitle,
  seriesName,
  tooltipPosition = 'cursor',
  showActiveMarker = false,
  showCrosshair = false,
  showGridVertical = true,
  showGridHorizontal = true,
  xTickCount,
  yTickCount,
  xTickFormat,
  yTickFormat,
  xTickAngle,
  xAxisLabel,
  yAxisLabel,
  showValueLabels = false,
  valueLabelFormatter,
  ariaLabel = 'Line chart',
  ariaDescription,
}: LineChartProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<XYDatum>();
  const [activePoint, setActivePoint] = useState<ActivePoint | null>(null);

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
      .range([chartMargin.left, (parentWidth ?? 0) - chartMargin.right]);
  }, [chartMargin.left, chartMargin.right, data, parentWidth]);

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
        key: 'line',
        label: seriesName ?? 'Line',
        color,
      },
    ];
  }, [color, legendItems, seriesName, showLegend]);

  const linePath = useMemo(() => {
    const lineGenerator = line<XYDatum>()
      .x((d) => x(d.x)! + x.bandwidth() / 2)
      .y((d) => y(d.y));

    return lineGenerator(data);
  }, [data, x, y]);

  const onMouseMove: PointerEventHandler = useCallback(
    (e) => {
      if (!children && !showActiveMarker && !showCrosshair) {
        return;
      }

      const [xPoint, yPoint] = pointer(e);
      const index = getClosestIndex(xPositions, xPoint);
      const point = data[index];

      if (!point) {
        setActivePoint((prev) => (prev ? null : prev));
        return;
      }

      const pointLeft = xPositions[index];
      const pointTop = y(point.y);
      const resolvedTooltipPosition = resolveTooltipPositionMode(
        tooltipPosition,
        getEventPointerType(e),
      );
      const nextActivePoint = {
        left: pointLeft,
        top: pointTop,
        color,
      };
      setActivePoint((prev) => {
        return isSameActivePoint(prev, nextActivePoint) ? prev : nextActivePoint;
      });

      if (children) {
        const isPointTooltip = resolvedTooltipPosition === 'point';
        showTooltip({
          left: isPointTooltip ? pointLeft : xPoint,
          top: isPointTooltip ? pointTop : yPoint,
          data: point,
          positionMode: resolvedTooltipPosition,
        });
      }
    },
    [
      children,
      color,
      data,
      showActiveMarker,
      showCrosshair,
      showTooltip,
      tooltipPosition,
      xPositions,
      y,
    ],
  );

  const onMouseLeave = useCallback(() => {
    setActivePoint((prev) => (prev ? null : prev));
    hideTooltip();
  }, [hideTooltip]);

  const onPointFocus = useCallback(
    (point: XYDatum, index: number) => {
      const pointLeft = xPositions[index];
      const pointTop = y(point.y);
      const nextActivePoint = {
        left: pointLeft,
        top: pointTop,
        color,
      };

      setActivePoint((prev) => {
        return isSameActivePoint(prev, nextActivePoint) ? prev : nextActivePoint;
      });

      if (children) {
        showTooltip({
          left: pointLeft,
          top: pointTop,
          data: point,
          positionMode: 'point',
        });
      }
    },
    [children, color, showTooltip, xPositions, y],
  );

  const activeOverlay =
    activePoint && (showCrosshair || showActiveMarker) ? (
      <g className="active-overlay" pointerEvents="none">
        {showCrosshair && (
          <>
            <line
              x1={activePoint.left}
              x2={activePoint.left}
              y1={chartMargin.top}
              y2={parentHeight - chartMargin.bottom}
              stroke={activePoint.color}
              strokeDasharray="4 4"
              strokeOpacity={0.35}
            />
            <line
              x1={chartMargin.left}
              x2={parentWidth - chartMargin.right}
              y1={activePoint.top}
              y2={activePoint.top}
              stroke={activePoint.color}
              strokeDasharray="4 4"
              strokeOpacity={0.35}
            />
          </>
        )}
        {showActiveMarker && (
          <circle
            cx={activePoint.left}
            cy={activePoint.top}
            r={4}
            fill="white"
            stroke={activePoint.color}
            strokeWidth={2}
          />
        )}
      </g>
    ) : null;

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
      onPointerMove={onMouseMove}
      onPointerLeave={onMouseLeave}
      onPointerUp={onMouseLeave}
      onPointerCancel={onMouseLeave}
      ariaLabel={ariaLabel}
      ariaDescription={ariaDescription}
      chart={
        <>
          <path d={linePath ?? undefined} fill="none" stroke={color} strokeWidth={1.5} />
          {showValueLabels && (
            <g
              className="value-labels"
              pointerEvents="none"
              fontFamily="sans-serif"
              fontSize={10}
              fill="currentColor"
            >
              {data.map((datum, index) => (
                <text
                  key={`${datum.x}-${index}-value-label`}
                  x={xPositions[index]}
                  y={y(datum.y)}
                  dy={getValueLabelDy(datum.y)}
                  textAnchor="middle"
                >
                  {formatValueLabel(datum.y, datum, valueLabelFormatter)}
                </text>
              ))}
            </g>
          )}
          {(children || showActiveMarker || showCrosshair) && (
            <g className="keyboard-targets">
              {data.map((datum, index) => (
                <circle
                  key={`${datum.x}-${index}-keyboard-target`}
                  cx={xPositions[index]}
                  cy={y(datum.y)}
                  r={8}
                  fill="transparent"
                  stroke="transparent"
                  tabIndex={0}
                  aria-label={`${datum.x}: ${datum.y}`}
                  onFocus={() => onPointFocus(datum, index)}
                  onBlur={onMouseLeave}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      onMouseLeave();
                    }
                  }}
                />
              ))}
            </g>
          )}
          {activeOverlay}
        </>
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

export default LineChart;
