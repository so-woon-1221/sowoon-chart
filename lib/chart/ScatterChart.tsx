import React, {
  useMemo,
  useState,
  ComponentType,
  useCallback,
  useEffect,
} from 'react';
import { max } from 'd3-array';
import { scaleBand, ScaleLinear, scaleLinear } from 'd3-scale';
import type { ScaleBand } from 'd3-scale';
import { TooltipWithBounds } from '@visx/tooltip';
import { select } from 'd3-selection';
import { axisBottom, axisLeft } from 'd3-axis';
import { makeDisplayNum } from '../util';
import withParentSize from '../hooks/withParentSize';

const margin = {
  left: 40,
  top: 30,
  right: 30,
  bottom: 30,
};

interface Props {
  data: {
    x: string | number;
    [key: string]: number | string | JSX.Element | undefined;
    tooltipData?: JSX.Element;
  }[];
  id: string;
  width?: number;
  height?: number;
  colorList: string[];
  // 단위의 명, 개 등을 지정
  displayYIndex?: string;
  displayXIndex?: string;
  tooltipMaker?: (x: string) => JSX.Element;
  xType?: 'string' | 'number';
}

const Scatter: ComponentType<Props> = ({
  data,
  id,
  width,
  height,
  colorList,
  displayYIndex,
  displayXIndex,
  tooltipMaker,
  xType = 'string',
}) => {
  const [tooltipData, setTooltipData] = useState<
    undefined | { x: number; y: number; data: any }
  >(undefined);

  const keyList = useMemo(
    () => Object.keys(data[0]).filter(k => k !== 'x' && k !== 'tooltipData'),
    [data],
  );

  //   const minY = useMemo(() => {
  //     const rest = data.map(({ x, ...r }) => Object.values(r));
  //     return min(rest as any, (d: number[]) => max(d, (a: number) => a));
  //   }, [data]);

  const maxY = useMemo(() => {
    const rest = data.map(({ x, ...r }) => Object.values(r));
    return max(rest as any, (d: number[]) => max(d, (a: number) => a));
  }, [data]);

  const xScale = useMemo(() => {
    switch (xType) {
      case 'number':
        return scaleLinear()
          .domain([0, max(data.map(d => d.x as number)) ?? 0])
          .range([margin.left, width! - margin.right]);
      default:
        return scaleBand()
          .domain(data.map(d => d.x as string))
          .range([margin.left, width! - margin.right]);
    }
  }, [data, width, xType]);
  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain([0, maxY as number])
        .range([height! - margin.bottom, margin.top + 20]),
    [height, maxY],
  );

  const yAxisLabel = useMemo(
    () => makeDisplayNum(yScale.ticks(data.length < 5 ? 3 : 5)),
    [data.length, yScale],
  );

  const grid = useCallback(() => {
    const gridY = axisLeft(yScale)
      .ticks(data.length < 5 ? 3 : 5)
      .tickSize(-width! + margin.left + margin.right)
      .tickFormat(() => '');

    const gridArea = select(`#${id}-grid-y`).attr(
      'transform',
      `translate(${margin.left}, 0)`,
    );
    gridArea.selectAll('line').attr('stroke', '#eee');
    gridArea.selectAll('path').attr('stroke', 'none');
    gridArea.call(gridY as any);
  }, [yScale, data.length, width, id]);

  const xAxis = useCallback(() => {
    let axis: any;
    if (xType === 'number') {
      axis = axisBottom(xScale as ScaleLinear<number, number>)
        .ticks(data.length < 5 ? 3 : 5)
        .tickSize(3)
        .tickPadding(5)
        .tickFormat(d => d.toString());
    } else {
      const divider = data.length <= 5 ? 1 : Math.floor(data.length / 6);
      axis = axisBottom(xScale as ScaleBand<string>)
        .tickSize(3)
        .tickValues(
          (xScale.domain() as string[]).filter((_d, i) => i % divider === 0),
        )
        .tickPadding(5)
        .tickFormat(d => d as unknown as string);
    }

    const axisArea = select(`#${id}-x-axis`).attr(
      'transform',
      `translate(0, ${height! - margin.bottom})`,
    );
    axisArea.selectAll('path').attr('stroke', 'black');
    axisArea.call(axis as any);
  }, [xType, data.length, xScale, id, height]);

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

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <svg width={width} height={height}>
        <g id={`${id}-grid-y`} />
        <g id={`${id}-x-axis`}>
          {displayXIndex && (
            <text
              x={width! - margin.right}
              y={height! - margin.bottom + 20}
              textAnchor="middle"
              alignmentBaseline="baseline"
              style={{ fontSize: 11 }}
              fill="#666"
            >
              단위 : ({displayXIndex})
            </text>
          )}
        </g>
        <g className="yAxis">
          <g id={`${id}-y-axis`} />
          {displayYIndex && (
            <text
              x={margin.left}
              y={margin.top - 10}
              textAnchor="middle"
              alignmentBaseline="baseline"
              style={{ fontSize: 11 }}
              fill="#666"
            >
              단위 : {yAxisLabel[0] !== '' ? `${yAxisLabel[0]} ` : null}(
              {displayYIndex})
            </text>
          )}
          <line
            x1={margin.left}
            x2={margin.left}
            y1={margin.top}
            y2={height! - margin.bottom}
            stroke="black"
          />
        </g>
        <g>
          {keyList.map((k, i) => (
            <g key={`${id}-scatter-${k}`}>
              {data.map((a, j) => (
                <circle
                  key={`${id}-scatter-${a.x}-${j.toString()}`}
                  cx={
                    xScale(a.x as any)! +
                    (xType === 'string'
                      ? (xScale as ScaleBand<string>).bandwidth() / 2
                      : 0)
                  }
                  cy={yScale(a[k] as number)}
                  r={6}
                  stroke={colorList[i]}
                  fill={colorList[i]}
                  fillOpacity={0.5}
                  onPointerOver={() => {
                    let nowTooltip: any;
                    if (tooltipMaker !== undefined) {
                      nowTooltip = tooltipMaker!(a.x.toString());
                    } else {
                      nowTooltip = a.tooltipData ?? '';
                    }
                    setTooltipData({
                      x: xScale(a.x as any) ? xScale(a.x as any)! + 5 : 0,
                      y: yScale(a[k] as number) + 5,
                      data: nowTooltip,
                    });
                  }}
                  onPointerOut={() => {
                    setTooltipData(undefined);
                  }}
                  className={`${id}-scatter-${k}`}
                />
              ))}
              )
            </g>
          ))}
        </g>
      </svg>
      {tooltipData && (
        <TooltipWithBounds left={tooltipData.x} top={tooltipData.y}>
          {tooltipData.data}
        </TooltipWithBounds>
      )}
    </div>
  );
};

export default withParentSize(Scatter);
