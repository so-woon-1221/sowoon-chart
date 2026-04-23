import { curveLinearClosed, lineRadial, max, pointer, scaleLinear, scaleOrdinal } from 'd3';
import { type PointerEvent, useCallback, useMemo, useRef, useState } from 'react';

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
  XYDatum,
} from '../../util/types';
import ChartLegend from '../common/ChartLegend';
import { getLegendRightInset } from '../common/chartLegend.utils';
import ChartTooltip from '../common/ChartTooltip';

/**
 * One radar series with a label and value list.
 */
export type RadarSeriesDatum = {
  key: string;
  data: XYDatum[];
};

/**
 * Props for {@link RadarChart}.
 */
export type RadarChartProps = Pick<BaseChartProps, 'width' | 'height'> & {
  /**
   * Data to display in the chart.
   */
  data: RadarSeriesDatum[];
  /**
   * List of colors to use for the chart.
   */
  colorList: string[];
  /**
   * Margin of the chart.
   */
  margin?: number;
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
  /**
   * Tooltip anchor position.
   * `cursor` follows the mouse and `point` sticks to the matched radar point.
   * @default "cursor"
   */
  tooltipPosition?: TooltipPositionMode;
} & Omit<LegendProps, 'seriesName'>;

/**
 * Renders radial polygon series for comparing multiple categories at once.
 */
const RadarChart = ({
  width,
  height,
  margin = 60,
  data,
  colorList,
  children,
  tooltipOffset = { x: 10, y: -10 },
  tooltipPosition = 'cursor',
  showLegend = true,
  legendItems,
  legendPosition = 'bottom',
  legendTitle,
}: RadarChartProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<XYDatum>();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const { ref: parentRef, height: parentHeight, width: parentWidth } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const chartWidth = useMemo(() => {
    return Math.max(parentWidth - getLegendRightInset(showLegend, legendPosition), 0);
  }, [legendPosition, parentWidth, showLegend]);

  const color = useMemo(
    () =>
      scaleOrdinal<string, string>()
        .domain(data.map((d) => d.key))
        .range(colorList),
    [colorList, data],
  );

  const axisList = useMemo(() => data[0].data.map((d) => d.x), [data]);

  const angleSlice = useMemo(() => (Math.PI * 2) / data[0].data.length, [data]);

  const maxY = useMemo(() => max(data, (d) => max(d.data, (a) => a.y)), [data]);

  const backLineList = useMemo(() => {
    const list = [];
    for (const step of [1, 2, 3, 4]) {
      const line = [];
      for (const _ of axisList) {
        line.push(maxY! * (step / 4));
      }
      list.push(line);
    }
    return list;
  }, [axisList, maxY]);

  const rScale = useMemo(
    () =>
      scaleLinear()
        .domain([0, maxY!])
        .range([0, Math.min(parentHeight, chartWidth) / 2 - margin]),
    [chartWidth, margin, maxY, parentHeight],
  );

  const radarLine = useMemo(
    () =>
      lineRadial<number>()
        .curve(curveLinearClosed)
        .radius((d) => rScale(d))
        .angle((_, i) => i * angleSlice),
    [angleSlice, rScale],
  );

  const handlePointPointerMove = useCallback(
    (
      event: PointerEvent<SVGCircleElement>,
      point: XYDatum & { index: number; seriesKey: string },
    ) => {
      const [xPoint, yPoint] = pointer(event, ref.current ?? event.currentTarget);
      const pointX =
        chartWidth / 2 + rScale(point.y) * Math.cos(angleSlice * point.index - Math.PI / 2);
      const pointY =
        parentHeight / 2 + rScale(point.y) * Math.sin(angleSlice * point.index - Math.PI / 2);
      const resolvedTooltipPosition = resolveTooltipPositionMode(
        tooltipPosition,
        getEventPointerType(event),
      );
      const isPointTooltip = resolvedTooltipPosition === 'point';

      setActiveKey(point.seriesKey);
      showTooltip({
        left: isPointTooltip ? pointX : xPoint,
        top: isPointTooltip ? pointY : yPoint,
        data: { x: point.x, y: point.y },
        positionMode: resolvedTooltipPosition,
      });
    },
    [angleSlice, chartWidth, parentHeight, rScale, showTooltip, tooltipPosition],
  );

  const handlePointPointerEnd = useCallback(() => {
    setActiveKey(null);
    hideTooltip();
  }, [hideTooltip]);

  const keyList = useMemo(() => data.map((d) => d.key), [data]);

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
      color: color(key),
    }));
  }, [color, keyList, legendItems, showLegend]);

  return (
    <div
      ref={parentRef}
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <svg width={'100%'} height={'100%'} ref={ref}>
        <g className={'chart'} transform={`translate(${chartWidth / 2}, ${parentHeight / 2})`}>
          {backLineList.map((backLine, index) => (
            <path
              key={`axis-${index}`}
              className="axis"
              d={radarLine(backLine) ?? undefined}
              fill="#CDCDCD"
              stroke="#CDCDCD"
              fillOpacity={0.1}
            />
          ))}
          {axisList.map((axis, index) => {
            const axisX = rScale(maxY! * 1.1) * Math.cos(angleSlice * index - Math.PI / 2);
            const axisY = rScale(maxY! * 1.1) * Math.sin(angleSlice * index - Math.PI / 2);

            return (
              <g key={`${axis}-${index}`}>
                <line
                  x1={0}
                  y1={0}
                  x2={axisX}
                  y2={axisY}
                  className="line"
                  stroke="white"
                  strokeWidth={2}
                />
                <text
                  x={axisX}
                  y={axisY}
                  fontSize={12}
                  textAnchor="middle"
                  fontFamily="monospace"
                  dy="0.35em"
                >
                  {axis}
                </text>
              </g>
            );
          })}
          {data.map((series, index) => {
            const isInactive = activeKey !== null && series.key !== activeKey;
            const isActive = activeKey === series.key;

            return (
              <path
                key={series.key}
                className="data"
                d={radarLine(series.data.map((point) => point.y)) ?? undefined}
                fill={color(series.key)}
                stroke={color(series.key)}
                strokeDasharray={index % 2 === 1 ? '5,5' : '0,0'}
                pointerEvents="none"
                fillOpacity={isInactive ? 0.04 : 0.1}
                strokeOpacity={isInactive ? 0.3 : 1}
                strokeWidth={isActive ? 3 : 2}
              />
            );
          })}
          {data.map((series) => {
            const isInactive = activeKey !== null && series.key !== activeKey;

            return (
              <g
                key={series.key}
                className="series"
                stroke={color(series.key)}
                fill={color(series.key)}
                opacity={isInactive ? 0.35 : 1}
              >
                {series.data.map((point, index) => {
                  const pointWithMeta = {
                    ...point,
                    index,
                    seriesKey: series.key,
                  };

                  return (
                    <circle
                      key={`${series.key}-${point.x}-${index}`}
                      r={4}
                      cx={rScale(point.y) * Math.cos(angleSlice * index - Math.PI / 2)}
                      cy={rScale(point.y) * Math.sin(angleSlice * index - Math.PI / 2)}
                      onPointerMove={(event) => handlePointPointerMove(event, pointWithMeta)}
                      onPointerLeave={handlePointPointerEnd}
                      onPointerUp={handlePointPointerEnd}
                      onPointerCancel={handlePointPointerEnd}
                    />
                  );
                })}
              </g>
            );
          })}
        </g>
      </svg>
      {children && tooltip.isOpen && tooltip.data && (
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
      )}
      {resolvedLegendItems.length > 0 && (
        <ChartLegend
          items={resolvedLegendItems}
          title={legendTitle}
          position={legendPosition}
          activeKey={activeKey}
          onItemEnter={(item) => setActiveKey(item.key)}
          onItemLeave={() => setActiveKey(null)}
          onItemFocus={(item) => setActiveKey(item.key)}
          onItemBlur={() => setActiveKey(null)}
        />
      )}
    </div>
  );
};

export default RadarChart;
