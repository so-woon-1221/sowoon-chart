import React from "react";
import withParentSize from "../hooks/withParentSize";
import { makeDisplayNum } from "../util";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  bisectLeft,
  max,
  scaleOrdinal,
  scaleLinear,
  scaleBand,
  select,
  stack,
  pointer,
  axisBottom,
  axisLeft,
} from "d3";
import { TooltipWithBounds } from "@visx/tooltip";
import type { ChartProps } from "../types";
import type { ComponentType } from "react";
import type { ScaleBand } from "d3";
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
  // xType = "band",
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

  const xScale: ScaleBand<string> = useMemo(() => {
    return scaleBand()
      .domain(data.map((d) => d.x as string))
      .range([margin.left, width! - margin.right])
      .padding(0.2);
    // return xType == "time"
    //   ? scaleTime()
    //       .domain([
    //         dayjs(min(data.map((d) => d.x as Date))),
    //         dayjs(max(data.map((d) => d.x as Date))),
    //       ])
    //       .range([margin.left, width! - margin.right])
    //   : scaleBand()
    //       .domain(data.map((d) => d.x as string))
    //       .range([margin.left, width! - margin.right])
    //       .padding(0.2);
  }, [data, width]);

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
      // .attr("fill", `url(#${id}-gradient-${keyList[0]})`)
      .attr("fill", (d) => colorScale(keyList[0]) ?? "#e3e3e3")
      .attr("x", (d) => (xScale as ScaleBand<any>)(d.x))
      .attr("y", (d) => yScale(d[keyList[0]] as number))
      .attr(
        "height",
        (d) => height! - margin.bottom - yScale(d[keyList[0]] as number)
      )
      .attr("width", (xScale as ScaleBand<any>).bandwidth());
  }, [data, height, id, keyList, xScale, yScale]);

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
        .attr("x", (d) => xScale(d.x) + zScale(k))
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
          return xScale(d.data.x as unknown as string);
        })
        .attr("y", (d) => yScale(d[1]))
        .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
        .attr("width", (xScale as ScaleBand<any>).bandwidth());
    });
  }, [colorScale, data, id, keyList, xScale, yScale]);

  const grid = useCallback(() => {
    const gridY = axisLeft(yScale)
      .ticks(data.length < 5 ? 3 : 5)
      .tickSize(-width + margin.left + margin.right)
      .tickFormat(() => "");

    const gridArea = select(`#${id}-grid-y`).attr(
      "transform",
      `translate(${margin.left}, 0)`
    );
    gridArea.selectAll("line").attr("stroke", "#eee");
    gridArea.selectAll("path").attr("stroke", "none");
    gridArea.call(gridY as any);
  }, [yScale, width, id, data.length]);

  const xAxis = useCallback(() => {
    let axis: any;

    const divider = Math.floor(data.length / 6);
    axis = axisBottom(xScale)
      .tickSize(3)
      .tickValues(xScale.domain().filter((d, i) => !(i % divider)))
      .tickPadding(5)
      .tickFormat((d) => {
        return d;
      });

    const axisArea = select(`#${id}-x-axis`).attr(
      "transform",
      `translate(0, ${height - margin.bottom})`
    );
    axisArea.selectAll("path").attr("stroke", "black");
    axisArea.call(axis as any);
  }, [xScale, height, id, data.length]);

  const yAxis = useCallback(() => {
    const axis = axisLeft(yScale)
      .ticks(data.length < 5 ? 3 : 5)
      .tickSize(3)
      .tickPadding(5)
      .tickFormat((d) => {
        const newTickLabel = +d / +yAxisLabel[1];
        if (+newTickLabel % 1 == 0) {
          return newTickLabel.toLocaleString("ko");
        }
      });

    const axisArea = select(`#${id}-y-axis`).attr(
      "transform",
      `translate(${margin.left}, 0)`
    );
    axisArea.selectAll("path").attr("display", "none");
    axisArea.call(axis as any);
  }, [yScale, id, data.length, yAxisLabel]);

  useEffect(() => {
    grid();
    xAxis();
    yAxis();
  }, [grid, xAxis, yAxis]);

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
            const x = pointer(e)[0];
            if (x) {
              const xDomain = data.map((d) => xScale(d.x as any));
              const index = bisectLeft(xDomain, x) - 1;
              if (data[index]) {
                const tooltipX = xScale(data[index].x) + xScale.bandwidth() / 2;
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
            stroke={"#e3e3e3"}
            strokeDasharray={3}
          />
        )}
        <g id={`${id}-grid-y`} />
        <g id={`${id}-x-axis`} />
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
          <g id={`${id}-y-axis`} />
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
        {keyList.map((key) => {
          return (
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
