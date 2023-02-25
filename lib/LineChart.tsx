import React from "react";
import { ComponentType, useEffect, useMemo, useState } from "react";
import { LinearGradient } from "@visx/gradient";
import { max, min, bisectLeft } from "d3-array";
import { scaleLinear, scaleOrdinal, scaleTime, scaleBand } from "d3-scale";
import type { ScaleBand, ScaleTime } from "d3-scale";
import { area, line, stack } from "d3-shape";
import { select } from "d3-selection";
import dayjs from "dayjs";
import { GridRows } from "@visx/grid";
import { useCallback } from "react";
import { ScaleType } from "@visx/scale";
import { makeDisplayNum } from "./util";
import { Axis } from "@visx/axis";
import { localPoint } from "@visx/event";
import { TooltipWithBounds } from "@visx/tooltip";
import useMeasure from "react-use-measure";
import "./styles/global.css";

interface Props {
  data: { x: string; [key: string]: string | number | JSX.Element }[];
  id: string;
  xType: ScaleType;
  groupType: "stack" | "group" | "none";
  colorList: string[];
  keyArray?: string[];
  maxLimitY?: number;
  minLimitY?: number;
  displayIndex?: string;
  tooltipMaker?: (d: any) => JSX.Element | undefined;
  legendLabelList?: string[];
  width?: number;
  height?: number;
}

const margin = {
  left: 50,
  top: 30,
  right: 20,
  bottom: 30,
};

const LineChart: ComponentType<Props> = ({
  data,
  id,
  xType = "band",
  groupType = "normal",
  colorList,
  keyArray,
  maxLimitY,
  minLimitY,
  displayIndex = "개",
  tooltipMaker,
  legendLabelList,
  width: propsWidth,
  height: propsHeight,
}) => {
  const [ref, bounds] = useMeasure();

  const width = useMemo(() => {
    return propsWidth ?? bounds.width;
  }, []);

  const height = useMemo(() => {
    return propsHeight ?? bounds.height;
  }, []);
  // y축을 쌓기위한 Key List
  const keyList = useMemo(() => {
    if (!!keyArray) {
      return keyArray;
    } else {
      return Object.keys(data[0]).filter((k) => k !== "x");
    }
  }, [data, keyArray]);

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
        let sum = 0;
        keyList.forEach((k) => {
          sum += +d[`${k}`];
        });
        yArray.push(sum);
      });
    }
    return yArray;
  }, [groupType, data, keyList]);

  const maxY = useMemo(() => {
    return maxLimitY ?? max(yList) ?? 0;
  }, [maxLimitY, yList]);

  const minY = useMemo(() => {
    return minLimitY ?? groupType == "stack" ? 0 : min(yList) ?? 0;
  }, [groupType, minLimitY, yList]);

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
          .range([margin.left, width! - margin.right]);
  }, [data, width, xType]);

  const yScale = useMemo(() => {
    return scaleLinear()
      .domain([minY, maxY])
      .range([height! - margin.bottom - margin.top, margin.top + 20]);
  }, [height, maxY, minY]);

  const yAxisLabel = useMemo(() => {
    return makeDisplayNum(yScale.ticks(data.length < 5 ? 3 : 5));
  }, [data.length, yScale]);

  const [tooltipData, setTooltipData] = useState<
    undefined | { x: number; y: number; data: any }
  >(undefined);

  const drawLegend = useCallback(() => {
    if (legendLabelList && legendLabelList.length > 0) {
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

  const drawSingleLine = useCallback(() => {
    const areaScale = area()
      .x(
        (d: { [key: string]: any }) =>
          xScale(d.x) +
          (xType == "time" ? 0 : (xScale as ScaleBand<any>).bandwidth() / 2)
      )
      .y0(yScale(minY))
      .y1((d: { [key: string]: any }) => yScale(d.y));
    const areaChart = select(`#${id}-single-area`)
      .selectAll("path")
      .data([data])
      .join("path")
      .attr("fill", `url(#${id}-gradient-${keyList[0]})`)
      // .transition()
      .attr("d", areaScale as any);

    const lineScale = line()
      .x(
        (d: { [key: string]: any }) =>
          xScale(d.x) +
          (xType == "time" ? 0 : (xScale as ScaleBand<any>).bandwidth() / 2)
      )
      .y((d: { [key: string]: any }) => yScale(d.y));
    const lineChart = select(`#${id}-single-line`)
      .selectAll("path")
      .data([data])
      .join("path")
      // .transition()
      .attr("d", lineScale as any)
      .attr("stroke", colorList[0])
      .attr("fill", "none");

    return null;
  }, [colorList, data, id, keyList, minY, xScale, xType, yScale]);

  const drawGroupLine = useCallback(() => {
    const areaScale = (key: string) =>
      area()
        .x(
          (d: { [key: string]: any }) =>
            xScale(d.x) +
            (xType == "time" ? 0 : (xScale as ScaleBand<any>).bandwidth() / 2)
        )
        .y0(yScale(minY))
        .y1((d: { [key: string]: any }) => yScale(d[key]));

    const lineScale = (key: string) =>
      line()
        .x(
          (d: { [key: string]: any }) =>
            xScale(d.x) +
            (xType == "time" ? 0 : (xScale as ScaleBand<any>).bandwidth() / 2)
        )
        .y((d: { [key: string]: any }) => yScale(d[key]));

    keyList.forEach((key) => {
      select(`#${id}-group-area-${key}`)
        .selectAll("path")
        .data([data])
        .join("path")
        .attr("fill", `url(#${id}-gradient-${key})`)
        .attr("d", areaScale(key) as any);

      select(`#${id}-group-line-${key}`)
        .selectAll("path")
        .data([data])
        .join("path")
        .attr("d", lineScale(key) as any)
        .attr("stroke", colorScale(key))
        .attr("stroke-width", 2)
        .attr("fill", "none");
    });
  }, [colorScale, data, id, keyList, minY, xScale, xType, yScale]);

  const drawStackLine = useCallback(() => {
    const stackedData = stack().keys(keyList)(data as { [key: string]: any }[]);

    const areaScale = () =>
      area()
        .x((d: any) => {
          return (
            xScale(d.data.x) +
            (xType == "time" ? 0 : (xScale as ScaleBand<any>).bandwidth() / 2)
          );
        })
        .y0((d) => yScale(d[0]))
        .y1((d) => yScale(d[1]));

    const lineScale = () =>
      line()
        .x((d: any) => {
          return (
            xScale(d.data.x) +
            (xType == "time" ? 0 : (xScale as ScaleBand<any>).bandwidth() / 2)
          );
        })
        .y((d) => yScale(d[1]));

    stackedData.forEach((d) => {
      select(`#${id}-stack-area-${d.key}`)
        .selectAll("path")
        .data([d])
        .join("path")
        .attr("fill", `url(#${id}-gradient-${d.key})`)
        .attr("d", (d) => areaScale()(d as any))
        .attr("stroke", "none");

      select(`#${id}-stack-line-${d.key}`)
        .selectAll("path")
        .data([d])
        .join("path")
        .attr("d", (d) => lineScale()(d as any))
        .attr("stroke", colorScale(d.key))
        .attr("stroke-width", 2)
        .attr("fill", "none");
    });
  }, [colorScale, data, id, keyList, xScale, xType, yScale]);

  useEffect(() => {
    switch (groupType) {
      case "none":
        drawSingleLine();
        break;
      case "group":
        drawGroupLine();
        break;
      case "stack":
        drawStackLine();
        break;
    }
  }, [drawGroupLine, drawSingleLine, drawStackLine, groupType]);

  return (
    <div
      className="relative"
      style={{ width: "100%", height: "100%" }}
      ref={ref}
    >
      {drawLegend()}
      <svg
        width={width}
        height={height}
        onPointerMove={(e) => {
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
                groupType == "none" ? yScale(data[index].y as any) : margin.top;
              const tooltipData =
                data[index].tooltipData ??
                (tooltipMaker !== undefined
                  ? tooltipMaker!(data[index].x)
                  : data[index].x);
              setTooltipData({
                x: tooltipX,
                y: tooltipY,
                data: tooltipData,
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
            stroke={"#e3e3e3"}
            strokeDasharray={3}
          />
        )}
        <GridRows
          width={width! - margin.left - margin.bottom}
          left={margin.left}
          scale={yScale}
          numTicks={3}
          stroke={"#e3e3e3"}
        />
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
        <g className={"yAxis"}>
          {displayIndex && (
            <text
              x={margin.left}
              y={margin.top - 10}
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
        {groupType == "none" && (
          <g>
            <g id={`${id}-single-area`}>
              <path />
            </g>
            <g id={`${id}-single-line`}>
              <path />
            </g>
          </g>
        )}
        {groupType == "group" && (
          <g>
            {keyList.map((key, index) => {
              return (
                <g key={`${id}-group-${index}`}>
                  <g id={`${id}-group-area-${key}`}>
                    <path />
                  </g>
                  <g id={`${id}-group-line-${key}`}>
                    <path />
                  </g>
                </g>
              );
            })}
          </g>
        )}
        {groupType == "stack" && (
          <g id={`${id}-stack`}>
            {keyList.map((key, index) => {
              return (
                <g key={`${id}-stack-${index}`}>
                  <g id={`${id}-stack-area-${key}`}>
                    <path />
                  </g>
                  <g id={`${id}-stack-line-${key}`}>
                    <path />
                  </g>
                </g>
              );
            })}
          </g>
        )}
        {keyList.map((key, index) => {
          return (
            <LinearGradient
              key={`${id}-gradient-${key}`}
              id={`${id}-gradient-${key}`}
              from={colorList[index]}
              fromOpacity={0.6}
              to={colorList[index]}
              toOpacity={0}
            />
          );
        })}
      </svg>
      {tooltipData && (
        <TooltipWithBounds left={tooltipData.x} top={margin.top}>
          {tooltipData.data}
        </TooltipWithBounds>
      )}
    </div>
  );
};

export default LineChart;
