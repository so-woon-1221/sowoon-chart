import {
  area,
  type AxisDomain,
  type AxisScale,
  line,
  pointer,
  scaleBand,
  scaleLinear,
  select,
} from 'd3';
import { type PointerEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useChartTooltip } from '../../hooks/useChartTooltip';
import { useParentSize } from '../../hooks/useParentSize';
import { getEventPointerType, getTooltipAlign, resolveTooltipPositionMode } from '../../util/tooltip';
import type {
  ChartProps,
  TooltipInteractionProps,
  TooltipRenderer,
  XYDatum,
} from '../../util/types';
import { getClosestIndex } from '../../util/utils';
import CartesianFrame from '../common/CartesianFrame';
import ChartTooltip from '../common/ChartTooltip';

type ActivePoint = {
  left: number;
  top: number;
  color: string;
};

type Props = ChartProps &
  TooltipInteractionProps & {
  children?: TooltipRenderer<XYDatum>;
  fillGradient?: boolean;
  drawStroke?: boolean;
};

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50,
};

const AreaChart = ({
  width,
  height,
  margin = defaultMargin,
  minY,
  maxY,
  data,
  color = 'black',
  children,
  fillGradient = false,
  drawStroke = true,
  tooltipPosition = 'point',
  showActiveMarker = false,
  showCrosshair = false,
  showGridVertical = true,
  showGridHorizontal = true,
}: Props) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<XYDatum>();
  const [activePoint, setActivePoint] = useState<ActivePoint | null>(null);

  const { ref: parentRef, height: parentHeight, width: parentWidth } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const x = useMemo(() => {
    return scaleBand()
      .domain(data.map((d) => d.x))
      .range([margin.left, (parentWidth ?? 0) - margin.right]);
  }, [data, margin.left, margin.right, parentWidth]);

  const y = useMemo(() => {
    return scaleLinear()
      .domain([minY ?? 0, maxY ?? Math.max(...data.map((d) => d.y))])
      .range([(parentHeight ?? 0) - margin.bottom, margin.top]);
  }, [data, margin.bottom, margin.top, maxY, minY, parentHeight]);

  const xPositions = useMemo(() => {
    return data.map((d) => (x(d.x) ?? 0) + x.bandwidth() / 2);
  }, [data, x]);

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

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select('.chart');

    const fillColor = fillGradient ? `url(#${color})` : color;

    const chartArea = chartContainer.selectAll('path.area').data([data]);
    chartArea.join('path').attr('class', 'area').attr('d', areaGenerator).attr('fill', fillColor);

    if (drawStroke) {
      const line = chartContainer.selectAll('path.line').data([data]);
      line
        .join('path')
        .attr('class', 'line')
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', color);
    }
  }, [areaGenerator, color, data, drawStroke, fillGradient, lineGenerator]);

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

      if (!point) {
        setActivePoint(null);
        return;
      }

      const pointLeft = xPositions[index];
      const pointTop = y(point.y);
      const resolvedTooltipPosition = resolveTooltipPositionMode(
        tooltipPosition,
        getEventPointerType(e),
      );
      setActivePoint({
        left: pointLeft,
        top: pointTop,
        color,
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
    [children, color, data, showActiveMarker, showCrosshair, showTooltip, tooltipPosition, xPositions, y],
  );

  const onMouseLeave = useCallback(() => {
    setActivePoint(null);
    hideTooltip();
  }, [hideTooltip]);

  const defs = fillGradient ? (
    <defs>
      <linearGradient id={color} x1="0" x2="0" y1="0" y2="1">
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
    />
  );
};

export default AreaChart;
