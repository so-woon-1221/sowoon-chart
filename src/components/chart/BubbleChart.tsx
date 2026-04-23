import { hierarchy, hsl, pack, select } from 'd3';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useParentSize } from '../../hooks/useParentSize';
import type { ChartProps, LegendProps } from '../../util/types';
import ChartLegend from '../common/ChartLegend';
import { getLegendRightInset } from '../common/chartLegend.utils';

/**
 * Props for {@link BubbleChart}.
 */
export type BubbleChartProps = Pick<ChartProps, 'width' | 'height' | 'data' | 'margin'> &
  LegendProps & {
    /**
     * Reserved slot for future custom overlays.
     */
    children?: React.ReactNode;
    /**
     * Color palette applied to bubble nodes in order.
     */
    colorList?: string[];
  };

/**
 * Renders packed circles sized by each datum's `y` value.
 */
const BubbleChart = ({
  width,
  height,
  data,
  margin = { top: 10, left: 30, right: 30, bottom: 10 },
  colorList = ['#0A0908', '#0891b2', '#C6AC8F', '#60D394', '#D1495B', '#9b5de5'],
  showLegend = false,
  legendItems,
  legendPosition = 'bottom',
  legendTitle,
  seriesName,
  children,
}: BubbleChartProps) => {
  const { ref: parentRef, height: parentHeight, width: parentWidth } = useParentSize();
  const ref = useRef<SVGSVGElement>(null);

  const layoutWidth = useMemo(() => {
    return Math.max(parentWidth - getLegendRightInset(showLegend, legendPosition), 0);
  }, [legendPosition, parentWidth, showLegend]);

  const packData = useMemo(() => {
    return {
      children: data.map((d) => ({ key: d.x, value: d.y })),
      key: '전체',
      value: 0,
    };
  }, [data]);

  const root = useMemo(
    () => hierarchy<{ key: string; value: number }>(packData).sum((d) => d.value),
    [packData],
  );

  const packGenerator = useMemo(() => {
    return pack<{ key: string; value: number }>()
      .size([layoutWidth - margin.left - margin.right, parentHeight - margin.top - margin.bottom])
      .padding(1);
  }, [layoutWidth, margin.bottom, margin.left, margin.right, margin.top, parentHeight]);

  const resolvedLegendItems = useMemo(() => {
    if (!showLegend) {
      return [];
    }

    if (legendItems?.length) {
      return legendItems;
    }

    return [
      {
        key: 'bubble',
        label: seriesName ?? 'Bubbles',
        color: colorList[0] ?? '#0A0908',
      },
    ];
  }, [colorList, legendItems, seriesName, showLegend]);

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select('.chart');

    const packData = packGenerator(root).descendants().slice(1);

    chartContainer
      .selectAll('circle')
      .data(packData)
      .join('circle')
      .attr('r', (d) => d.r)
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('fill', (_, i) => colorList[i % colorList.length]);

    chartContainer
      .selectAll('text')
      .data(packData)
      .join('text')
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', 15)
      .attr('font-weight', 700)
      .attr('font-family', 'Noto Sans KR')
      .attr('fill', (_, i) => {
        const backgroundColor = colorList[i % colorList.length];
        const colorObj = hsl(backgroundColor);

        return colorObj.l > 0.5 ? 'black' : 'white';
      })
      .text((d) => d.data.key);
  }, [colorList, packGenerator, root]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div
      ref={parentRef}
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        position: 'relative',
      }}
    >
      <svg width={'100%'} height={'100%'} ref={ref}>
        <g className={'chart'} />
      </svg>
      {children}
      {resolvedLegendItems.length > 0 && (
        <ChartLegend items={resolvedLegendItems} position={legendPosition} title={legendTitle} />
      )}
    </div>
  );
};

export default BubbleChart;
