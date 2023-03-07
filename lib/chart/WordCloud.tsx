import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { extent } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import type { ComponentType } from 'react';
// @ts-ignore
import WordCloudWorker from 'worker-loader!./canvas/wordcloud.worker';
import withParentSize from '../hooks/withParentSize';

interface Props {
  /**
   * Data for the chart.
   * Each element of the array should have the following format:
   * {
   *  text: string;
   *  value: number;
   * }
   */
  data: {
    text: string;
    value: number;
  }[];
  /**
   * ID of the chart
   * */
  id: string;
  width?: number;
  height?: number;
  /**
   * Color list for the chart
   * - five colors are used by default
   * - rotate when the number of data points exceeds the number of colors
   * @default ["#0A0908", "#0891b2", "#C6AC8F", "#60D394", "#D1495B", "#9b5de5"]
   */
  colorList?: string[];
  /**
   * Type of the spiral
   * - "rectangular" or "archimedean"
   * @default "rectangular"
   * */
  type?: 'rectangular' | 'archimedean';
}

const WordCloud: ComponentType<Props> = ({
  data,
  width,
  height,
  id,
  colorList = [
    '#0A0908',
    '#0891b2',
    '#C6AC8F',
    '#60D394',
    '#D1495B',
    '#9b5de5',
  ],
  type = 'rectangular',
}) => {
  const [loading, setLoading] = useState(false);
  const fontScale = useMemo(
    () =>
      scaleLinear()
        .domain(extent(data.map(d => +d.value)) as [number, number])
        .range([15, 80]),
    [data],
  );

  const colorMap = useMemo(() => {
    const map = new Map();
    data.forEach((d, i) => {
      map.set(d.text, colorList[i % colorList.length]);
    });

    return map;
  }, [colorList, data]);

  const wordData = useMemo(
    () => data.map(d => ({ text: d.text, size: fontScale(d.value) })),
    [data, fontScale],
  );

  const drawChart = useCallback(() => {
    if (width && height) {
      const worker: Worker = new WordCloudWorker();

      worker.postMessage({
        width,
        height,
        data: wordData,
        padding: 0,
        fontFamily: 'Impact',
        type,
      });
      worker.onmessage = e => {
        console.log(e);

        const words = e.data;

        select(`#${id}-svg`)
          .attr('transform', `translate(${width! / 2}, ${height! / 2})`)
          .selectAll('text')
          .data(words)
          .join('text')
          .style('font-size', (d: any) => `${d.size}px`)
          .style('font-family', 'Impact')
          .attr('text-anchor', 'middle')
          .attr(
            'transform',
            (d: any) => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`,
          )
          .text((d: any) => d.text as string)
          .attr('fill', (d: any) => colorMap.get(d.text));
      };
    }
    return null;
  }, [width, height, wordData, type, id, colorMap]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div className="h-full w-full select-text">
      <svg width={width} height={height}>
        <g id={`${id}-svg`} />
      </svg>
      <div>로딩중</div>
    </div>
  );
};

export default withParentSize(WordCloud);
