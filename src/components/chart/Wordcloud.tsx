import { extent, scaleLinear } from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import WordCloudWorker from 'web-worker:./lib/wordcloud.worker.js';

import { useParentSize } from '../../hooks/useParentSize';
import { type ChartProps, type LegendProps } from '../../util/types';
import ChartLegend from '../common/ChartLegend';
import { getLegendRightInset } from '../common/chartLegend.utils';

/**
 * Props for {@link Wordcloud}.
 */
export type WordcloudProps = Omit<ChartProps, 'maxY' | 'minY' | 'color'> &
  LegendProps & {
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
  showLegend = false,
  legendItems,
  legendPosition = 'bottom',
  legendTitle,
  seriesName,
  ariaLabel = 'Word cloud chart',
  ariaDescription,
}: WordcloudProps) => {
  const { ref: parentRef, width: parentWidth, height: parentHeight } = useParentSize();

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const [activeWord, setActiveWord] = useState<string | null>(null);

  const layoutWidth = useMemo(() => {
    return Math.max(parentWidth - getLegendRightInset(showLegend, legendPosition), 0);
  }, [legendPosition, parentWidth, showLegend]);

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
    const map = new Map<string, string>();
    data.forEach((d, i) => {
      map.set(d.x, colorList[i % colorList.length]);
    });

    return map;
  }, [colorList, data]);

  const resolvedLegendItems = useMemo(() => {
    if (!showLegend) {
      return [];
    }

    if (legendItems?.length) {
      return legendItems;
    }

    return [
      {
        key: 'wordcloud',
        label: seriesName ?? 'Words',
        color: colorList[0] ?? '#0A0908',
      },
    ];
  }, [colorList, legendItems, seriesName, showLegend]);

  const wordData = useMemo(
    () => data.map((d) => ({ text: d.x, size: fontScale(d.y) })),
    [data, fontScale],
  );
  const hasLayoutBounds =
    typeof layoutWidth === 'number' &&
    typeof parentHeight === 'number' &&
    layoutWidth > 0 &&
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
      width: layoutWidth,
      height: parentHeight,
      data: wordData,
      padding,
    });
  }, [layoutWidth, padding, parentHeight, shouldRenderWords, wordData]);

  const renderedWords = shouldRenderWords ? (words ?? []) : [];

  return (
    <div
      ref={parentRef}
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        position: 'relative',
      }}
    >
      <svg width={'100%'} height={'100%'} role="img" aria-label={ariaLabel}>
        <title>{ariaLabel}</title>
        {ariaDescription && <desc>{ariaDescription}</desc>}
        <g
          className={'word-container'}
          transform={`translate(${(layoutWidth ?? 0) / 2}, ${(parentHeight ?? 0) / 2})`}
        >
          {renderedWords.map((word) => (
            <text
              key={word.text}
              fontSize={word.size}
              fontFamily="Impact"
              textAnchor="middle"
              cursor="pointer"
              transform={`translate(${word.x}, ${word.y}) rotate(${word.rotate})`}
              fill={colorMap.get(word.text)}
              opacity={!activeWord || activeWord === word.text ? 1 : 0.5}
              tabIndex={0}
              aria-label={word.text}
              onPointerEnter={() => setActiveWord(word.text)}
              onPointerLeave={() => setActiveWord(null)}
              onFocus={() => setActiveWord(word.text)}
              onBlur={() => setActiveWord(null)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setActiveWord(null);
                }
              }}
            >
              {word.text}
            </text>
          ))}
        </g>
      </svg>
      {resolvedLegendItems.length > 0 && (
        <ChartLegend items={resolvedLegendItems} position={legendPosition} title={legendTitle} />
      )}
    </div>
  );
};

export default Wordcloud;
