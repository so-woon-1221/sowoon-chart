import {
  type AxisDomain,
  type AxisScale,
  line,
  pointer,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  select,
} from 'd3';
import { type PointerEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useChartTooltip } from '../../hooks/useChartTooltip';
import { useParentSize } from '../../hooks/useParentSize';
import { getEventPointerType, getTooltipAlign, resolveTooltipPositionMode } from '../../util/tooltip';
import type {
  CartesianChartProps,
  ColorListProps,
  TooltipInteractionProps,
  TooltipOffset,
  TooltipRenderer,
  XYDatum,
} from '../../util/types';
import { getClosestIndex, isSameActivePoint } from '../../util/utils';
import CartesianFrame from '../common/CartesianFrame';
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
  } &
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
  tooltipPosition = 'point',
  showActiveMarker = false,
  showCrosshair = false,
  showGridHorizontal = true,
  showGridVertical = true,
}: GroupLineChartProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<GroupLineTooltipDatum>();
  const [activePoint, setActivePoint] = useState<ActivePoint | null>(null);

  const { ref: parentRef, width: parentWidth, height: parentHeight } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const keyList = useMemo(() => {
    return Object.keys(data[0]).filter((key) => key !== 'x');
  }, [data]);

  const x = useMemo(() => {
    return scaleBand()
      .domain(data.map((d) => d.x))
      .range([margin.left, (parentWidth ?? 0) - margin.right]);
  }, [data, margin.left, margin.right, parentWidth]);

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
      .range([(parentHeight ?? 0) - margin.bottom, margin.top]);
  }, [data, keyList, margin.bottom, margin.top, maxY, minY, parentHeight]);

  const colorScale = useMemo(() => {
    return scaleOrdinal().domain(keyList).range(colorList);
  }, [colorList, keyList]);

  const lineGenerator = useMemo(() => {
    return line<XYDatum>()
      .x((d) => (x(d.x) as number) + x.bandwidth() / 2)
      .y((d) => y(d.y));
  }, [x, y]);

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select('.chart');

    const lines = chartContainer.selectAll('g').data(keyList);

    lines
      .join('g')
      .attr('stroke', (key) => colorScale(key) as string)
      .selectAll('path')
      .data((key) => {
        return [data.map((d) => ({ x: d.x, y: d[key] as number }))];
      })
      .join('path')
      .attr('fill', 'none')
      .attr('stroke-width', 1.5)
      .attr('d', lineGenerator);
  }, [colorScale, data, keyList, lineGenerator]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

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

  const activeOverlay =
    activePoint && (showCrosshair || showActiveMarker) ? (
      <g className="active-overlay" pointerEvents="none">
        {showCrosshair && (
          <>
            <line
              x1={activePoint.left}
              x2={activePoint.left}
              y1={margin.top}
              y2={parentHeight - margin.bottom}
              stroke={activePoint.color}
              strokeDasharray="4 4"
              strokeOpacity={0.35}
            />
            <line
              x1={margin.left}
              x2={parentWidth - margin.right}
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
      margin={margin}
      xScale={x as AxisScale<AxisDomain>}
      yScale={y as AxisScale<AxisDomain>}
      showGridVertical={showGridVertical}
      showGridHorizontal={showGridHorizontal}
      onPointerMove={onMouseMove}
      onPointerLeave={onMouseLeave}
      onPointerUp={onMouseLeave}
      onPointerCancel={onMouseLeave}
      chart={
        <>
          <g className="chart" />
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
    />
  );
};

export default GroupLineChart;
