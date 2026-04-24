import { type AxisDomain, type AxisScale, pointer, scaleBand, scaleLinear, scaleOrdinal } from 'd3';
import { type PointerEventHandler, useCallback, useMemo, useRef } from 'react';

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
import { getClosestIndex, getZeroBaselineDomain } from '../../util/utils';
import CartesianFrame from '../common/CartesianFrame';
import ChartLegend from '../common/ChartLegend';
import { getLegendRightInset } from '../common/chartLegend.utils';
import ChartTooltip from '../common/ChartTooltip';
import { formatValueLabel, getValueLabelDy } from '../common/valueLabel.utils';
import type { GroupedDatum } from './GroupedChart.types';

/**
 * Props for {@link GroupBarChart}.
 */
export type GroupBarChartProps = CartesianChartProps<GroupedDatum> &
  ColorListProps & {
    /**
     * Data to display in the chart.
     */
    data: GroupedDatum[];
    /**
     * Tooltip children.
     * @param tooltipData
     */
    children?: TooltipRenderer<XYDatum>;
    /**
     * Offset of the tooltip from the mouse pointer.
     */
    tooltipOffset?: TooltipOffset;
    /**
     * Gap between bars.
     */
    padding?: number;
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
 * Renders grouped bars for each x-axis category.
 */
const GroupBarChart = ({
  width,
  height,
  margin = defaultMargin,
  data,
  children,
  colorList = [
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
  ],
  tooltipOffset = { x: 10, y: -10 },
  padding = 0.1,
  showLegend = false,
  legendItems,
  legendPosition = 'bottom',
  legendTitle,
  tooltipPosition = 'point',
  maxY,
  minY,
  showGridHorizontal = true,
  showGridVertical = true,
  xTickCount,
  yTickCount,
  xTickFormat,
  yTickFormat,
  xTickAngle,
  xAxisLabel,
  yAxisLabel,
  showValueLabels = false,
  valueLabelFormatter,
  ariaLabel = 'Grouped bar chart',
  ariaDescription,
}: GroupBarChartProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<XYDatum>();

  const { ref: parentRef, width: parentWidth, height: parentHeight } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const chartMargin = useMemo(() => {
    return {
      ...margin,
      right: margin.right + getLegendRightInset(showLegend, legendPosition),
    };
  }, [legendPosition, margin, showLegend]);

  const keyList = useMemo(() => {
    return Object.keys(data[0] ?? {}).filter((key) => key !== 'x');
  }, [data]);

  const x = useMemo(() => {
    return scaleBand()
      .domain(data.map((d) => d.x))
      .range([chartMargin.left, (parentWidth ?? 0) - chartMargin.right])
      .padding(padding);
  }, [chartMargin.left, chartMargin.right, data, padding, parentWidth]);

  const y = useMemo(() => {
    const values = data.flatMap((datum) =>
      keyList.flatMap((key) => {
        const value = datum[key];

        return typeof value === 'number' ? [value] : [];
      }),
    );

    return scaleLinear()
      .domain(getZeroBaselineDomain(values, minY, maxY))
      .range([(parentHeight ?? 0) - chartMargin.bottom, chartMargin.top]);
  }, [chartMargin.bottom, chartMargin.top, data, keyList, maxY, minY, parentHeight]);

  const colorScale = useMemo(() => {
    return scaleOrdinal().domain(keyList).range(colorList);
  }, [colorList, keyList]);

  const barScale = useMemo(() => {
    return scaleBand().domain(keyList).range([0, x.bandwidth()]).padding(padding);
  }, [keyList, padding, x]);

  const groupPositions = useMemo(() => {
    return data.map((d) => (x(d.x) ?? 0) + x.bandwidth() / 2);
  }, [data, x]);

  const barPositions = useMemo(() => {
    return keyList.map((key) => (barScale(key) ?? 0) + barScale.bandwidth() / 2);
  }, [barScale, keyList]);

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

  const onMouseMove: PointerEventHandler = useCallback(
    (e) => {
      if (children) {
        const [xPoint, yPoint] = pointer(e);
        const groupIndex = getClosestIndex(groupPositions, xPoint);
        const point = data[groupIndex];

        if (!point) {
          return;
        }

        const groupStart = x(point.x);
        if (groupStart === undefined) {
          return;
        }

        const barIndex = getClosestIndex(barPositions, xPoint - groupStart);
        const key = keyList[barIndex];

        if (!key) {
          return;
        }

        const value = point[key];
        if (typeof value !== 'number') {
          return;
        }

        const resolvedTooltipPosition = resolveTooltipPositionMode(
          tooltipPosition,
          getEventPointerType(e),
        );
        const isPointTooltip = resolvedTooltipPosition === 'point';

        showTooltip({
          left: isPointTooltip ? groupStart + barPositions[barIndex] : xPoint,
          top: isPointTooltip ? y(value) : yPoint,
          data: { x: point.x, y: value },
          positionMode: resolvedTooltipPosition,
        });
      }
    },
    [barPositions, children, data, groupPositions, keyList, showTooltip, tooltipPosition, x, y],
  );

  const onMouseLeave = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  const onBarFocus = useCallback(
    (datum: GroupedDatum, key: string) => {
      if (!children) {
        return;
      }

      const value = datum[key];

      if (typeof value !== 'number') {
        return;
      }

      showTooltip({
        left: (x(datum.x) ?? 0) + (barScale(key) ?? 0) + barScale.bandwidth() / 2,
        top: y(value),
        data: {
          x: datum.x,
          y: value,
        },
        positionMode: 'point',
      });
    },
    [barScale, children, showTooltip, x, y],
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
      onPointerMove={onMouseMove}
      onPointerLeave={onMouseLeave}
      onPointerUp={onMouseLeave}
      onPointerCancel={onMouseLeave}
      ariaLabel={ariaLabel}
      ariaDescription={ariaDescription}
      chart={
        <g className="chart">
          {data.map((datum, groupIndex) => (
            <g
              key={`${datum.x}-${groupIndex}`}
              className="bar-group"
              transform={`translate(${x(datum.x) ?? 0}, 0)`}
            >
              {keyList.map((key) => {
                const value = datum[key] as number;
                const barX = barScale(key) ?? 0;

                return (
                  <g key={key}>
                    <rect
                      x={barX}
                      y={Math.min(y(0), y(value))}
                      width={barScale.bandwidth()}
                      height={Math.abs(y(0) - y(value))}
                      fill={colorScale(key) as string}
                      tabIndex={children ? 0 : undefined}
                      aria-label={children ? `${key}, ${datum.x}: ${value}` : undefined}
                      onFocus={() => onBarFocus(datum, key)}
                      onBlur={onMouseLeave}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          onMouseLeave();
                        }
                      }}
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

export default GroupBarChart;
