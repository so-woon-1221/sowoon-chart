import { type AxisDomain, type AxisScale, extent, pointer, scaleBand, scaleLinear } from 'd3';
import { type PointerEvent, useCallback, useMemo, useRef } from 'react';

import { useChartTooltip } from '../../hooks/useChartTooltip';
import { useParentSize } from '../../hooks/useParentSize';
import {
  getEventPointerType,
  getTooltipAlign,
  resolveTooltipPositionMode,
} from '../../util/tooltip';
import type {
  BaseChartProps,
  LegendProps,
  TooltipOffset,
  TooltipPositionMode,
  TooltipRenderer,
} from '../../util/types';
import CartesianFrame from '../common/CartesianFrame';
import ChartLegend from '../common/ChartLegend';
import { getLegendRightInset } from '../common/chartLegend.utils';
import ChartTooltip from '../common/ChartTooltip';

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50,
};

/**
 * One heatmap cell identified by x/y categories and a numeric intensity.
 */
export type HeatmapDatum = {
  x: string;
  y: string;
  value: number;
};

const getValueDomain = (values: number[], minValue?: number, maxValue?: number) => {
  const [dataMin, dataMax] = extent(values);
  const resolvedMin = minValue ?? dataMin ?? 0;
  const resolvedMax = maxValue ?? dataMax ?? resolvedMin;

  if (resolvedMin === resolvedMax) {
    if (resolvedMin === 0) {
      return [0, 1] as [number, number];
    }

    return [0, resolvedMax] as [number, number];
  }

  return [resolvedMin, resolvedMax] as [number, number];
};

const getColorDomain = (min: number, max: number, stopCount: number) => {
  if (stopCount <= 1) {
    return [min, max];
  }

  const step = (max - min) / (stopCount - 1);

  return Array.from({ length: stopCount }, (_, index) => min + step * index);
};

/**
 * Props for {@link HeatmapChart}.
 */
export type HeatmapChartProps = Pick<
  BaseChartProps,
  'ariaDescription' | 'ariaLabel' | 'height' | 'margin' | 'width'
> & {
  /**
   * Heatmap cell data.
   */
  data: HeatmapDatum[];
  /**
   * Tooltip children.
   */
  children?: TooltipRenderer<HeatmapDatum>;
  /**
   * Colors used across the value scale.
   * The list is interpolated from low to high values.
   */
  colorList?: string[];
  /**
   * Explicit minimum value for the color scale.
   */
  minValue?: number;
  /**
   * Explicit maximum value for the color scale.
   */
  maxValue?: number;
  /**
   * Padding between cells.
   * @default 0.08
   */
  cellPadding?: number;
  /**
   * Offset of tooltip.
   * @default { x: 10, y: -10 }
   */
  tooltipOffset?: TooltipOffset;
  /**
   * Tooltip anchor position.
   * `cursor` follows the mouse and `point` sticks to the matched cell center.
   * @default "point"
   */
  tooltipPosition?: TooltipPositionMode;
  /**
   * Display grid lines along the x-axis.
   * @default false
   */
  showGridVertical?: boolean;
  /**
   * Display grid lines along the y-axis.
   * @default false
   */
  showGridHorizontal?: boolean;
} & Omit<LegendProps, 'seriesName'>;

const formatLegendValue = (value: number) => {
  if (Number.isInteger(value)) {
    return `${value}`;
  }

  return value.toFixed(2);
};

/**
 * Renders a category-by-category heatmap where each cell color represents its numeric value.
 */
const HeatmapChart = ({
  width,
  height,
  margin = defaultMargin,
  data,
  children,
  colorList = ['#f3f4f6', '#0f766e'],
  minValue,
  maxValue,
  cellPadding = 0.08,
  tooltipOffset = { x: 10, y: -10 },
  tooltipPosition = 'point',
  showGridVertical = false,
  showGridHorizontal = false,
  showLegend = false,
  legendItems,
  legendPosition = 'bottom',
  legendTitle,
  ariaLabel = 'Heatmap chart',
  ariaDescription,
}: HeatmapChartProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<HeatmapDatum>();
  const { ref: parentRef, width: parentWidth, height: parentHeight } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const chartMargin = useMemo(() => {
    return {
      ...margin,
      right: margin.right + getLegendRightInset(showLegend, legendPosition),
    };
  }, [legendPosition, margin, showLegend]);

  const xDomain = useMemo(() => {
    return Array.from(new Set(data.map((datum) => datum.x)));
  }, [data]);

  const yDomain = useMemo(() => {
    return Array.from(new Set(data.map((datum) => datum.y)));
  }, [data]);

  const x = useMemo(() => {
    return scaleBand()
      .domain(xDomain)
      .range([chartMargin.left, (parentWidth ?? 0) - chartMargin.right])
      .padding(cellPadding);
  }, [cellPadding, chartMargin.left, chartMargin.right, parentWidth, xDomain]);

  const y = useMemo(() => {
    return scaleBand()
      .domain(yDomain)
      .range([chartMargin.top, (parentHeight ?? 0) - chartMargin.bottom])
      .padding(cellPadding);
  }, [cellPadding, chartMargin.bottom, chartMargin.top, parentHeight, yDomain]);

  const valueDomain = useMemo(() => {
    return getValueDomain(
      data.map((datum) => datum.value),
      minValue,
      maxValue,
    );
  }, [data, maxValue, minValue]);

  const resolvedColorList = useMemo(() => {
    if (colorList.length >= 2) {
      return colorList;
    }

    const fallbackColor = colorList[0] ?? '#0f766e';
    return [fallbackColor, fallbackColor];
  }, [colorList]);

  const colorScale = useMemo(() => {
    return scaleLinear<string>()
      .domain(getColorDomain(valueDomain[0], valueDomain[1], resolvedColorList.length))
      .range(resolvedColorList);
  }, [resolvedColorList, valueDomain]);

  const resolvedLegendItems = useMemo(() => {
    if (!showLegend) {
      return [];
    }

    if (legendItems?.length) {
      return legendItems;
    }

    const [min, max] = valueDomain;
    const mid = min + (max - min) / 2;

    return [min, mid, max].map((value, index) => ({
      key: `heatmap-legend-${index}`,
      label: formatLegendValue(value),
      color: colorScale(value),
    }));
  }, [colorScale, legendItems, showLegend, valueDomain]);

  const onCellPointerMove = useCallback(
    (event: PointerEvent<SVGRectElement>, datum: HeatmapDatum) => {
      if (!children) {
        return;
      }

      const [xPoint, yPoint] = pointer(event, ref.current ?? event.currentTarget);
      const resolvedTooltipPosition = resolveTooltipPositionMode(
        tooltipPosition,
        getEventPointerType(event),
      );
      const isPointTooltip = resolvedTooltipPosition === 'point';
      const cellLeft = (x(datum.x) ?? 0) + x.bandwidth() / 2;
      const cellTop = (y(datum.y) ?? 0) + y.bandwidth() / 2;

      showTooltip({
        left: isPointTooltip ? cellLeft : xPoint,
        top: isPointTooltip ? cellTop : yPoint,
        data: datum,
        positionMode: resolvedTooltipPosition,
      });
    },
    [children, showTooltip, tooltipPosition, x, y],
  );

  const onCellPointerEnd = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  const onCellFocus = useCallback(
    (datum: HeatmapDatum) => {
      if (!children) {
        return;
      }

      showTooltip({
        left: (x(datum.x) ?? 0) + x.bandwidth() / 2,
        top: (y(datum.y) ?? 0) + y.bandwidth() / 2,
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
      ariaLabel={ariaLabel}
      ariaDescription={ariaDescription}
      chart={
        <g className="chart">
          {data.map((datum) => (
            <rect
              key={`${datum.x}-${datum.y}`}
              x={x(datum.x) ?? 0}
              y={y(datum.y) ?? 0}
              width={x.bandwidth()}
              height={y.bandwidth()}
              rx={4}
              ry={4}
              fill={colorScale(datum.value)}
              stroke="#ffffff"
              strokeWidth={1}
              cursor={children ? 'pointer' : 'default'}
              tabIndex={children ? 0 : undefined}
              aria-label={children ? `${datum.x}, ${datum.y}: ${datum.value}` : undefined}
              onPointerMove={(event) => onCellPointerMove(event, datum)}
              onPointerLeave={onCellPointerEnd}
              onPointerUp={onCellPointerEnd}
              onPointerCancel={onCellPointerEnd}
              onFocus={() => onCellFocus(datum)}
              onBlur={onCellPointerEnd}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  onCellPointerEnd();
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

export default HeatmapChart;
