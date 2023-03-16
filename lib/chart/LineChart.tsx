import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { max, min, bisectLeft } from 'd3-array';
import { scaleOrdinal, scaleLinear, scaleBand } from 'd3-scale';
import { area, line, stack } from 'd3-shape';
import { select, pointer } from 'd3-selection';
import { axisBottom, axisLeft } from 'd3-axis';
import { TooltipWithBounds } from '@visx/tooltip';
import type { ComponentType } from 'react';
import type { ScaleBand } from 'd3';
import { makeDisplayNum } from '../util';
import withParentSize from '../hooks/withParentSize';
import type { ChartProps } from '../util';
import '../styles/global.css';

const margin = {
  left: 50,
  top: 50,
  right: 20,
  bottom: 30,
};

interface Props extends ChartProps {
  fill?: boolean;
}

const LineChart: ComponentType<Props> = ({
  data,
  id,
  groupType = 'single',
  colorList,
  maxLimitY,
  minLimitY,
  displayIndex,
  tooltipMaker,
  legendLabelList,
  width,
  height,
  fill,
}) => {
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
        let sum = 0;
        keyList.forEach(k => {
          sum += +d[`${k}`]!;
        });
        yArray.push(sum);
      });
    }
    return yArray;
  }, [groupType, data, keyList]);

  const maxY = useMemo(() => maxLimitY ?? max(yList) ?? 0, [maxLimitY, yList]);

  const minY = useMemo(
    () => (groupType === 'stack' ? 0 : minLimitY ?? min(yList) ?? 0),
    [groupType, minLimitY, yList],
  );

  const xScale: ScaleBand<string> = useMemo(
    () =>
      scaleBand()
        .domain(data.map(d => d.x))
        .range([margin.left, width! - margin.right]),
    [data, width],
  );

  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain([minY, maxY])
        .range([height! - margin.bottom - margin.top, margin.top + 20]),
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
    if (legendList && legendList.length > 0) {
      return (
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translate(-50%, 0)',
          }}
        >
          <ul
            style={{
              display: 'flex',
              gap: '0.75rem',
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
                    fill={(colorList[i] as string) ?? '#e3e3e3'}
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

  const drawSingleLine = useCallback(() => {
    if (fill) {
      const areaScale = area()
        .x(
          (d: { [key: string]: any }) =>
            xScale(d.x)! + (xScale as ScaleBand<string>).bandwidth() / 2,
        )
        .y0(yScale(minY))
        .y1((d: { [key: string]: any }) => yScale(d.y));
      select(`#${id}-single-area`)
        .selectAll('path')
        .data([data])
        .join('path')
        .attr('fill', `url(#${id}-gradient-${keyList[0]})`)
        .attr('d', areaScale as any);
    }

    const lineScale = line()
      .x(
        (d: { [key: string]: any }) =>
          xScale(d.x)! + (xScale as ScaleBand<any>).bandwidth() / 2,
      )
      .y((d: { [key: string]: any }) => yScale(d.y));
    select(`#${id}-single-line`)
      .selectAll('path')
      .data([data])
      .join('path')
      .attr('d', lineScale as any)
      .attr('stroke', colorList[0])
      .attr('stroke-width', 2)
      .attr('fill', 'none');

    return null;
  }, [colorList, data, fill, id, keyList, minY, xScale, yScale]);

  const drawGroupLine = useCallback(() => {
    let areaScale: any;
    if (fill) {
      areaScale = (key: string) =>
        area()
          .x(
            (d: { [key: string]: any }) =>
              (xScale(d.x) as number) +
              (xScale as ScaleBand<any>).bandwidth() / 2,
          )
          .y0(yScale(minY))
          .y1((d: { [key: string]: any }) => yScale(d[key]));
    }

    const lineScale = (key: string) =>
      line()
        .x(
          (d: { [key: string]: any }) =>
            (xScale(d.x) as number) +
            (xScale as ScaleBand<any>).bandwidth() / 2,
        )
        .y((d: { [key: string]: any }) => yScale(d[key]));

    keyList.forEach(key => {
      if (fill) {
        select(`#${id}-${key}-area`)
          .selectAll('path')
          .data([data])
          .join('path')
          .attr('fill', `url(#${id}-gradient-${key})`)
          .attr('d', areaScale(key) as any);
      }

      select(`#${id}-${key}-line`)
        .selectAll('path')
        .data([data])
        .join('path')
        .attr('d', lineScale(key) as any)
        .attr('stroke', colorScale(key))
        .attr('stroke-width', 2)
        .attr('fill', 'none');
    });
  }, [colorScale, data, fill, id, keyList, minY, xScale, yScale]);

  const drawStackLine = useCallback(() => {
    const stackedData = stack().keys(keyList)(data as { [key: string]: any }[]);

    let areaScale: any;
    if (fill) {
      areaScale = () =>
        area()
          .x(
            (d: any) =>
              (xScale(d.data.x) as number) +
              (xScale as ScaleBand<any>).bandwidth() / 2,
          )
          .y0(d => yScale(d[0]))
          .y1(d => yScale(d[1]));
    }

    const lineScale = () =>
      line()
        .x(
          (d: any) =>
            (xScale(d.data.x) as number) +
            (xScale as ScaleBand<any>).bandwidth() / 2,
        )
        .y(d => yScale(d[1]));

    stackedData.forEach(d => {
      if (fill) {
        select(`#${id}-${d.key}-area`)
          .selectAll('path')
          .data([d])
          .join('path')
          .attr('fill', `url(#${id}-gradient-${d.key})`)
          .attr('d', datum => areaScale()(datum as any))
          .attr('stroke', 'none');
      }

      select(`#${id}-${d.key}-line`)
        .selectAll('path')
        .data([d])
        .join('path')
        .attr('d', datum => lineScale()(datum as any))
        .attr('stroke', colorScale(d.key))
        .attr('stroke-width', 2)
        .attr('fill', 'none');
    });
  }, [colorScale, data, fill, id, keyList, xScale, yScale]);

  const grid = useCallback(() => {
    const gridY = axisLeft(yScale)
      .ticks(data.length < 5 ? 3 : 5)
      .tickSize(-width! + margin.left + margin.right)
      .tickFormat(() => '');

    const gridArea = select(`#${id}-grid-y`).attr(
      'transform',
      `translate(${margin.left}, 0)`,
    );
    gridArea.selectAll('*').remove();
    gridArea.call(gridY as any);
    gridArea.selectAll('line').attr('stroke', '#eee');
    gridArea.selectAll('path').attr('stroke', 'none');
  }, [yScale, data.length, width, id]);

  const xAxis = useCallback(() => {
    const divider = data.length <= 5 ? 1 : Math.floor(data.length / 6);
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
    axisArea.call(axis as any);
  }, [xScale, height, id, data.length]);

  const yAxis = useCallback(() => {
    const axis = axisLeft(yScale)
      .ticks(data.length < 5 ? 3 : 5)
      .tickSize(3)
      .tickPadding(5)
      .tickFormat(d => {
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
  }, [yScale, data.length, id, yAxisLabel]);

  useEffect(() => {
    grid();
    xAxis();
    yAxis();
  }, [grid, xAxis, yAxis]);

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

  return (
    <div style={{ position: 'relative' }}>
      {drawLegend()}
      <svg
        width={width}
        height={height}
        onPointerMove={e => {
          const x = pointer(e)[0];
          if (x) {
            const xDomain = data.map(d => xScale(d.x as any)) as number[];
            const index = bisectLeft(xDomain, x) - 1;
            if (data[index]) {
              const tooltipX =
                xScale(data[index].x as any)! +
                (xScale as ScaleBand<any>).bandwidth() / 2;
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
        }}
        onPointerOut={() => {
          setTooltipData(undefined);
        }}
      >
        {tooltipData && (
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
          <text
            x={margin.left}
            y={margin.top - 10}
            textAnchor="middle"
            alignmentBaseline="baseline"
            style={{ fontSize: 11 }}
            fill="#666"
          >
            {`단위 : ${yAxisLabel[0] !== '' ? `${yAxisLabel[0]} ` : ''}
            ${displayIndex ?? ''}`}
          </text>
          <line
            x1={margin.left}
            x2={margin.left}
            y1={margin.top}
            y2={height! - margin.bottom}
            stroke="black"
          />
          <g id={`${id}-y-axis`} />
        </g>
        {groupType === 'single' ? (
          <g>
            {fill && (
              <g id={`${id}-single-area`}>
                <path />
              </g>
            )}
            <g id={`${id}-single-line`}>
              <path />
            </g>
          </g>
        ) : (
          <g>
            {keyList.map(key => (
              <g key={`${id}-${key}`}>
                {fill && (
                  <g id={`${id}-${key}-area`}>
                    <path />
                  </g>
                )}
                <g id={`${id}-${key}-line`}>
                  <path />
                </g>
              </g>
            ))}
          </g>
        )}
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
      {tooltipData && (
        <TooltipWithBounds left={tooltipData.x} top={tooltipData.y}>
          {tooltipData.data}
        </TooltipWithBounds>
      )}
    </div>
  );
};

export default withParentSize(LineChart);
