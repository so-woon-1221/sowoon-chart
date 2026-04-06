import { extent, scaleLinear, select } from 'd3';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import WordCloudWorker from 'web-worker:./lib/wordcloud.worker.js';

import { useParentSize } from '../../hooks/useParentSize';
import { type ChartProps } from '../../util/types';

/**
 * Props for {@link Wordcloud}.
 */
export type WordcloudProps = Omit<ChartProps, 'maxY' | 'minY' | 'color'> & {
  /**
   * Colors cycled across generated words.
   */
  colorList?: string[];
  /**
   * Extra space between placed words.
   * @default 1
   */
  padding?: number;
};

/**
 * Renders a worker-driven word cloud where `x` becomes text and `y` controls font size.
 */
const Wordcloud = ({
  width,
  height,
  data,
  padding = 1,
  colorList = ['#0A0908', '#0891b2', '#C6AC8F', '#60D394', '#D1495B', '#9b5de5'],
}: WordcloudProps) => {
  const { ref: parentRef, width: parentWidth, height: parentHeight } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  const [words, setWords] = useState<
    | {
        text: string;
        size: number;
        x: number;
        y: number;
        rotate: number;
      }[]
    | null
  >(null);

  const fontScale = useMemo(
    () =>
      scaleLinear()
        .domain(extent(data.map((d) => +d.y)) as [number, number])
        .range([15, 80]),
    [data],
  );

  const colorMap = useMemo(() => {
    const map = new Map();
    data.forEach((d, i) => {
      map.set(d.x, colorList[i % colorList.length]);
    });

    return map;
  }, [colorList, data]);

  const wordData = useMemo(
    () => data.map((d) => ({ text: d.x, size: fontScale(d.y) })),
    [data, fontScale],
  );
  const hasLayoutBounds =
    typeof parentWidth === 'number' &&
    typeof parentHeight === 'number' &&
    parentWidth > 0 &&
    parentHeight > 0;
  const shouldRenderWords = hasLayoutBounds && wordData.length > 0;

  useEffect(() => {
    const worker: Worker = new WordCloudWorker();
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data.requestId !== requestIdRef.current) {
        return;
      }

      if (e.data.type === 'end') {
        setWords(e.data.data);
      }
    };

    return () => {
      workerRef.current = null;
      worker.terminate();
    };
  }, []);

  useEffect(() => {
    const worker = workerRef.current;

    if (!worker) {
      return;
    }

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    if (!shouldRenderWords) {
      worker.postMessage({
        type: 'cancel',
      });
      return;
    }

    worker.postMessage({
      type: 'layout',
      requestId,
      width: parentWidth,
      height: parentHeight,
      data: wordData,
      padding,
    });
  }, [padding, parentHeight, parentWidth, shouldRenderWords, wordData]);

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select('.word-container');
    const renderedWords = shouldRenderWords ? (words ?? []) : [];

    chartContainer.attr(
      'transform',
      `translate(${(parentWidth ?? 0) / 2}, ${(parentHeight ?? 0) / 2})`,
    );
    const wordEl = chartContainer.selectAll('text').data(renderedWords);

    const wordGroup = wordEl.join('text');
    wordGroup
      .style('font-size', () => `0px`)
      .transition()
      .style('font-size', (d) => `${d.size}px`)
      .style('font-family', 'Impact')
      .attr('text-anchor', 'middle')
      .attr('cursor', 'pointer')
      .attr('transform', (d) => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`)
      .text((d) => d.text as string)
      .attr('fill', (d) => colorMap.get(d.text));
    wordGroup
      .on('mouseover', (e) => {
        chartContainer.selectAll('text').attr('opacity', 0.5);
        select(e.target).attr('opacity', 1);
      })
      .on('mouseout', () => {
        chartContainer.selectAll('text').attr('opacity', 1);
      });
  }, [colorMap, parentHeight, parentWidth, shouldRenderWords, words]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div
      ref={parentRef}
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
      }}
    >
      <svg width={'100%'} height={'100%'} ref={ref}>
        <g className={'word-container'} />
      </svg>
    </div>
  );
};

export default Wordcloud;
