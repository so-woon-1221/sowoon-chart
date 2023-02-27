import React from "react";
import withParentSize from "../hooks/withParentSize";
import { makeDisplayNum } from "../util";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { bisectLeft, max, min } from "d3-array";
import { scaleOrdinal, scaleLinear, scaleTime, scaleBand } from "d3-scale";
import { select } from "d3-selection";
import { stack } from "d3-shape";
import { Axis } from "@visx/axis";
import { GridRows } from "@visx/grid";
import { TooltipWithBounds } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { LinearGradient } from "@visx/gradient";
import type { ChartProps } from "../types";
import type { ComponentType } from "react";
import type { ScaleBand, ScaleTime } from "d3-scale";
import "../styles/global.css";

const margin = {
  left: 50,
  top: 50,
  right: 20,
  bottom: 30,
};
const BarChart: ComponentType<ChartProps> = ({
  data,
  id,
  width,
  height,
  xType = "band",
  groupType = "single",
  colorList,
  maxLimitY,
  minLimitY,
  displayIndex = "개",
  tooltipMaker,
  legendLabelList,
}) => {
  // y축을 쌓기위한 key List
  const keyList = useMemo(() => {
    return Object.keys(data[0]).filter((k) => k !== "x");
  }, [data]);

  const colorScale = scaleOrdinal<string>().domain(keyList).range(colorList);

  const yList = useMemo(() => {
    const yArray: number[] = [];
    if (groupType !== "stack") {
      data.forEach((d) => {
        keyList.forEach((k) => {
          yArray.push(+d[`${k}`]);
        });
      });
    } else {
      data.forEach((d) => {
        let sum = keyList.reduce((acc, k) => {
          return acc + +d[`${k}`];
        }, 0);
        yArray.push(sum);
      });
    }
    return yArray;
  }, [groupType, data, keyList]);

  const maxY = useMemo(() => {
    return maxLimitY ?? max(yList) ?? 0;
  }, [maxLimitY, yList]);

  const minY = useMemo(() => {
    return minLimitY ?? 0;
  }, [minLimitY]);

  const xScale: ScaleTime<any, any, any> | ScaleBand<any> = useMemo(() => {
    return xType == "time"
      ? scaleTime()
          .domain([
            dayjs(min(data.map((d) => d.x)), "YYYYMMDD").toDate(),
            dayjs(max(data.map((d) => d.x)), "YYYYMMDD").toDate(),
          ])
          .range([margin.left, width! - margin.right])
      : scaleBand()
          .domain(data.map((d) => d.x))
          .range([margin.left, width! - margin.right])
          .padding(0.2);
  }, [data, width, xType]);

  const yScale = useMemo(() => {
    return scaleLinear()
      .domain([minY, maxY])
      .range([height! - margin.bottom, margin.top]);
  }, [height, maxY, minY]);

  const yAxisLabel = useMemo(() => {
    return makeDisplayNum(yScale.ticks(data.length < 5 ? 3 : 5));
  }, [data.length, yScale]);

  const [tooltipData, setTooltipData] =
    useState<undefined | { x: number; y: number; data: any }>(undefined);

  const drawLegend = useCallback(() => {
    if (legendLabelList && legendLabelList.length > 1) {
      return (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <ul
            className="grid gap-x-2"
            style={{
              gridTemplateColumns: `repeat(${legendLabelList.length}, minmax(0, 1fr))`,
            }}
          >
            {legendLabelList.map((d, i) => {
              return (
                <li
                  key={`${id}-legend-${i}`}
                  className="flex items-center space-x-1"
                >
                  <svg width={15} height={15}>
                    <rect
                      x={0}
                      y={0}
                      width={15}
                      height={15}
                      fill={(colorList[i] as string) ?? "#e3e3e3"}
                    />
                  </svg>
                  <span>{d}</span>
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
  }, [colorList, id, legendLabelList]);

  /**
   * groupType이 none일때 차트 그리기
   */
  const drawSingleBar = useCallback(() => {
    const chartArea = select(`#${id}-bar-area`);

    chartArea
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("fill", `url(#${id}-gradient-${keyList[0]})`)
      .attr("x", (d) => xScale(d.x as unknown as number | Date))
      .attr("y", (d) => yScale(d[keyList[0]] as number))
      .attr(
        "height",
        (d) => height! - margin.bottom - yScale(d[keyList[0]] as number)
      )
      .attr(
        "width",
        xType == "band" ? (xScale as ScaleBand<any>).bandwidth() : 20
      );
  }, [data, height, id, keyList, xScale, xType, yScale]);

  /**
   * groupType이 group일때 차트 그리기
   */
  const drawGroupBar = useCallback(() => {
    const chartArea = select(`#${id}-bar-area`);

    const zDomain = keyList.map((d) => d);
    const zScale = scaleBand()
      .domain(zDomain)
      .range([0, (xScale as ScaleBand<string>).bandwidth()])
      .padding(0.1);
    const zColorScale = scaleOrdinal<string>().domain(zDomain).range(colorList);

    keyList.forEach((k, i) => {
      chartArea
        .select(`g#${id}-group-${i}`)
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("fill", zColorScale(k))
        .attr("x", (d) => xScale(d.x as unknown as number | Date) + zScale(k))
        .attr("y", (d) => yScale(d[k] as number))
        .attr("height", (d) => height! - margin.bottom - yScale(d[k] as number))
        .attr("width", zScale.bandwidth());
    });
  }, [colorList, data, height, id, keyList, xScale, yScale]);

  /**
   * groupType이 stack일때 차트 그리기
   */
  const drawStackBar = useCallback(() => {
    const stackedData = stack().keys(keyList)(
      data as { [key: string]: number }[]
    );

    const chartArea = select(`#${id}-bar-area`);

    stackedData.forEach((k, i) => {
      chartArea
        .select(`g#${id}-stack-${i}`)
        .attr("fill", colorScale(k.key))
        .selectAll("rect")
        .data(k)
        .join("rect")
        .attr("x", (d) => {
          return xScale(d.data.x);
        })
        .attr("y", (d) => yScale(d[1]))
        .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
        .attr("width", (xScale as ScaleBand<any>).bandwidth());
    });
  }, [colorScale, data, id, keyList, xScale, yScale]);

  useEffect(() => {
    switch (groupType) {
      case "single":
        drawSingleBar();
        break;
      case "stack":
        drawStackBar();
        break;
      case "group":
        drawGroupBar();
        break;
      default:
        break;
    }
  }, [drawGroupBar, drawSingleBar, drawStackBar, groupType]);

  return (
    <div className="relative" style={{ width: width, height: height }}>
      {drawLegend()}
      <svg
        width={width}
        height={height}
        onPointerMove={(e) => {
          if (tooltipMaker) {
            const x = localPoint(e)?.x;
            if (x) {
              const xDomain = data.map((d) => xScale(d.x as any));
              const index = bisectLeft(xDomain, x) - 1;
              if (data[index]) {
                const tooltipX =
                  xScale(data[index].x as any) +
                  (xType == "time"
                    ? 0
                    : (xScale as ScaleBand<any>).bandwidth() / 2);
                const tooltipY =
                  groupType == "single"
                    ? yScale(data[index].y as any)
                    : margin.top;
                const tooltipData =
                  data[index].tooltipData ?? tooltipMaker!(data[index].x);
                setTooltipData({ x: tooltipX, y: tooltipY, data: tooltipData });
              }
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
            stroke={"#e3e3e3" }
            strokeDasharray={3}
          />
        )}
        <GridRows
          width={width! - margin.left - margin.right}
          left={margin.left}
          scale={yScale}
          numTicks={3}
          stroke={"#e3e3e3" }
        />
        {/* xAxis */}
        <Axis
          scale={xScale}
          orientation={"bottom"}
          top={height! - margin.bottom}
          stroke={"black"}
          tickLabelProps={() => ({
            textAnchor: "middle",
            fill: "black",
          })}
          tickLineProps={{
            stroke: "black",
          }}
          numTicks={width! < 500 ? 2 : 4}
        />
        {/* yAxis */}
        <g className={"yAxis"}>
          {displayIndex && (
            <text
              x={margin.left}
              y={margin.top / 2}
              textAnchor={"middle"}
              alignmentBaseline={"baseline"}
              style={{ fontSize: 11 }}
              fill={"#666"}
            >
              단위 : {yAxisLabel[0] !== "" ? `${yAxisLabel[0]} ` : null}(
              {displayIndex})
            </text>
          )}
          <line
            x1={margin.left}
            x2={margin.left}
            y1={margin.top}
            y2={height! - margin.bottom}
            stroke={"black"}
          />
          <Axis
            scale={yScale}
            orientation={"left"}
            left={margin.left}
            tickFormat={(d) => {
              const newTickLabel = +d / +yAxisLabel[1];
              if (+newTickLabel % 1 == 0) {
                return newTickLabel.toLocaleString("ko");
              }
            }}
            numTicks={data.length < 5 ? 3 : 5}
            strokeWidth={0}
            tickLabelProps={() => ({
              textAnchor: "end",
              fill: "black",
            })}
          />
        </g>
        <g id={`${id}-bar-area`}>
          {groupType == "group" &&
            keyList.map((_, i) => {
              return <g key={`${id}-group-${i}`} id={`${id}-group-${i}`} />;
            })}
          {groupType == "stack" &&
            keyList.map((_, i) => (
              <g key={`${id}-stack-${i}`} id={`${id}-stack-${i}`} />
            ))}
        </g>
        {keyList.map((key, index) => {
          return (
            <LinearGradient
              key={`${id}-gradient-${key}`}
              id={`${id}-gradient-${key}`}
              from={colorList[index]}
              fromOpacity={1}
              to={colorList[index]}
              toOpacity={0.4}
            />
          );
        })}
      </svg>
      {tooltipData && (
        <TooltipWithBounds
          left={tooltipData.x}
          top={tooltipData.y}
          className={"dark:bg-zinc-900"}
        >
          {tooltipData.data}
        </TooltipWithBounds>
      )}
    </div>
  );
};

export default withParentSize(BarChart);
