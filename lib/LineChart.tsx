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
import "./styles/global.css";
import withParentSize from "./hooks/withParentSize";

export interface LineChartProps {
  /**
   * data
   * - x :
   *   - data that will be displayed on the x-axis
   *   - type : string
   * - The values on the y-axis can be freely named keys with numeric values.
   */
  data: { [key: string]: string | number; x: string }[];
  /**
   * id
   * - id of svg
   */
  id: string;
  /**
   * scale type of x-axis
   * - band : bandScale
   * - time : timeScale
   * - linear : linearScale
   * - default : bandScale
   * @default band
   * @type ScaleType
   */
  xType?: ScaleType;
  /**
   * type of group
   * - stack : stacked graph
   * - group : group graph
   * - single : single graph
   * @default single
   * @type "stack" | "group" | "single"
   */
  groupType?: "stack" | "group" | "single";
  /**
   * List of colors for the graph
   * - Colors are applied in the order of the keyList
   * - If the length of colorList is shorter than that of keyList, the last color in colorList is repeated.
   * - If the length of colorList is longer than that of keyList, the excess part of colorList is ignored.
   * @default ["#000000"]
   * @type string[]
   * @example
   * colorList = ["#000000", "#ffffff"]
   * keyList = ["y1", "y2"]
   * => y1 : #000000, y2 : #ffffff
   */
  colorList: string[];
  /**
   * max value of y-axis
   * - max value of y-axis can be specified
   * - If not specified, the smallest value of y-axis is specified as the smallest value of y-axis.
   * @default undefined
   * @type number
   */
  maxLimitY?: number;
  /**
   * min value of y-axis
   * - min value of y-axis can be specified
   * - If not specified, the smallest value of y-axis is specified as the smallest value of y-axis.
   * - If groupType is stack, minLimitY is 0.
   * @default undefined
   * @type number
   */
  minLimitY?: number;
  /**
   * unit of y-axis
   * - unit of y-axis can be specified
   * - If not specified, the unit is not displayed.
   */
  displayIndex?: string;
  /**
   * function that returns tooltip
   * @param d : x value of mouseover
   */
  tooltipMaker?: (d: string) => JSX.Element | string | undefined;
  /**
   * legend label list
   * - legend label list can be specified
   * - If not specified, keyList is used.
   * @default keyList
   * @type string[]
   */
  legendLabelList?: string[];
  /**
   * width
   * - width of svg
   * - If not specified, the width of the parent component is used.
   * @default undefined
   * @type number
   */
  width?: number;
  /**
   * height
   * - height of svg
   * - If not specified, the height of the parent component is used.
   * @default undefined
   * @type number
   */
  height?: number;
}

const margin = {
  left: 50,
  top: 30,
  right: 20,
  bottom: 30,
};

const LineChart: ComponentType<LineChartProps> = ({
  data,
  id,
  xType = "band",
  groupType = "single",
  colorList,
  maxLimitY,
  minLimitY,
  displayIndex,
  tooltipMaker,
  legendLabelList,
  width,
  height,
}) => {
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
    return groupType == "stack" ? 0 : minLimitY ?? min(yList) ?? 0;
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

  const [tooltipData, setTooltipData] =
    useState<undefined | { x: number; y: number; data: any }>(undefined);

  const drawLegend = useCallback(() => {
    const legendList = legendLabelList ?? keyList;
    if (legendList && legendList.length > 0) {
      return (
        <div className="absolute top-0 -translate-x-1/2 translate-y-1/2 left-1/2">
          <ul
            className="grid gap-x-2"
            style={{
              gridTemplateColumns: `repeat(${legendList.length}, minmax(0, 1fr))`,
            }}
          >
            {legendList.map((d, i) => {
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
      select(`#${id}-${key}-area`)
        .selectAll("path")
        .data([data])
        .join("path")
        .attr("fill", `url(#${id}-gradient-${key})`)
        .attr("d", areaScale(key) as any);

      select(`#${id}-${key}-line`)
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
      select(`#${id}-${d.key}-area`)
        .selectAll("path")
        .data([d])
        .join("path")
        .attr("fill", `url(#${id}-gradient-${d.key})`)
        .attr("d", (d) => areaScale()(d as any))
        .attr("stroke", "none");

      select(`#${id}-${d.key}-line`)
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
      case "single":
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
    <div className="relative">
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
                groupType == "single"
                  ? yScale(data[index].y as any)
                  : margin.top;
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
          <text
            x={margin.left}
            y={margin.top - 10}
            textAnchor={"middle"}
            alignmentBaseline={"baseline"}
            style={{ fontSize: 11 }}
            fill={"#666"}
          >
            <>
              단위 : {yAxisLabel[0] !== "" ? `${yAxisLabel[0]} ` : null}
              {displayIndex && { displayIndex }}
            </>
          </text>
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
        {groupType == "single" ? (
          <g>
            <g id={`${id}-single-area`}>
              <path />
            </g>
            <g id={`${id}-single-line`}>
              <path />
            </g>
          </g>
        ) : (
          <g>
            {keyList.map((key) => {
              return (
                <g key={`${id}-${key}`}>
                  <g id={`${id}-${key}-area`}>
                    <path />
                  </g>
                  <g id={`${id}-${key}-line`}>
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

export default withParentSize(LineChart);
