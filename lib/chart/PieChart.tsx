import React, { useState, useCallback, useMemo } from "react";
// import { select, arc, pie, scaleOrdinal } from "d3";
import { select } from "d3-selection";
import { arc, pie } from "d3-shape";
import { scaleOrdinal } from "d3-scale";
import withParentSize from "../hooks/withParentSize";
import type { ComponentType } from "react";

interface Props {
  /**
   * data
   * - key :
   *   - key of the data
   *   - type: string
   * - value :
   *  - value of the data
   *  - type: number
   */
  data: Array<{ key: string; value: number }>;
  /**
   * List of colors for the graph
   * - Colors are applied in the order of the keyList
   * - If the length of colorList is shorter than that of keyList, the last color in colorList is repeated.
   * - If the length of colorList is longer than that of keyList, the excess part of colorList is ignored.
   */
  colorList: Array<string>;
  width?: number;
  height?: number;
  /**
   * id
   * - id of svg
   */
  id: string;
}

const margin = {
  top: 10,
  bottom: 10,
  left: 10,
  right: 10,
};

const PieChart: ComponentType<Props> = ({
  data,
  colorList,
  width,
  height,
  id,
}) => {
  const [tooltipData, setTooltipData] =
    useState<{
      key: string;
      value: number;
    }>();

  const color = useMemo(() => {
    return scaleOrdinal()
      .domain(data.map((d) => d.key))
      .range(colorList);
  }, [colorList, data]);

  const drawChart = useCallback(() => {
    const pieWidth = width! - margin.left - margin.right;
    const pieHeight = height! - margin.top - margin.bottom;
    // 차트 그리기 ////////////////////////////////////////////////////////////////////
    const radius = Math.min(pieWidth, pieHeight) / 2;
    const arcValue = arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.85)
      .cornerRadius(3)
      .padAngle(0.005);

    const pieGenerator = pie()
      .sort(null)
      .value((d: any) => d.value);

    const chartData = pieGenerator(data as any);

    select(`#${id}-pie-chart`)
      .selectAll("path")
      .data(chartData)
      .join("path")
      .attr(
        "transform",
        `translate(${pieWidth / 2}, ${
          pieHeight! / 2 + margin.top + margin.bottom
        })`
      )
      .attr("fill", (d: any) => {
        return color(d.data.key) as string;
      })
      .attr("stroke", "rgba(0,0,0,0.3)")
      .on("mouseover touchmove", function (_, d: any) {
        select(this)
          .transition()
          .attr(
            "transform",
            `translate(${pieWidth / 2}, ${
              pieHeight! / 2 + margin.top + margin.bottom
            }) scale(1.05)`
          )
          .attr("filter", "drop-shadow(1px 1px 4px rgba(0,0,0,0.4))");
        setTooltipData({ key: d.data.key, value: d.data.value });
      })
      .on("mouseleave touchend", function () {
        select(this)
          .transition()
          .attr(
            "transform",
            `translate(${pieWidth / 2}, ${
              pieHeight! / 2 + margin.top + margin.bottom
            }) scale(1)`
          )
          .attr("filter", "");
        setTooltipData(undefined);
      });
    select(`#${id}-pie-chart`).selectAll("path").attr("d", arcValue);
    /////
    return <g id={`${id}-pie-chart`}></g>;
  }, [color, data, height, id, width]);

  const drawLegend = useCallback(() => {
    return color.domain().map((d: any, i: number) => {
      return (
        <li
          key={`legend-${i}`}
          className="flex items-center gap-1"
          style={{ fontSize: "14px" }}
        >
          <svg width={15} height={15}>
            <rect
              x={0}
              y={0}
              width={15}
              height={15}
              fill={color(d) as string}
            />
          </svg>
          <span>{d}</span>
        </li>
      );
    });
  }, [color]);

  return (
    <div className="flex h-full w-full items-center relative justify-center">
      <div className="flex justify-center overflow-y-auto absolute top-0 left-1/2 -translate-x-1/2 translate-y-1/2">
        <ul
          id={`pie-legend`}
          className="my-auto flex w-full gap-3 overflow-x-auto"
        >
          {drawLegend()}
        </ul>
      </div>
      <div className="relative flex">
        <svg width={width} height={height}>
          {drawChart()}
        </svg>
        {tooltipData && (
          <div className="absolute top-1/2 left-[calc((100%-20px)/2)] -translate-x-[50%] -translate-y-1/2 text-center">
            <div className="flex flex-col space-y-2">
              <span>{tooltipData.key}</span>
              <span>{tooltipData.value}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default withParentSize(PieChart);
