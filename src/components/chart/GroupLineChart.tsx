import {
  type AxisDomain,
  type AxisScale,
  line,
  pointer,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
} from 'd3';
import { type PointerEventHandler, useCallback, useMemo, useRef, useState } from 'react';

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
  TooltipInteractionProps,
  TooltipOffset,
  TooltipRenderer,
  XYDatum,
} from '../../util/types';
import { getClosestIndex, isSameActivePoint } from '../../util/utils';
import CartesianFrame from '../common/CartesianFrame';
import ChartLegend from '../common/ChartLegend';
import { getLegendRightInset } from '../common/chartLegend.utils';
import ChartTooltip from '../common/ChartTooltip';
import type { GroupedDatum } from './GroupedChart.types';

type ActivePoint = {
  left: number;
  top: number;
  color: string;
};

export type GroupLineTooltipDatum = XYDatum & {
  value: number;
};

/**
 * Props for {@link GroupLineChart}.
 */
export type GroupLineChartProps = CartesianChartProps<GroupedDatum> &
  ColorListProps & {
    /**
     * Custom tooltip renderer shown while hovering.
     */
    children?: TooltipRenderer<GroupLineTooltipDatum>;
    /**
     * Pixel offset applied to the tooltip.
     * @default { x: 10, y: -10 }
     */
    tooltipOffset?: TooltipOffset;
  } & LegendProps &
  TooltipInteractionProps;

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50,
};

/**
 * Renders multiple line series from grouped row data.
 */
const GroupLineChart = ({
  width,
  height,
  margin = defaultMargin,
  children,
  data,
  minY,
  maxY,
  colorList = ['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00'],
  tooltipOffset = { x: 10, y: -10 },
  showLegend = false,
  legendItems,
  legendPosition = 'bottom',
  legendTitle,
  tooltipPosition = 'point',
  showActiveMarker = false,
  showCrosshair = false,
  showGridHorizontal = true,
  showGridVertical = true,
  ariaLabel = 'Grouped line chart',
  ariaDescription,
}: GroupLineChartProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<GroupLineTooltipDatum>();
  const [activePoint, setActivePoint] = useState<ActivePoint | null>(null);

  const { ref: parentRef, width: parentWidth, height: parentHeight } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const chartMargin = useMemo(() => {
    return {
      ...margin,
      right: margin.right + getLegendRightInset(showLegend, legendPosition),
    };
  }, [legendPosition, margin, showLegend]);

  const keyList = useMemo(() => {
    return Object.keys(data[0]).filter((key) => key !== 'x');
  }, [data]);

  const x = useMemo(() => {
    return scaleBand()
      .domain(data.map((d) => d.x))
      .range([chartMargin.left, (parentWidth ?? 0) - chartMargin.right]);
  }, [chartMargin.left, chartMargin.right, data, parentWidth]);

  const xPositions = useMemo(() => {
    return data.map((d) => (x(d.x) ?? 0) + x.bandwidth() / 2);
  }, [data, x]);

  const y = useMemo(() => {
    const maxYList = keyList.map((key) => {
      return Math.max(...data.map((d) => d[key] as number));
    });
    const max = Math.max(...maxYList);

    return scaleLinear()
      .domain([minY ?? 0, maxY ?? max])
      .range([(parentHeight ?? 0) - chartMargin.bottom, chartMargin.top]);
  }, [chartMargin.bottom, chartMargin.top, data, keyList, maxY, minY, parentHeight]);

  const colorScale = useMemo(() => {
    return scaleOrdinal().domain(keyList).range(colorList);
  }, [colorList, keyList]);

  const lineGenerator = useMemo(() => {
    return line<XYDatum>()
      .x((d) => (x(d.x) as number) + x.bandwidth() / 2)
      .y((d) => y(d.y));
  }, [x, y]);

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

  const lineSeries = useMemo(() => {
    return keyList.map((key) => ({
      key,
      color: colorScale(key) as string,
      path: lineGenerator(data.map((d) => ({ x: d.x, y: d[key] as number }))),
    }));
  }, [colorScale, data, keyList, lineGenerator]);

  const onMouseMove: PointerEventHandler = useCallback(
    (e) => {
      if (!children && !showActiveMarker && !showCrosshair) {
        return;
      }

      const [xPoint, yPoint] = pointer(e);
      const index = getClosestIndex(xPositions, xPoint);
      const point = data[index];

      if (!point || keyList.length === 0) {
        setActivePoint((prev) => (prev ? null : prev));
        return;
      }

      const yData = y.invert(yPoint);
      const yIndex = keyList.reduce((closestIndex, key, currentIndex) => {
        const currentValue = point[key];
        const closestValue = point[keyList[closestIndex]];

        if (typeof currentValue !== 'number' || typeof closestValue !== 'number') {
          return closestIndex;
        }

        return Math.abs(currentValue - yData) < Math.abs(closestValue - yData)
          ? currentIndex
          : closestIndex;
      }, 0);
      const activeKey = keyList[yIndex];
      const value = point[activeKey];

      if (typeof value !== 'number') {
        setActivePoint((prev) => (prev ? null : prev));
        return;
      }

      const pointLeft = xPositions[index];
      const pointTop = y(value);
      const resolvedTooltipPosition = resolveTooltipPositionMode(
        tooltipPosition,
        getEventPointerType(e),
      );
      const nextActivePoint = {
        left: pointLeft,
        top: pointTop,
        color: colorScale(activeKey) as string,
      };
      setActivePoint((prev) => {
        return isSameActivePoint(prev, nextActivePoint) ? prev : nextActivePoint;
      });

      if (children) {
        const isPointTooltip = resolvedTooltipPosition === 'point';
        showTooltip({
          left: isPointTooltip ? pointLeft : xPoint,
          top: isPointTooltip ? pointTop : yPoint,
          data: {
            x: point.x,
            y: value,
            value,
          },
          positionMode: resolvedTooltipPosition,
        });
      }
    },
    [
      children,
      colorScale,
      data,
      keyList,
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
    (point: GroupedDatum, key: string, index: number) => {
      const value = point[key];

      if (typeof value !== 'number') {
        return;
      }

      const pointLeft = xPositions[index];
      const pointTop = y(value);
      const nextActivePoint = {
        left: pointLeft,
        top: pointTop,
        color: colorScale(key) as string,
      };

      setActivePoint((prev) => {
        return isSameActivePoint(prev, nextActivePoint) ? prev : nextActivePoint;
      });

      if (children) {
        showTooltip({
          left: pointLeft,
          top: pointTop,
          data: {
            x: point.x,
            y: value,
            value,
          },
          positionMode: 'point',
        });
      }
    },
    [children, colorScale, showTooltip, xPositions, y],
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
      onPointerMove={onMouseMove}
      onPointerLeave={onMouseLeave}
      onPointerUp={onMouseLeave}
      onPointerCancel={onMouseLeave}
      ariaLabel={ariaLabel}
      ariaDescription={ariaDescription}
      chart={
        <>
          <g className="chart">
            {lineSeries.map((series) => (
              <path
                key={series.key}
                d={series.path ?? undefined}
                fill="none"
                stroke={series.color}
                strokeWidth={1.5}
              />
            ))}
          </g>
          {(children || showActiveMarker || showCrosshair) && (
            <g className="keyboard-targets">
              {keyList.map((key) =>
                data.map((datum, index) => {
                  const value = datum[key];

                  if (typeof value !== 'number') {
                    return null;
                  }

                  return (
                    <circle
                      key={`${key}-${datum.x}-${index}-keyboard-target`}
                      cx={xPositions[index]}
                      cy={y(value)}
                      r={8}
                      fill="transparent"
                      stroke="transparent"
                      tabIndex={0}
                      aria-label={`${key}, ${datum.x}: ${value}`}
                      onFocus={() => onPointFocus(datum, key, index)}
                      onBlur={onMouseLeave}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          onMouseLeave();
                        }
                      }}
                    />
                  );
                }),
              )}
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

export default GroupLineChart;
