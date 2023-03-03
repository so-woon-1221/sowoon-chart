import React, { useEffect, useMemo, useCallback } from 'react';
import { bisectLeft, max, min } from 'd3-array';
import { scaleBand, scaleLinear, scaleOrdinal } from 'd3-scale';
import { Line, line, stack } from 'd3-shape';
import { select } from 'd3-selection';
import { PatternLines } from '@visx/pattern';
import { brushX } from 'd3-brush';
import type { ComponentType } from 'react';
import type { ScaleBand } from 'd3-scale';
import type { ChartProps } from '../util';
import withParentSize from '../hooks/withParentSize';

interface Props extends ChartProps {
  setBrushDomain: (domain: string[] | undefined) => void;
}

const margin = {
  left: 50,
  top: 5,
  right: 20,
  bottom: 5,
};

const SparkLineCanvas: ComponentType<Props> = ({
  data,
  id,
  width,
  height,
  groupType = 'single',
  colorList,
  maxLimitY,
  minLimitY,
  setBrushDomain,
}) => {
  // y축을 쌓기위한 Key List
  const keyList = useMemo(
    () => Object.keys(data[0]).filter(k => k !== 'x'),
    [data],
  );

  const yList = useMemo(() => {
    const yArray: number[] = [];
    if (groupType !== 'stack') {
      data.forEach(d => {
        keyList.forEach(k => {
          yArray.push(+d[`${k}`]);
        });
      });
    } else {
      data.forEach(d => {
        let sum = 0;
        keyList.forEach(k => {
          sum += +d[`${k}`];
        });
        yArray.push(sum);
      });
    }
    return yArray;
  }, [groupType, data, keyList]);

  const maxY = useMemo(() => maxLimitY ?? max(yList) ?? 0, [maxLimitY, yList]);

  const minY = useMemo(
    () => minLimitY ?? (groupType === 'stack' ? 0 : min(yList) ?? 0),
    [groupType, minLimitY, yList],
  );

  const colorScale = scaleOrdinal<string>().domain(keyList).range(colorList);

  const xScale: ScaleBand<string> = useMemo(
    () =>
      scaleBand()
        .domain(data.map(d => d.x))
        .range([0, width! - margin.right - margin.left]),
    [data, width],
  );

  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain([minY, maxY])
        .range([height! - margin.bottom, margin.top]),
    [height, maxY, minY],
  );

  const drawSingleLine = useCallback(() => {
    const lineScale = line()
      .x(
        (d: Record<string, any>) =>
          xScale(d.x)! + (xScale as ScaleBand<any>).bandwidth() / 2,
      )
      .y((d: Record<string, any>) => yScale(d.y));

    select(`#${id}-single-line`)
      .selectAll('path')
      .data([data])
      .join('path')
      .attr('d', lineScale as any)
      .attr('stroke', colorList[0])
      .attr('fill', 'none');
  }, [colorList, data, id, xScale, yScale]);

  const drawGroupLine = useCallback(() => {
    const lineScale = (key: string): Line<any> =>
      line()
        .x(
          (d: Record<string, any>) =>
            xScale(d.x)! + (xScale as ScaleBand<any>).bandwidth() / 2,
        )
        .y((d: Record<string, any>) => yScale(d[key]));

    keyList.forEach(key => {
      select(`#${id}-group-line-${key}`)
        .selectAll('path')
        .data([data])
        .join('path')
        .attr('d', lineScale(key) as any)
        .attr('stroke', colorScale(key))
        .attr('stroke-width', 2)
        .attr('fill', 'none');
    });
  }, [colorScale, data, id, keyList, xScale, yScale]);

  const drawStackLine = useCallback(() => {
    const stackedData = stack().keys(keyList)(
      data as Array<Record<string, any>>,
    );

    const lineScale = (): Line<any> =>
      line()
        .x(
          (d: any) =>
            xScale(d.data.x)! + (xScale as ScaleBand<any>).bandwidth() / 2,
        )
        .y(d => yScale(d[1]));

    stackedData.forEach(d => {
      select(`#${id}-stack-line-${d.key}`)
        .selectAll('path')
        .data([d])
        .join('path')
        .attr('d', row => lineScale()(row as any))
        .attr('stroke', colorScale(d.key))
        .attr('stroke-width', 2)
        .attr('fill', 'none');
    });
  }, [colorScale, data, id, keyList, xScale, yScale]);

  useEffect(() => {
    switch (groupType) {
      case 'single':
        drawSingleLine();
        break;
      case 'group':
        drawGroupLine();
        break;
      case 'stack':
        drawStackLine();
        break;
      default:
        break;
    }
  }, [drawGroupLine, drawSingleLine, drawStackLine, groupType]);

  const brush = useMemo(
    () =>
      brushX()
        .extent([
          [margin.left, 0],
          [width! - margin.right, height],
        ] as [[number, number], [number, number]])
        .on('end', event => {
          if (event.selection !== null) {
            const [x0, x1] = event.selection;
            const xDomain = data.map(d => xScale(d.x as any)) as number[];
            const index = bisectLeft(xDomain, x0 - margin.left) - 1;
            const index2 = bisectLeft(xDomain, x1 - margin.left) - 1;
            const domain = data
              .filter((d, i) => i >= index && i <= index2)
              .map(d => d.x);

            setBrushDomain(domain);
          }
        }),
    [height, width, margin, data, xScale],
  );

  useEffect(() => {
    select(`#${id}-brush`).attr('class', 'brush').call(brush);

    select('rect.selection').attr('fill', `url(#${id}-pattern)`);
  }, [brush, id]);

  return (
    <div className="flex flex-col gap-y-2">
      <svg width={width} height={height} id={`${id}-brush`}>
        <g transform={`translate(${margin.left},0)`}>
          <g id="border">
            <rect
              x={0}
              y={0}
              width={width! - margin.right - margin.left}
              height={height!}
              stroke="#666"
              strokeWidth={1}
              fill="none"
            />
          </g>

          {groupType === 'single' && (
            <g id={`${id}-single-line`}>
              <path />
            </g>
          )}
          {groupType === 'group' &&
            keyList.map(key => (
              <g id={`${id}-group-line-${key}`} key={`${id}-group-${key}`}>
                <path />
              </g>
            ))}
          {groupType === 'stack' &&
            keyList.map(key => (
              <g id={`${id}-stack-line-${key}`} key={`${id}-stack-${key}`}>
                <path />
              </g>
            ))}

          <PatternLines
            id={`${id}-pattern`}
            height={8}
            width={8}
            stroke="#666"
            strokeWidth={3}
            orientation={['diagonal']}
          />
          <g id={`${id}-brush`} />
        </g>
      </svg>
    </div>
  );
};

export default withParentSize(SparkLineCanvas);
