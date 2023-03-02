import React, { useCallback, useEffect } from "react";
import withParentSize from "../hooks/withParentSize";
import { useMemo } from "react";
import { extent, scaleLog, select } from "d3";
import type { ComponentType } from "react";
import cloud from "d3-cloud";

interface Props {
  /**
   * Data for the chart.
   * Each element of the array should have the following format:
   * {
   *  text: string;
   *  value: number;
   * }
   */
  data: {
    text: string;
    value: number;
  }[];
  /**
   * ID of the chart
   * */
  id: string;
  width?: number;
  height?: number;
  /**
   * Color list for the chart
   * - five colors are used by default
   * - rotate when the number of data points exceeds the number of colors
   * @default ["#0A0908", "#0891b2", "#C6AC8F", "#60D394", "#D1495B", "#9b5de5"]
   */
  colorList?: string[];
  /**
   * Type of the spiral
   * - "rectangular" or "archimedean"
   * @default "rectangular"
   * */
  type?: "rectangular" | "archimedean";
}

const WordCloud: ComponentType<Props> = ({
  data,
  width,
  height,
  id,
  colorList = [
    "#0A0908",
    "#0891b2",
    "#C6AC8F",
    "#60D394",
    "#D1495B",
    "#9b5de5",
  ],
  type = "rectangular",
}) => {
  const fontScale = useMemo(() => {
    return scaleLog()
      .domain(extent(data.map((d) => +d.value)) as [number, number])
      .range([15, 80]);
  }, [data]);

  const colorMap = useMemo(() => {
    const map = new Map();
    data.forEach((d, i) => {
      map.set(d.text, colorList[i % colorList.length]);
    });

    return map;
  }, [colorList, data]);

  const wordData = useMemo(() => {
    return data.map((d) => ({ text: d.text, size: fontScale(d.value) }));
  }, [data, fontScale]);

  const drawChart = useCallback(() => {
    if (width && height) {
      const layout = cloud()
        .size([width!, height!])
        .words(wordData)
        .padding(2)
        .rotate(0)
        .font("Impact")
        .fontSize((d) => d.size)
        .spiral(type)
        .on("end", (words) => {
          select(`#${id}-svg`)
            .attr("transform", `translate(${width! / 2}, ${height! / 2})`)
            .selectAll("text")
            .data(words)
            .join("text")
            .style("font-size", (d) => `${d.size}px`)
            .style("font-family", "Impact")
            .attr("text-anchor", "middle")
            .attr(
              "transform",
              (d) => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`
            )
            .text((d) => d.text)
            .attr("fill", (d) => colorMap.get(d.text))
            .attr("cursor", "pointer")
            .on("mouseover", function (e, d: any) {
              const texts = (
                select(select(e.target).node().parentNode).selectAll(
                  "text"
                ) as any
              )._groups[0];
              for (let text of texts) {
                if (select(text).text() !== d.text) {
                  select(text).transition().attr("opacity", 0.1);
                } else {
                  select(text).attr("opacity", 1);
                }
              }
            })
            .on("mouseleave", function (e, d: any) {
              select(select(e.target).node().parentNode)
                .selectAll("text")
                .transition()
                .attr("opacity", 1);
            });
        });

      layout.start();

      return () => {
        layout.stop();
      };
    }
  }, [colorMap, height, id, type, wordData, width]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div className="h-full w-full select-text">
      <svg width={width} height={height}>
        <g id={`${id}-svg`}></g>
      </svg>
    </div>
  );
};

export default withParentSize(WordCloud);
