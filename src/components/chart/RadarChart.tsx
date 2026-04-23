import { curveLinearClosed, lineRadial, max, pointer, scaleLinear, scaleOrdinal, select } from 'd3';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select('.chart');
    chartContainer.attr('transform', `translate(${chartWidth / 2}, ${parentHeight / 2})`);

    chartContainer
      .selectAll('path.axis')
      .data(backLineList)
      .join('path')
      .attr('class', 'axis')
      .attr('d', (d) => radarLine(d))
      .style('fill', '#CDCDCD')
      .style('stroke', '#CDCDCD')
      .style('fill-opacity', 0.1);

    chartContainer
      .selectAll('line')
      .data(axisList)
      .join('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', (_, i) => rScale(maxY! * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y2', (_, i) => rScale(maxY! * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('class', 'line')
      .style('stroke', 'white')
      .style('stroke-width', '2px');

    chartContainer
      .selectAll('text')
      .data(axisList)
      .join('text')
      .style('font-size', '12px')
      .attr('text-anchor', 'middle')
      .attr('font-family', 'monospace')
      .attr('dy', '0.35em')
      .attr('x', (_, i) => rScale(maxY! * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (_, i) => rScale(maxY! * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
      .text((d) => d);

    chartContainer
      .selectAll<SVGPathElement, RadarSeriesDatum>('path.data')
      .data(data, (datum) => datum.key)
      .join('path')
      .attr('class', 'data')
      .attr('d', (d) => radarLine(d.data.map(() => 0)))
      .transition()
      .attr('d', (d) => {
        return radarLine(d.data.map((a) => a.y));
      })
      .attr('fill', (d) => color(d.key))
      .attr('stroke', (d) => color(d.key))
      .attr('stroke-dasharray', (_, i) => (i % 2 === 1 ? '5,5' : '0,0'))
      .attr('pointer-events', 'none');

    const seriesGroups = chartContainer
      .selectAll<SVGGElement, RadarSeriesDatum>('g.series')
      .data(data, (datum) => datum.key)
      .join('g')
      .attr('class', 'series')
      .attr('stroke', (d) => color(d.key))
      .attr('fill', (d) => color(d.key));

    const seriesPoints = seriesGroups
      .selectAll<SVGCircleElement, XYDatum & { index: number; seriesKey: string }>('circle')
      .data((d) => d.data.map((point, index) => ({ ...point, index, seriesKey: d.key })))
      .join('circle')
      .attr('r', 4)
      .attr('cx', (d) => rScale(d.y) * Math.cos(angleSlice * d.index - Math.PI / 2))
      .attr('cy', (d) => rScale(d.y) * Math.sin(angleSlice * d.index - Math.PI / 2));

    seriesPoints
      .on('pointermove', (e, d) => {
        const [xPoint, yPoint] = pointer(e, ref.current);
        const pointX = chartWidth / 2 + rScale(d.y) * Math.cos(angleSlice * d.index - Math.PI / 2);
        const pointY =
          parentHeight / 2 + rScale(d.y) * Math.sin(angleSlice * d.index - Math.PI / 2);
        const resolvedTooltipPosition = resolveTooltipPositionMode(
          tooltipPosition,
          getEventPointerType(e),
        );
        const isPointTooltip = resolvedTooltipPosition === 'point';
        setActiveKey(d.seriesKey);
        showTooltip({
          left: isPointTooltip ? pointX : xPoint,
          top: isPointTooltip ? pointY : yPoint,
          data: { x: d.x, y: d.y },
          positionMode: resolvedTooltipPosition,
        });
      })
      .on('pointerleave', () => {
        setActiveKey(null);
        hideTooltip();
      })
      .on('pointerup', () => {
        setActiveKey(null);
        hideTooltip();
      })
      .on('pointercancel', () => {
        setActiveKey(null);
        hideTooltip();
      });
  }, [
    angleSlice,
    axisList,
    backLineList,
    color,
    data,
    hideTooltip,
    maxY,
    chartWidth,
    parentHeight,
    rScale,
    radarLine,
    showTooltip,
    tooltipPosition,
  ]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  useEffect(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select('.chart');

    chartContainer
      .selectAll<SVGPathElement, RadarSeriesDatum>('path.data')
      .attr('fill-opacity', (d) => (activeKey && d.key !== activeKey ? 0.04 : 0.1))
      .attr('stroke-opacity', (d) => (activeKey && d.key !== activeKey ? 0.3 : 1))
      .attr('stroke-width', (d) => (activeKey === d.key ? 3 : 2));

    chartContainer
      .selectAll<SVGGElement, RadarSeriesDatum>('g.series')
      .attr('opacity', (d) => (activeKey && d.key !== activeKey ? 0.35 : 1));
  }, [activeKey, data]);

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
        <g className={'chart'} />
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
