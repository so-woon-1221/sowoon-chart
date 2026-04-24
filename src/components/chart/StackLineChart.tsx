import {
  type AxisDomain,
  type AxisScale,
  bisectCenter,
  type Line,
  line,
  pointer,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  type SeriesPoint,
  stack,
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
import { getClosestIndex, getZeroBaselineDomain, isSameActivePoint } from '../../util/utils';
import CartesianFrame from '../common/CartesianFrame';
import ChartLegend from '../common/ChartLegend';
import { getLegendRightInset } from '../common/chartLegend.utils';
import ChartTooltip from '../common/ChartTooltip';
import { formatValueLabel, getValueLabelDy } from '../common/valueLabel.utils';
import type { GroupedDatum } from './GroupedChart.types';

type ActivePoint = {
  left: number;
  top: number;
  color: string;
};

/**
 * Props for {@link StackLineChart}.
 */
export type StackLineChartProps = CartesianChartProps<GroupedDatum> &
  ColorListProps & {
    /**
     * Data to display in the chart.
     */
    data: GroupedDatum[];
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
  } & LegendProps &
  TooltipInteractionProps;

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50,
};

/**
 * Renders stacked cumulative line series with optional hover guides.
 */
const StackLineChart = ({
  width,
  height,
  margin = defaultMargin,
  data,
  colorList = ['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00'],
  maxY,
  minY,
  children,
  tooltipOffset = { x: 20, y: -20 },
  showLegend = true,
  legendItems,
  legendPosition = 'bottom',
  legendTitle,
  tooltipPosition = 'point',
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
  ariaLabel = 'Stacked line chart',
  ariaDescription,
}: StackLineChartProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<XYDatum>();
  const [activePoint, setActivePoint] = useState<ActivePoint | null>(null);

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

  const x = useMemo(
    () =>
      scaleBand()
        .domain(data.map((d) => d.x))
        .range([chartMargin.left, (parentWidth ?? 0) - chartMargin.right]),
    [chartMargin.left, chartMargin.right, data, parentWidth],
  );

  const xPositions = useMemo(() => {
    return data.map((d) => (x(d.x) ?? 0) + x.bandwidth() / 2);
  }, [data, x]);

  const y = useMemo(
    () =>
      scaleLinear()
        .domain(yDomain)
        .range([(parentHeight ?? 0) - chartMargin.bottom, chartMargin.top]),
    [chartMargin.bottom, chartMargin.top, parentHeight, yDomain],
  );

  const lineGenerator: Line<[number, number]> = useMemo(() => {
    return line<[number, number]>()
      .x((_, i) => x(data[i].x)! + x.bandwidth() / 2)
      .y((d) => y(d[1] as number));
  }, [data, x, y]);

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
    return series.map((stackedSeries) => ({
      key: stackedSeries.key,
      color: colorScale(stackedSeries.key) as string,
      path: lineGenerator(stackedSeries as [number, number][]),
    }));
  }, [colorScale, lineGenerator, series]);

  const onMouseMove: PointerEventHandler = useCallback(
    (e) => {
      if (!children && !showActiveMarker && !showCrosshair) {
        return;
      }

      const [xPoint, yPoint] = pointer(e);
      const index = getClosestIndex(xPositions, xPoint);
      const point = data[index];

      if (!point || series.length === 0) {
        setActivePoint((prev) => (prev ? null : prev));
        return;
      }

      const yData = y.invert(yPoint);
      const yDomain = series.map((d) => d[index][1] as number);
      const yIndex = Math.max(0, Math.min(yDomain.length - 1, bisectCenter(yDomain, yData)));
      const pointLeft = xPositions[index];
      const pointTop = y(series[yIndex][index][1] as number);
      const resolvedTooltipPosition = resolveTooltipPositionMode(
        tooltipPosition,
        getEventPointerType(e),
      );
      const nextActivePoint = {
        left: pointLeft,
        top: pointTop,
        color: colorScale(keyList[yIndex]) as string,
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
            y: series[yIndex][index][1] - series[yIndex][index][0],
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
      series,
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
    (segment: SeriesPoint<GroupedDatum>, seriesIndex: number, index: number) => {
      const point = data[index];
      const pointValue = segment[1] as number;
      const baseValue = segment[0] as number;
      const pointLeft = xPositions[index];
      const pointTop = y(pointValue);
      const nextActivePoint = {
        left: pointLeft,
        top: pointTop,
        color: colorScale(keyList[seriesIndex]) as string,
      };

      setActivePoint((prev) => {
        return isSameActivePoint(prev, nextActivePoint) ? prev : nextActivePoint;
      });

      if (children && point) {
        showTooltip({
          left: pointLeft,
          top: pointTop,
          data: {
            x: point.x,
            y: pointValue - baseValue,
          },
          positionMode: 'point',
        });
      }
    },
    [children, colorScale, data, keyList, showTooltip, xPositions, y],
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
          <g className="chart">
            {lineSeries.map((stackedSeries) => (
              <path
                key={stackedSeries.key}
                d={stackedSeries.path ?? undefined}
                fill="none"
                stroke={stackedSeries.color}
                strokeWidth={1.5}
              />
            ))}
            {showValueLabels && (
              <g
                className="value-labels"
                pointerEvents="none"
                fontFamily="sans-serif"
                fontSize={10}
                fill="currentColor"
              >
                {series.map((stackedSeries) =>
                  stackedSeries.map((segment, index) => {
                    const value = segment[1] - segment[0];

                    return (
                      <text
                        key={`${stackedSeries.key}-${segment.data.x}-${index}-value-label`}
                        x={xPositions[index]}
                        y={y(segment[1] as number)}
                        dy={getValueLabelDy(value)}
                        textAnchor="middle"
                      >
                        {formatValueLabel(value, segment.data, valueLabelFormatter, stackedSeries.key)}
                      </text>
                    );
                  }),
                )}
              </g>
            )}
          </g>
          {(children || showActiveMarker || showCrosshair) && (
            <g className="keyboard-targets">
              {series.map((stackedSeries, seriesIndex) =>
                stackedSeries.map((segment, index) => (
                  <circle
                    key={`${stackedSeries.key}-${segment.data.x}-${index}-keyboard-target`}
                    cx={xPositions[index]}
                    cy={y(segment[1] as number)}
                    r={8}
                    fill="transparent"
                    stroke="transparent"
                    tabIndex={0}
                    aria-label={`${stackedSeries.key}, ${segment.data.x}: ${
                      segment[1] - segment[0]
                    }`}
                    onFocus={() => onPointFocus(segment, seriesIndex, index)}
                    onBlur={onMouseLeave}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        onMouseLeave();
                      }
                    }}
                  />
                )),
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

export default StackLineChart;
