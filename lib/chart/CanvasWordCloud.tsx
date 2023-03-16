import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { extent } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import type { ComponentType } from 'react';
// @ts-ignore
import WordCloudWorker from 'worker-loader!./canvas/wordcloud.worker';
import type { Word } from 'd3-cloud';
import withParentSize from '../hooks/withParentSize';
import CanvasText from './canvas/CanvasText';
import { WordCloudProps } from '../util';

const WordCloud: ComponentType<WordCloudProps> = ({
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
  spinner = 'Loading...',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const spinnerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      setContext(canvasRef.current.getContext('2d'));
    }
  }, []);

  const [clickPosition, setClickPosition] = useState<[number, number]>([0, 0]);

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
    if (width && height && context) {
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
        if (e.data.type === 'start') {
          context.clearRect(0, 0, width, height);
          spinnerRef.current!.style.display = 'block';
        } else if (e.data.type === 'end') {
          spinnerRef.current!.style.display = 'none';

          context.clearRect(0, 0, width, height);
          const words: Word[] = e.data.data;
          words.forEach(d => {
            const text = new CanvasText({
              color: colorMap.get(d.text),
              text: d.text ?? '',
              fontSize: d.size ?? 0,
              x: (d.x ?? 0) + width / 2,
              y: (d.y ?? 0) + height / 2,
            });
            text.draw(context);
          });
        }
      };

      return () => {
        worker.terminate();
      };
    }
    return null;
  }, [colorMap, context, height, type, width, wordData]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        userSelect: 'text',
      }}
    >
      <canvas width={width} height={height} ref={canvasRef} />
      <div
        ref={spinnerRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {spinner}
      </div>
    </div>
  );
};

export default withParentSize(WordCloud);
