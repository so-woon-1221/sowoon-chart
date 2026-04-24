import { pointer, scaleLinear } from 'd3';
import { type PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WordCloudWorker from 'web-worker:./lib/wordcloud.worker.js';

import { useChartTooltip } from '../../hooks/useChartTooltip';
import { useParentSize } from '../../hooks/useParentSize';
import {
  getEventPointerType,
  getTooltipAlign,
  resolveTooltipPositionMode,
} from '../../util/tooltip';
import type {
  ChartProps,
  LegendProps,
  TooltipOffset,
  TooltipPositionMode,
  TooltipRenderer,
  XYDatum,
} from '../../util/types';
import { getFiniteExtentDomain } from '../../util/utils';
import ChartLegend from '../common/ChartLegend';
import { getLegendRightInset } from '../common/chartLegend.utils';
import ChartTooltip from '../common/ChartTooltip';

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
    /**
     * Custom tooltip renderer shown while hovering a word.
     */
    children?: TooltipRenderer<XYDatum>;
    /**
     * Offset of the tooltip from the pointer or word.
     * @default { x: 10, y: -10 }
     */
    tooltipOffset?: TooltipOffset;
    /**
     * Tooltip anchor position.
     * @default "point"
     */
    tooltipPosition?: TooltipPositionMode;
  };

type WordcloudLayoutWord = {
  text: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
};

type WordcloudWorkerMessage =
  | {
      type: 'start';
      requestId: number;
    }
  | {
      type: 'end';
      requestId: number;
      data: WordcloudLayoutWord[];
    }
  | {
      type: 'error';
      requestId: number;
      message: string;
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
  children,
  tooltipOffset = { x: 10, y: -10 },
  tooltipPosition = 'point',
  ariaLabel = 'Word cloud chart',
  ariaDescription,
}: WordcloudProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<XYDatum>();
  const { ref: parentRef, width: parentWidth, height: parentHeight } = useParentSize();

  const svgRef = useRef<SVGSVGElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const [activeWord, setActiveWord] = useState<string | null>(null);

  const layoutWidth = useMemo(() => {
    return Math.max(parentWidth - getLegendRightInset(showLegend, legendPosition), 0);
  }, [legendPosition, parentWidth, showLegend]);

  const [words, setWords] = useState<WordcloudLayoutWord[] | null>(null);

  const fontScale = useMemo(
    () =>
      scaleLinear()
        .domain(getFiniteExtentDomain(data.map((d) => +d.y)))
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

  const dataByText = useMemo(() => new Map(data.map((datum) => [datum.x, datum])), [data]);

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

    worker.onmessage = (event: MessageEvent<WordcloudWorkerMessage>) => {
      const message = event.data;

      if (message.requestId !== requestIdRef.current) {
        return;
      }

      if (message.type === 'start') {
        setWords(null);
        return;
      }

      if (message.type === 'end') {
        setWords(message.data);
        return;
      }

      if (message.type === 'error') {
        setWords([]);
      }
    };

    worker.onerror = () => {
      setWords([]);
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
        requestId,
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

  const showWordTooltip = useCallback(
    (event: PointerEvent<SVGTextElement>, word: WordcloudLayoutWord) => {
      const datum = dataByText.get(word.text);

      setActiveWord(word.text);

      if (!children || !datum) {
        return;
      }

      const [xPoint, yPoint] = pointer(event, svgRef.current ?? event.currentTarget);
      const resolvedTooltipPosition = resolveTooltipPositionMode(
        tooltipPosition,
        getEventPointerType(event),
      );
      const isPointTooltip = resolvedTooltipPosition === 'point';

      showTooltip({
        left: isPointTooltip ? layoutWidth / 2 + word.x : xPoint,
        top: isPointTooltip ? parentHeight / 2 + word.y : yPoint,
        data: datum,
        positionMode: resolvedTooltipPosition,
      });
    },
    [children, dataByText, layoutWidth, parentHeight, showTooltip, tooltipPosition],
  );

  const hideWordTooltip = useCallback(() => {
    setActiveWord(null);
    hideTooltip();
  }, [hideTooltip]);

  const focusWord = useCallback(
    (word: WordcloudLayoutWord) => {
      const datum = dataByText.get(word.text);

      setActiveWord(word.text);

      if (!children || !datum) {
        return;
      }

      showTooltip({
        left: layoutWidth / 2 + word.x,
        top: parentHeight / 2 + word.y,
        data: datum,
        positionMode: 'point',
      });
    },
    [children, dataByText, layoutWidth, parentHeight, showTooltip],
  );

  return (
    <div
      ref={parentRef}
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        position: 'relative',
      }}
    >
      <svg width={'100%'} height={'100%'} ref={svgRef} role="img" aria-label={ariaLabel}>
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
              aria-label={dataByText.get(word.text) ? `${word.text}: ${dataByText.get(word.text)?.y}` : word.text}
              onPointerMove={(event) => showWordTooltip(event, word)}
              onPointerLeave={hideWordTooltip}
              onPointerUp={hideWordTooltip}
              onPointerCancel={hideWordTooltip}
              onFocus={() => focusWord(word)}
              onBlur={hideWordTooltip}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  hideWordTooltip();
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
      {children && tooltip.isOpen && tooltip.data && (
        <ChartTooltip
          left={tooltip.left}
          top={tooltip.top}
          align={getTooltipAlign(tooltip.positionMode)}
          offsetX={tooltipOffset.x}
          offsetY={tooltipOffset.y}
        >
          {children({ tooltipData: tooltip.data })}
        </ChartTooltip>
      )}
    </div>
  );
};

export default Wordcloud;
