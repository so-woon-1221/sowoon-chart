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
import cloud from 'd3-cloud';
import withParentSize from '../hooks/withParentSize';
import CanvasText from './canvas/CanvasText';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      setContext(canvasRef.current.getContext('2d'));
    }
  }, []);

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

          context.font = '30px Sans-serif';
          context.fillStyle = '#000';
          context.fillText('Loading...', width / 2, height / 2);
          context.textAlign = 'center';
          context.textBaseline = 'middle';
        } else if (e.data.type === 'end') {
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
    }
    return null;
  }, [colorMap, context, height, type, width, wordData]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div className="h-full w-full select-text">
      <canvas width={width} height={height} ref={canvasRef} />
    </div>
  );
};

export default withParentSize(WordCloud);
