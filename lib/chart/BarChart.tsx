import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { max, bisectLeft } from 'd3-array';
import { scaleOrdinal, scaleLinear, scaleBand } from 'd3-scale';
import { select, pointer } from 'd3-selection';
import { stack } from 'd3-shape';
import { axisBottom, axisLeft } from 'd3-axis';
import { TooltipWithBounds } from '@visx/tooltip';
import type { ComponentType } from 'react';
import type { ScaleBand } from 'd3-scale';
import type { ChartProps } from '../util';
import { makeDisplayNum } from '../util';
import withParentSize from '../hooks/withParentSize';
import '../styles/global.css';

const margin = {
  left: 50,
  top: 60,
  right: 20,
  bottom: 50,
};

const BarChart: ComponentType<ChartProps> = ({
  data,
  id,
  width,
  height,
  groupType = 'single',
  colorList,
  maxLimitY,
  minLimitY,
  displayIndex,
  tooltipMaker,
  legendLabelList,
}) => {
  // y축을 쌓기위한 key List
  const keyList = useMemo(
    () => Object.keys(data[0]).filter(k => k !== 'x' && k !== 'tooltipData'),
    [data],
  );

  const colorScale = scaleOrdinal<string>().domain(keyList).range(colorList);

  const yList = useMemo(() => {
    const yArray: number[] = [];
    if (groupType !== 'stack') {
      data.forEach(d => {
        keyList.forEach(k => {
          yArray.push(+d[`${k}`]!);
        });
      });
    } else {
      data.forEach(d => {
        const sum = keyList.reduce((acc, k) => acc + +d[`${k}`]!, 0);
        yArray.push(sum);
      });
    }
    return yArray;
  }, [groupType, data, keyList]);

  const maxY = useMemo(() => maxLimitY ?? max(yList) ?? 0, [maxLimitY, yList]);

  const minY = useMemo(() => minLimitY ?? 0, [minLimitY]);

  const xScale: ScaleBand<string> = useMemo(
    () =>
      scaleBand()
        .domain(data.map(d => d.x))
        .range([margin.left, width! - margin.right])
        .padding(0.2),
    [data, width],
  );

  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain([minY, maxY])
        .range([height! - margin.bottom, margin.top]),
    [height, maxY, minY],
  );

  const yAxisLabel = useMemo(
    () => makeDisplayNum(yScale.ticks(data.length < 5 ? 3 : 5)),
    [data.length, yScale],
  );

  const [tooltipData, setTooltipData] = useState<
    undefined | { x: number; y: number; data: any }
  >(undefined);

  const drawLegend = useCallback(() => {
    const legendList = legendLabelList ?? keyList;
    if (legendList !== null) {
      return (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translate(-50%, 0)',
          }}
        >
          <ul
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${legendList.length}, minmax(0, 1fr))`,
              gap: '0.5rem',
            }}
          >
            {legendList.map((d, i) => (
              <li
                key={`${id}-legend-${d}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <svg width={15} height={15}>
                  <rect
                    x={0}
                    y={0}
                    width={15}
                    height={15}
                    fill={colorList[i] ?? '#e3e3e3'}
                  />
                </svg>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return null;
  }, [colorList, id, keyList, legendLabelList]);

  /**
   * groupType이 none일때 차트 그리기
   */
  const drawSingleBar = useCallback(() => {
    const chartArea = select(`#${id}-bar-area`);

    chartArea
      .selectAll('rect')
      .data(data)
      .join('rect')
      .attr('fill', colorScale(keyList[0]) ?? '#e3e3e3')
      .attr('x', d => (xScale as ScaleBand<any>)(d.x) as number)
      .attr('y', d => yScale(d[keyList[0]] as number))
      .attr(
        'height',
        d => height! - margin.bottom - yScale(d[keyList[0]] as number),
      )
      .attr('width', (xScale as ScaleBand<any>).bandwidth());

    chartArea
      .selectAll('text')
      .data(data)
      .join('text')
      .attr('x', d => (xScale as ScaleBand<any>)(d.x) as number)
      .attr('y', d => yScale(d[keyList[0]] as number))
      .text(d => (d[keyList[0]] as string) + displayIndex)
      .attr('dx', (xScale as ScaleBand<any>).bandwidth() / 2)
      .attr('dy', -5)
      .attr('text-anchor', 'middle')
      .style('font-size', '0.7rem');
  }, [colorScale, data, displayIndex, height, id, keyList, xScale, yScale]);

  /**
   * groupType이 group일때 차트 그리기
   */
  const drawGroupBar = useCallback(() => {
    const chartArea = select(`#${id}-bar-area`);

    const zDomain = keyList.map(d => d);
    const zScale = scaleBand()
      .domain(zDomain)
      .range([0, xScale.bandwidth()])
      .padding(0.1);
    const zColorScale = scaleOrdinal<string>().domain(zDomain).range(colorList);

    keyList.forEach((k, i) => {
      chartArea
        .select(`g#${id}-group-${i}`)
        .selectAll('rect')
        .data(data)
        .join('rect')
        .attr('fill', zColorScale(k))
        .attr('x', d => (xScale(d.x) as number) + (zScale(k) as number))
        .attr('y', d => yScale(d[k] as number))
        .attr('height', d => height! - margin.bottom - yScale(d[k] as number))
        .attr('width', zScale.bandwidth());
    });
  }, [colorList, data, height, id, keyList, xScale, yScale]);

  /**
   * groupType이 stack일때 차트 그리기
   */
  const drawStackBar = useCallback(() => {
    const stackedData = stack().keys(keyList)(
      data as Array<Record<string, number>>,
    );

    const chartArea = select(`#${id}-bar-area`);

    stackedData.forEach((k, i) => {
      chartArea
        .select(`g#${id}-stack-${i}`)
        .attr('fill', colorScale(k.key))
        .selectAll('rect')
        .data(k)
        .join('rect')
        .attr('x', d => xScale(d.data.x as unknown as string) as number)
        .attr('y', d => yScale(d[1]))
        .attr('height', d => yScale(d[0]) - yScale(d[1]))
        .attr('width', (xScale as ScaleBand<any>).bandwidth());
    });
  }, [colorScale, data, id, keyList, xScale, yScale]);

  const grid = useCallback(() => {
    const gridY = axisLeft(yScale)
      .ticks(data.length < 5 ? 3 : 5)
      .tickSize(-width! + margin.left + margin.right)
      .tickFormat(() => '');

    const gridArea = select(`#${id}-grid-y`).attr(
      'transform',
      `translate(${margin.left}, 0)`,
    );
    gridArea.call(gridY as any);
  }, [yScale, width, id, data.length]);

  const xAxis = useCallback(() => {
    const divider =
      // eslint-disable-next-line no-nested-ternary
      width && width < 800
        ? data.length <= 5
          ? 1
          : Math.floor(data.length / 6)
        : 1;

    const axis = axisBottom(xScale)
      .tickSize(3)
      .tickValues(xScale.domain().filter((d, i) => i % divider === 0))
      .tickPadding(5)
      .tickFormat(d => d);

    const axisArea = select(`#${id}-x-axis`).attr(
      'transform',
      `translate(0, ${height! - margin.bottom})`,
    );
    axisArea.selectAll('path').attr('stroke', 'black');
    axisArea
      .selectAll('text')
      .attr('transform', 'rotate(-30)')
      .style('text-anchor', 'end');
    axisArea.call(axis as any);
  }, [width, data.length, xScale, id, height]);

  const yAxis = useCallback(() => {
    const axis = axisLeft(yScale)
      .ticks(data.length < 5 ? 3 : 5)
      .tickSize(3)
      .tickPadding(5)
      .tickFormat(d => {
        // y축에 표시되는 단위만큼 자르기
        const newTickLabel = +d / +yAxisLabel[1];
        if (+newTickLabel % 1 === 0) {
          return newTickLabel.toLocaleString('ko');
        }
        return '';
      });

    const axisArea = select(`#${id}-y-axis`).attr(
      'transform',
      `translate(${margin.left}, 0)`,
    );
    axisArea.selectAll('path').attr('display', 'none');
    axisArea.call(axis as any);
  }, [yScale, id, data.length, yAxisLabel]);

  useEffect(() => {
    grid();
    xAxis();
    yAxis();
    const gridArea = select(`#${id}-grid-y`);
    gridArea.selectAll('g.tick').selectAll('line').attr('stroke', '#eee');
    gridArea.selectAll('path').attr('stroke', 'none');
  }, [grid, id, xAxis, yAxis]);

  useEffect(() => {
    select(`#${id}-bar-area`).selectAll('rect').remove();
    switch (groupType) {
      case 'single':
        drawSingleBar();
        break;
      case 'stack':
        drawStackBar();
        break;
      case 'group':
        drawGroupBar();
        break;
      default:
        break;
    }
  }, [drawGroupBar, drawSingleBar, drawStackBar, groupType, id]);

  return (
    <div style={{ width, height, position: 'relative' }}>
      {drawLegend()}
      <svg
        width={width}
        height={height}
        onPointerMove={e => {
          if (tooltipMaker != null) {
            const x = pointer(e)[0];
            if (x != null) {
              const xDomain = data.map(d => xScale(d.x as any)) as number[];
              const index = bisectLeft(xDomain, x) - 1;
              if (data[index]) {
                const tooltipX =
                  xScale(data[index].x)! + xScale.bandwidth() / 2;
                const tooltipY =
                  groupType === 'single'
                    ? yScale(data[index].y as any)
                    : margin.top;
                let tooltip: any;
                if (tooltipMaker) {
                  tooltip = tooltipMaker(data[index].x);
                } else {
                  tooltip = data[index].tooltipData ?? '';
                }
                setTooltipData({
                  x: tooltipX,
                  y: tooltipY,
                  data: tooltip,
                });
              }
            }
          }
        }}
        onPointerOut={() => {
          setTooltipData(undefined);
        }}
      >
        {tooltipData != null && (
          <line
            x1={tooltipData.x}
            x2={tooltipData.x}
            y1={margin.top}
            y2={height! - margin.bottom}
            stroke="#e3e3e3"
            strokeDasharray={3}
          />
        )}
        <g id={`${id}-grid-y`} />
        <g id={`${id}-x-axis`} />
        <g className="yAxis">
          {displayIndex && (
            <text
              x={margin.left}
              y={margin.top / 2}
              textAnchor="middle"
              alignmentBaseline="baseline"
              style={{ fontSize: 11 }}
              fill="#666"
            >
              단위 : {yAxisLabel[0] !== '' ? `${yAxisLabel[0]} ` : null}(
              {displayIndex})
            </text>
          )}
          <line
            x1={margin.left}
            x2={margin.left}
            y1={margin.top}
            y2={height! - margin.bottom}
            stroke="black"
          />
          <g id={`${id}-y-axis`} />
        </g>
        <g id={`${id}-bar-area`}>
          {groupType === 'group' &&
            keyList.map((_, i) => (
              <g key={`${id}-group-${i.toString()}`} id={`${id}-group-${i}`} />
            ))}
          {groupType === 'stack' &&
            keyList.map((_, i) => (
              <g key={`${id}-stack-${i.toString()}`} id={`${id}-stack-${i}`} />
            ))}
        </g>
        {keyList.map(key => (
          <linearGradient
            key={`${id}-gradient-${key}`}
            id={`${id}-gradient-${key}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={colorScale(key)} stopOpacity={0.4} />
            <stop offset="100%" stopColor={colorScale(key)} stopOpacity={0} />
          </linearGradient>
        ))}
      </svg>
      {tooltipData != null && (
        <TooltipWithBounds left={tooltipData.x} top={tooltipData.y}>
          {tooltipData.data}
        </TooltipWithBounds>
      )}
    </div>
  );
};

export default withParentSize(BarChart);
