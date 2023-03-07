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
      const layout = cloud()
        .size([width!, height!])
        .words(wordData)
        .rotate(0)
        .font('Impact')
        .fontSize(d => d.size as number)
        .spiral(type)
        .on('end', words => {
          context!.clearRect(0, 0, width!, height!);
          words.forEach((d: any) => {
            const text = new CanvasText({
              text: d.text,
              x: d.x + width! / 2,
              y: d.y + height! / 2,
              fontSize: d.size,
              fontStyle: 'Impact',
              color: colorMap.get(d.text),
            });
            text.draw(context);
          });
        });

      layout.start();

      return () => {
        layout.stop();
      };

      // const hie = hierarchy({ children: wordData })
      //   .sum(d => d.size)
      //   .sort((a, b) => b.size - a.size);

      // const pac = pack().size([width!, height!]).padding(1);

      // const root = pac(hie);

      // const packNodes = root.descendants().slice(1);

      // const simulation = forceSimulation(packNodes)
      //   .force('collide', forceCollide(d => d.r + 15).iterations(2))
      //   .on('tick', () => {
      //     context!.clearRect(0, 0, width!, height!);
      //     packNodes.forEach((d: any) => {
      //       const text = new CanvasText({
      //         text: d.data.text,
      //         x: d.x,
      //         y: d.y,
      //         fontSize: d.r,
      //         fontStyle: 'Impact',
      //         color: colorMap.get(d.data.text),
      //       });
      //       text.draw(context);
      //     });
      //   });
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
