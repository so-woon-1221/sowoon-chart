import React, {
  useCallback,
  useEffect,
  useMemo,
  ComponentType,
  useRef,
} from 'react';
import { extent } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
// @ts-ignore
import WordCloudWorker from 'worker-loader!./canvas/wordcloud.worker';
import withParentSize from '../hooks/withParentSize';
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
  padding = 0,
}) => {
  const spinnerRef = useRef<HTMLDivElement>(null);
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
        padding: padding,
        fontFamily: 'Impact',
        type,
      });
      worker.onmessage = e => {
        if (e.data.type === 'start') {
          select(`#${id}-svg`).selectAll('text').remove();
          if (spinnerRef.current) {
            spinnerRef.current.style.display = 'block';
          }
        }
        if (e.data.type === 'end') {
          if (spinnerRef.current) {
            spinnerRef.current.style.display = 'none';
          }

          const words = e.data.data;
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
            .attr('fill', (d: any) => colorMap.get(d.text))
            .attr('cursor', 'pointer')
            .on('mouseover', (event: any, d: any) => {
              const texts = (
                select(select(event.target).node().parentNode).selectAll(
                  'text',
                ) as any
              )._groups[0];
              texts.forEach((text: string) => {
                if (select(text).text() !== d.text) {
                  select(text).transition().attr('opacity', 0.1);
                } else {
                  select(text).attr('opacity', 1);
                }
              });
            })
            .on('mouseleave', (event: any) => {
              select(select(event.target).node().parentNode)
                .selectAll('text')
                .transition()
                .attr('opacity', 1);
            });
        }
      };

      return () => {
        worker.terminate();
      };
    }
    return null;
  }, [width, height, wordData, padding, type, id, colorMap]);

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
      <svg width={width} height={height}>
        <g id={`${id}-svg`} />
        <text id={`${id}-loader`} />
      </svg>
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
