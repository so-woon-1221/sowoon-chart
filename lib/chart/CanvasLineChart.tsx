import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ComponentType } from 'react';
import { max, min, bisectLeft } from 'd3-array';
import { scaleOrdinal, scaleLinear, scaleBand } from 'd3-scale';
import type { ScaleBand } from 'd3';
import { line, area, stack } from 'd3-shape';
import { pointer } from 'd3-selection';
import { TooltipWithBounds } from '@visx/tooltip';
import { throttle } from 'lodash';
import { ChartProps, makeDisplayNum } from '../util';
import withParentSize from '../hooks/withParentSize';

const margin = {
  left: 50,
  top: 30,
  right: 20,
  bottom: 30,
};

const LineCanvasChart: ComponentType<ChartProps> = ({
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [gradientList, setGradientList] = useState<
    CanvasGradient[] | undefined
  >(undefined);
  const tooltipLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      setContext(canvasRef.current.getContext('2d'));
    }
  }, []);

  const keyList = useMemo(
    () => Object.keys(data[0]).filter(k => k !== 'x'),
    [data],
  );

  const colorScale = useMemo(
    () => scaleOrdinal<string>().domain(keyList).range(colorList),
    [colorList, keyList],
  );

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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <ul
            className="grid gap-x-2"
            style={{
              gridTemplateColumns: `repeat(${legendList.length}, minmax(0, 1fr))`,
            }}
          >
            {legendList.map((d, i) => (
              <li
                key={`${id}-legend-${d}`}
                className="flex items-center space-x-1"
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

  const grid = useCallback(() => {
    const ticks = yScale.ticks(data.length < 5 ? 3 : 5);
    if (context !== null) {
      context.clearRect(0, 0, width!, height!);
      context.beginPath();
      context.moveTo(margin.left, margin.top);
      ticks.forEach(d => {
        context.moveTo(margin.left, yScale(d));
        context.lineTo(width! - margin.right, yScale(d));
      });
      context.strokeStyle = '#e3e3e3';
      context.lineWidth = 0.5;
      context.stroke();
    }

    return null;
  }, [context, data.length, height, width, yScale]);

  const xAxis = useCallback(() => {
    const divider = data.length <= 5 ? 1 : Math.floor(data.length / 6);
    const tickValues = xScale.domain().filter((_d, i) => i % divider === 0);

    if (context !== null) {
      context.beginPath();
      context.moveTo(margin.left, height! - margin.bottom);
      context.lineTo(width! - margin.right, height! - margin.bottom);
      context.strokeStyle = 'black';
      context.lineWidth = 1;
      context.stroke();

      tickValues.forEach(d => {
        context.beginPath();
        context.moveTo(
          xScale(d)! + xScale.bandwidth() / 2!,
          height! - margin.bottom,
        );
        context.lineTo(
          xScale(d)! + xScale.bandwidth() / 2,
          height! - margin.bottom + 5,
        );
        context.strokeStyle = 'black';
        context.lineWidth = 1;
        context.stroke();

        context.font = '10px Arial';
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.fillText(
          d,
          xScale(d)! + xScale.bandwidth() / 2,
          height! - margin.bottom + 18,
        );
      });
    }
  }, [context, data.length, height, width, xScale]);

  const yAxis = useCallback(() => {
    const ticks = yScale.ticks(data.length < 5 ? 3 : 5);
    const tickFormatter = (d: string | number) => {
      const newTickLabel = +d / +yAxisLabel[1];
      if (+newTickLabel % 1 === 0) {
        return newTickLabel.toLocaleString('ko');
      }
      return '';
    };

    if (context !== null) {
      context.beginPath();
      context.moveTo(margin.left, margin.top);
      context.lineTo(margin.left, height! - margin.bottom);
      context.strokeStyle = 'black';
      context.lineWidth = 1;
      context.stroke();

      ticks.forEach(d => {
        context.beginPath();
        context.moveTo(margin.left, yScale(d));
        context.lineTo(margin.left - 5, yScale(d));
        context.strokeStyle = 'black';
        context.lineWidth = 1;
        context.stroke();

        context.font = '10px Arial';
        context.fillStyle = 'black';
        context.textAlign = 'right';
        context.fillText(tickFormatter(d), margin.left - 10, yScale(d) + 4);
      });

      context.font = '10px Arial';
      context.fillStyle = 'black';
      context.textAlign = 'center';
      context.fillText(
        `단위 : ${yAxisLabel[0] !== '' ? `${yAxisLabel[0]} ` : ''}
      ${displayIndex ?? ''}`,
        margin.left,
        margin.top - 10,
      );
    }
  }, [context, data.length, displayIndex, height, yAxisLabel, yScale]);

  const createGradient = useCallback(() => {
    if (context !== null) {
      const tempGradientList: CanvasGradient[] = [];
      keyList.forEach(d => {
        const gradient = context.createLinearGradient(0, 0, 0, height!);
        gradient.addColorStop(0, `${colorScale(d)}66`);
        gradient.addColorStop(1, `${colorScale(d)}00`);

        tempGradientList.push(gradient);
      });
      setGradientList(tempGradientList);
    }
  }, [colorScale, context, height, keyList]);

  useEffect(() => {
    grid();
    xAxis();
    yAxis();
    createGradient();
  }, [createGradient, grid, xAxis, yAxis]);

  const drawSingleLine = useCallback(() => {
    if (context && gradientList) {
      const lineGenerator = line()
        .x((d: Record<string, any>) => xScale(d.x)! + xScale.bandwidth() / 2)
        .y((d: Record<string, any>) => yScale(d.y)!)
        .context(context);

      context.beginPath();
      lineGenerator(data as any);
      context.strokeStyle = colorScale(data[0].x);
      context.lineWidth = 2;
      context.stroke();

      const areaGenerator = area()
        .x(
          (d: { [key: string]: any }) =>
            xScale(d.x)! + (xScale as ScaleBand<string>).bandwidth() / 2,
        )
        .y0(yScale(minY))
        .y1((d: { [key: string]: any }) => yScale(d.y))
        .context(context);

      context.beginPath();
      areaGenerator(data as any);
      [context.fillStyle] = gradientList;
      context.fill();
    }
  }, [context, data, colorScale, yScale, minY, gradientList, xScale]);

  const drawGroupLine = useCallback(() => {
    if (context && gradientList) {
      const lineGenerator = line()
        .x((d: Record<string, any>) => xScale(d.x)! + xScale.bandwidth() / 2)
        .y((d: Record<string, any>) => yScale(d.y)!)
        .context(context);

      const areaGenerator = area()
        .x(
          (d: { [key: string]: any }) =>
            xScale(d.x)! + (xScale as ScaleBand<string>).bandwidth() / 2,
        )
        .y0(yScale(minY))
        .y1((d: { [key: string]: any }) => yScale(d.y))
        .context(context);

      keyList.forEach((d, i) => {
        context.beginPath();
        lineGenerator(
          data.map(
            e =>
              ({
                x: e.x,
                y: e[d],
              } as any),
          ),
        );
        context.strokeStyle = colorScale(d);
        context.lineWidth = 2;
        context.stroke();

        context.beginPath();
        areaGenerator(
          data.map(
            e =>
              ({
                x: e.x,
                y: e[d],
              } as any),
          ),
        );
        context.fillStyle = gradientList[i];
        context.fill();
      });
    }
  }, [context, yScale, minY, keyList, xScale, data, colorScale, gradientList]);

  const drawStackLine = useCallback(() => {
    if (context && gradientList) {
      const stackedData = stack().keys(keyList)(data as any);

      const lineGenerator = line()
        .x(
          (d: Record<string, any>) =>
            xScale(d.data.x)! + xScale.bandwidth() / 2,
        )
        .y((d: Record<string, any>) => yScale(d[1]))
        .context(context);

      const areaGenerator = area()
        .x(
          (d: { [key: string]: any }) =>
            xScale(d.data.x)! + (xScale as ScaleBand<string>).bandwidth() / 2,
        )
        .y0((d: { [key: string]: any }) => yScale(d[0]))
        .y1((d: { [key: string]: any }) => yScale(d[1]))
        .context(context);

      stackedData.forEach((d, i) => {
        context.beginPath();
        lineGenerator(d as any);
        context.strokeStyle = colorScale(d.key);
        context.lineWidth = 2;
        context.stroke();

        context.beginPath();
        areaGenerator(d as any);
        context.fillStyle = gradientList[i];
        context.fill();
      });
    }
  }, [colorScale, context, data, gradientList, keyList, xScale, yScale]);

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

  const tooltipHandler = useCallback(() => {
    if (canvasRef.current) {
      const moveHandler = throttle((e: MouseEvent) => {
        const x = pointer(e)[0];
        if (x) {
          const xDomain = data.map(d => xScale(d.x as any)) as number[];
          const index = bisectLeft(xDomain, x) - 1;
          if (index < 0 || index >= data.length) {
            setTooltipData(undefined);
          } else if (data[index] && context) {
            const tooltipX =
              xScale(data[index].x as any)! +
              (xScale as ScaleBand<any>).bandwidth() / 2;
            const tooltipY =
              groupType === 'single'
                ? yScale(data[index].y as any)
                : margin.top;
            const tooltip = data[index].tooltipData
              ? data[index].tooltipData
              : tooltipMaker !== undefined
              ? tooltipMaker!(data[index].x)
              : data[index].x;
            setTooltipData({
              x: tooltipX,
              y: tooltipY,
              data: tooltip,
            });
          }
        }
      }, 100);
      const outHandler = () => {
        setTooltipData(undefined);
      };
      canvasRef.current.addEventListener('mousemove', moveHandler);
      canvasRef.current.addEventListener('mouseout', outHandler);
    }
  }, [context, data, groupType, setTooltipData, tooltipMaker, xScale, yScale]);

  useEffect(() => {
    tooltipHandler();
  }, [tooltipHandler]);

  return (
    <div className="relative">
      {drawLegend()}
      <canvas width={width} height={height} ref={canvasRef} />

      {tooltipData && (
        <>
          <TooltipWithBounds left={tooltipData.x} top={tooltipData.y}>
            {tooltipData.data}
          </TooltipWithBounds>
          <div
            ref={tooltipLineRef}
            style={{
              position: 'absolute',
              left: tooltipData.x,
              top: margin.top + 20,
              width: 0,
              height: height! - margin.top - margin.bottom - 20,
              border: '1px dashed #e3e3e3',
              pointerEvents: 'none',
            }}
          />
        </>
      )}
    </div>
  );
};

export default withParentSize(LineCanvasChart);
