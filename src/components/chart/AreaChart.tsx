import { area, type AxisDomain, type AxisScale, line, pointer, scaleBand, scaleLinear } from 'd3';
import { type PointerEventHandler, useCallback, useId, useMemo, useRef, useState } from 'react';

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

type ActivePoint = {
  left: number;
  top: number;
  color: string;
};

/**
 * Props for {@link AreaChart}.
 */
export type AreaChartProps = ChartProps &
  LegendProps &
  TooltipInteractionProps & {
    /**
     * Custom tooltip renderer shown while hovering.
     */
    children?: TooltipRenderer<XYDatum>;
    /**
     * Fill the area using a vertical gradient based on `color`.
     * @default false
     */
    fillGradient?: boolean;
    /**
     * Draw a line stroke over the filled area.
     * @default true
     */
    drawStroke?: boolean;
  };

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50,
};

/**
 * Renders a filled area chart with optional stroke, tooltip, and hover guides.
 */
const AreaChart = ({
  width,
  height,
  margin = defaultMargin,
  minY,
  maxY,
  data,
  color = 'black',
  children,
  showLegend = false,
  legendItems,
  legendPosition = 'bottom',
  legendTitle,
  seriesName,
  fillGradient = false,
  drawStroke = true,
  tooltipPosition = 'point',
  showActiveMarker = false,
  showCrosshair = false,
  showGridVertical = true,
  showGridHorizontal = true,
  ariaLabel = 'Area chart',
  ariaDescription,
}: AreaChartProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<XYDatum>();
  const [activePoint, setActivePoint] = useState<ActivePoint | null>(null);

  const { ref: parentRef, height: parentHeight, width: parentWidth } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);
  const rawGradientId = useId();
  const gradientId = useMemo(
    () => `area-gradient-${rawGradientId.replace(/:/g, '')}`,
    [rawGradientId],
  );

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
        key: 'area',
        label: seriesName ?? 'Area',
        color,
      },
    ];
  }, [color, legendItems, seriesName, showLegend]);

  const areaGenerator = useMemo(() => {
    return area<XYDatum>()
      .x((d) => x(d.x)! + x.bandwidth() / 2)
      .y0((d) => y(d.y))
      .y1(() => y(0));
  }, [x, y]);

  const lineGenerator = useMemo(() => {
    return line<XYDatum>()
      .x((d) => x(d.x)! + x.bandwidth() / 2)
      .y((d) => y(d.y));
  }, [x, y]);

  const areaPath = useMemo(() => areaGenerator(data), [areaGenerator, data]);
  const linePath = useMemo(() => lineGenerator(data), [data, lineGenerator]);
  const fillColor = fillGradient ? `url(#${gradientId})` : color;

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

  const defs = fillGradient ? (
    <defs>
      <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={1} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  ) : null;

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
      onPointerMove={onMouseMove}
      onPointerLeave={onMouseLeave}
      onPointerUp={onMouseLeave}
      onPointerCancel={onMouseLeave}
      ariaLabel={ariaLabel}
      ariaDescription={ariaDescription}
      chart={
        <>
          <g className="chart">
            <path className="area" d={areaPath ?? undefined} fill={fillColor} />
            {drawStroke && (
              <path className="line" d={linePath ?? undefined} fill="none" stroke={color} />
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
          </g>
          {activeOverlay}
        </>
      }
      defs={defs}
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

export default AreaChart;
