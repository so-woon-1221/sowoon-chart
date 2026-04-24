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
import { getClosestIndex, getZeroBaselineDomain, isSameActivePoint } from '../../util/utils';
import CartesianFrame from '../common/CartesianFrame';
import ChartLegend from '../common/ChartLegend';
import { getLegendRightInset } from '../common/chartLegend.utils';
import ChartTooltip from '../common/ChartTooltip';
import { formatValueLabel, getValueLabelDy } from '../common/valueLabel.utils';
import type { GroupedDatum } from './GroupedChart.types';

export type ComboSeriesType = 'bar' | 'line';

export type ComboChartTooltipDatum = XYDatum & {
  key: string;
  type: ComboSeriesType;
  value: number;
  datum: GroupedDatum;
};

type ActivePoint = {
  left: number;
  top: number;
  color: string;
};

type ComboMark = ComboChartTooltipDatum &
  ActivePoint & {
    seriesKey: string;
  };

type LinePoint = XYDatum & {
  datum: GroupedDatum;
};

/**
 * Props for {@link ComboChart}.
 */
export type ComboChartProps = CartesianChartProps<GroupedDatum> &
  ColorListProps &
  LegendProps &
  TooltipInteractionProps & {
    /**
     * Data to display in the chart.
     */
    data: GroupedDatum[];
    /**
     * Keys rendered as grouped bars.
     */
    barKeys: string[];
    /**
     * Keys rendered as lines.
     */
    lineKeys: string[];
    /**
     * Custom tooltip renderer shown while hovering.
     */
    children?: TooltipRenderer<ComboChartTooltipDatum>;
    /**
     * Pixel offset applied to the tooltip.
     * @default { x: 10, y: -10 }
     */
    tooltipOffset?: TooltipOffset;
    /**
     * Gap between category groups and inner bars.
     * @default 0.1
     */
    padding?: number;
  };

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50,
};

const defaultColorList = [
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
];

const getNumericValue = (datum: GroupedDatum, key: string) => {
  const value = datum[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const toTooltipDatum = (mark: ComboMark): ComboChartTooltipDatum => ({
  x: mark.x,
  y: mark.y,
  key: mark.key,
  type: mark.type,
  value: mark.value,
  datum: mark.datum,
});

const getClosestMark = (marks: ComboMark[], xPoint: number, yPoint: number) => {
  return marks.reduce<ComboMark | null>((closest, mark) => {
    if (!closest) {
      return mark;
    }

    const currentDistance = Math.hypot(mark.left - xPoint, mark.top - yPoint);
    const closestDistance = Math.hypot(closest.left - xPoint, closest.top - yPoint);

    return currentDistance < closestDistance ? mark : closest;
  }, null);
};

/**
 * Renders grouped bars and line series on a shared Cartesian axis.
 */
const ComboChart = ({
  width,
  height,
  margin = defaultMargin,
  data,
  barKeys,
  lineKeys,
  children,
  colorList = defaultColorList,
  tooltipOffset = { x: 10, y: -10 },
  padding = 0.1,
  showLegend = false,
  legendItems,
  legendPosition = 'bottom',
  legendTitle,
  tooltipPosition = 'point',
  showActiveMarker = false,
  showCrosshair = false,
  showGridHorizontal = true,
  showGridVertical = true,
  minY,
  maxY,
  xTickCount,
  yTickCount,
  xTickFormat,
  yTickFormat,
  xTickAngle,
  xAxisLabel,
  yAxisLabel,
  showValueLabels = false,
  valueLabelFormatter,
  ariaLabel = 'Combo chart',
  ariaDescription,
}: ComboChartProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<ComboChartTooltipDatum>();
  const [activePoint, setActivePoint] = useState<ActivePoint | null>(null);

  const { ref: parentRef, width: parentWidth, height: parentHeight } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const chartMargin = useMemo(() => {
    return {
      ...margin,
      right: margin.right + getLegendRightInset(showLegend, legendPosition),
    };
  }, [legendPosition, margin, showLegend]);

  const seriesKeys = useMemo(() => {
    return Array.from(new Set([...barKeys, ...lineKeys]));
  }, [barKeys, lineKeys]);

  const x = useMemo(() => {
    return scaleBand()
      .domain(data.map((d) => d.x))
      .range([chartMargin.left, (parentWidth ?? 0) - chartMargin.right])
      .padding(padding);
  }, [chartMargin.left, chartMargin.right, data, padding, parentWidth]);

  const xPositions = useMemo(() => {
    return data.map((d) => (x(d.x) ?? 0) + x.bandwidth() / 2);
  }, [data, x]);

  const y = useMemo(() => {
    const values = data.flatMap((datum) =>
      seriesKeys.flatMap((key) => {
        const value = getNumericValue(datum, key);

        return value === null ? [] : [value];
      }),
    );

    return scaleLinear()
      .domain(getZeroBaselineDomain(values, minY, maxY))
      .range([(parentHeight ?? 0) - chartMargin.bottom, chartMargin.top]);
  }, [chartMargin.bottom, chartMargin.top, data, maxY, minY, parentHeight, seriesKeys]);

  const colorScale = useMemo(() => {
    return scaleOrdinal<string, string>().domain(seriesKeys).range(colorList);
  }, [colorList, seriesKeys]);

  const barScale = useMemo(() => {
    return scaleBand().domain(barKeys).range([0, x.bandwidth()]).padding(padding);
  }, [barKeys, padding, x]);

  const lineGenerator = useMemo(() => {
    return line<LinePoint>()
      .x((d) => (x(d.x) ?? 0) + x.bandwidth() / 2)
      .y((d) => y(d.y));
  }, [x, y]);

  const lineSeries = useMemo(() => {
    return lineKeys.map((key) => {
      const points = data.flatMap<LinePoint>((datum) => {
        const value = getNumericValue(datum, key);

        return value === null ? [] : [{ x: datum.x, y: value, datum }];
      });

      return {
        key,
        color: colorScale(key),
        path: lineGenerator(points),
        points,
      };
    });
  }, [colorScale, data, lineGenerator, lineKeys]);

  const markGroups = useMemo(() => {
    return data.map((datum, index) => {
      const groupStart = x(datum.x);

      if (groupStart === undefined) {
        return [];
      }

      const barMarks = barKeys.flatMap<ComboMark>((key) => {
        const value = getNumericValue(datum, key);
        const barX = barScale(key);

        if (value === null || barX === undefined) {
          return [];
        }

        return [
          {
            x: datum.x,
            y: value,
            value,
            key,
            type: 'bar',
            datum,
            left: groupStart + barX + barScale.bandwidth() / 2,
            top: y(value),
            color: colorScale(key),
            seriesKey: `bar-${key}`,
          },
        ];
      });

      const lineMarks = lineKeys.flatMap<ComboMark>((key) => {
        const value = getNumericValue(datum, key);

        if (value === null) {
          return [];
        }

        return [
          {
            x: datum.x,
            y: value,
            value,
            key,
            type: 'line',
            datum,
            left: xPositions[index],
            top: y(value),
            color: colorScale(key),
            seriesKey: `line-${key}`,
          },
        ];
      });

      return [...barMarks, ...lineMarks];
    });
  }, [barKeys, barScale, colorScale, data, lineKeys, x, xPositions, y]);

  const resolvedLegendItems = useMemo(() => {
    if (!showLegend) {
      return [];
    }

    if (legendItems?.length) {
      return legendItems;
    }

    return [
      ...barKeys.map((key) => ({
        key: `bar-${key}`,
        label: key,
        color: colorScale(key),
      })),
      ...lineKeys.map((key) => ({
        key: `line-${key}`,
        label: key,
        color: colorScale(key),
      })),
    ];
  }, [barKeys, colorScale, legendItems, lineKeys, showLegend]);

  const onMouseMove: PointerEventHandler = useCallback(
    (e) => {
      if (!children && !showActiveMarker && !showCrosshair) {
        return;
      }

      const [xPoint, yPoint] = pointer(e);
      const groupIndex = getClosestIndex(xPositions, xPoint);
      const activeMark = getClosestMark(markGroups[groupIndex] ?? [], xPoint, yPoint);

      if (!activeMark) {
        setActivePoint((prev) => (prev ? null : prev));
        return;
      }

      const resolvedTooltipPosition = resolveTooltipPositionMode(
        tooltipPosition,
        getEventPointerType(e),
      );
      const nextActivePoint = {
        left: activeMark.left,
        top: activeMark.top,
        color: activeMark.color,
      };
      setActivePoint((prev) => {
        return isSameActivePoint(prev, nextActivePoint) ? prev : nextActivePoint;
      });

      if (children) {
        const isPointTooltip = resolvedTooltipPosition === 'point';
        showTooltip({
          left: isPointTooltip ? activeMark.left : xPoint,
          top: isPointTooltip ? activeMark.top : yPoint,
          data: toTooltipDatum(activeMark),
          positionMode: resolvedTooltipPosition,
        });
      }
    },
    [
      children,
      markGroups,
      showActiveMarker,
      showCrosshair,
      showTooltip,
      tooltipPosition,
      xPositions,
    ],
  );

  const onMouseLeave = useCallback(() => {
    setActivePoint((prev) => (prev ? null : prev));
    hideTooltip();
  }, [hideTooltip]);

  const onMarkFocus = useCallback(
    (mark: ComboMark) => {
      const nextActivePoint = {
        left: mark.left,
        top: mark.top,
        color: mark.color,
      };

      setActivePoint((prev) => {
        return isSameActivePoint(prev, nextActivePoint) ? prev : nextActivePoint;
      });

      if (children) {
        showTooltip({
          left: mark.left,
          top: mark.top,
          data: toTooltipDatum(mark),
          positionMode: 'point',
        });
      }
    },
    [children, showTooltip],
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
          <g className="combo-bars">
            {data.map((datum, groupIndex) => {
              const groupStart = x(datum.x);

              if (groupStart === undefined) {
                return null;
              }

              return (
                <g
                  key={`${datum.x}-${groupIndex}`}
                  className="bar-group"
                  transform={`translate(${groupStart}, 0)`}
                >
                  {barKeys.map((key) => {
                    const value = getNumericValue(datum, key);
                    const barX = barScale(key);

                    if (value === null || barX === undefined) {
                      return null;
                    }

                    return (
                      <g key={key}>
                        <rect
                          x={barX}
                          y={Math.min(y(0), y(value))}
                          width={barScale.bandwidth()}
                          height={Math.abs(y(0) - y(value))}
                          fill={colorScale(key)}
                        />
                        {showValueLabels && (
                          <text
                            x={barX + barScale.bandwidth() / 2}
                            y={y(value)}
                            dy={getValueLabelDy(value)}
                            textAnchor="middle"
                            fontFamily="sans-serif"
                            fontSize={10}
                            fill="currentColor"
                            pointerEvents="none"
                          >
                            {formatValueLabel(value, datum, valueLabelFormatter, key)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
          <g className="combo-lines">
            {lineSeries.map((series) => (
              <path
                key={series.key}
                d={series.path ?? undefined}
                fill="none"
                stroke={series.color}
                strokeWidth={1.8}
              />
            ))}
            {showValueLabels && (
              <g
                className="line-value-labels"
                pointerEvents="none"
                fontFamily="sans-serif"
                fontSize={10}
                fill="currentColor"
              >
                {lineSeries.map((series) =>
                  series.points.map((point, index) => (
                    <text
                      key={`${series.key}-${point.x}-${index}-value-label`}
                      x={(x(point.x) ?? 0) + x.bandwidth() / 2}
                      y={y(point.y)}
                      dy={getValueLabelDy(point.y)}
                      textAnchor="middle"
                    >
                      {formatValueLabel(point.y, point.datum, valueLabelFormatter, series.key)}
                    </text>
                  )),
                )}
              </g>
            )}
          </g>
          {(children || showActiveMarker || showCrosshair) && (
            <g className="keyboard-targets">
              {markGroups.map((marks) =>
                marks.map((mark) => (
                  <circle
                    key={`${mark.seriesKey}-${mark.x}-keyboard-target`}
                    cx={mark.left}
                    cy={mark.top}
                    r={mark.type === 'bar' ? Math.max(6, barScale.bandwidth() / 2) : 8}
                    fill="transparent"
                    stroke="transparent"
                    tabIndex={0}
                    aria-label={`${mark.key}, ${mark.x}: ${mark.value}`}
                    onFocus={() => onMarkFocus(mark)}
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

export default ComboChart;
