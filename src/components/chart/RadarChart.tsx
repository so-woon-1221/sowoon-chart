import { useParentSize } from "../../hooks/useParentSize";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  curveLinearClosed,
  lineRadial,
  max,
  pointer,
  scaleLinear,
  scaleOrdinal,
  select,
} from "d3";
import { useChartTooltip } from "../../hooks/useChartTooltip";
import ChartTooltip from "../common/ChartTooltip";
import type { TooltipPositionMode } from "../../util/types";

type Props = {
  /**
   * Width of the chart.
   */
  width?: number;
  /**
   * Height of the chart.
   */
  height?: number;
  /**
   * Data to display in the chart.
   */
  data: {
    key: string;
    data: {
      x: string;
      y: number;
    }[];
  }[];
  /**
   * List of colors to use for the chart.
   */
  colorList: string[];
  /**
   * Margin of the chart.
   */
  margin?: number;
  /**
   * Children to render in the
   * tooltip when it is open.
   * It will receive the tooltipData
   * as a prop.
   * @param tooltipData - The data of the tooltip.
   * @returns The children to render.
   */
  children?: ({
    tooltipData,
  }: {
    tooltipData: { x: string; y: number };
  }) => React.ReactNode;
  /**
   * Offset of the tooltip from the mouse pointer.
   * @default { x: 10, y: -10 }
   */
  tooltipOffset?: { x: number; y: number };
  /**
   * Tooltip anchor position.
   * `cursor` follows the mouse and `point` sticks to the matched radar point.
   * @default "cursor"
   */
  tooltipPosition?: TooltipPositionMode;
};

const RadarChart = ({
  width,
  height,
  margin = 60,
  data,
  colorList,
  children,
  tooltipOffset = { x: 10, y: -10 },
  tooltipPosition = "cursor",
}: Props) => {
  const { tooltip, showTooltip, hideTooltip } =
    useChartTooltip<{ x: string; y: number }>();

  const {
    ref: parentRef,
    height: parentHeight,
    width: parentWidth,
  } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const color = useMemo(
    () =>
      scaleOrdinal<string, string>()
        .domain(data.map((d) => d.key))
        .range(colorList),
    [colorList, data],
  );

  const axisList = useMemo(() => data[0].data.map((d) => d.x), [data]);

  const angleSlice = useMemo(() => (Math.PI * 2) / data[0].data.length, [data]);

  const maxY = useMemo(() => max(data, (d) => max(d.data, (a) => a.y)), [data]);

  const backLineList = useMemo(() => {
    const list = [];
    for (let i = 0; i < 4; i += 1) {
      const line = [];
      for (let j = 0; j < axisList.length; j += 1) {
        line.push(maxY! * ((i + 1) / 4));
      }
      list.push(line);
    }
    return list;
  }, [axisList.length, maxY]);

  const rScale = useMemo(
    () =>
      scaleLinear()
        .domain([0, maxY!])
        .range([0, Math.min(parentHeight, parentWidth) / 2 - margin]),
    [margin, maxY, parentHeight, parentWidth],
  );

  const radarLine = useMemo(
    () =>
      lineRadial<number>()
        .curve(curveLinearClosed)
        .radius((d) => rScale(d))
        .angle((_, i) => i * angleSlice),
    [angleSlice, rScale],
  );

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select(".chart");
    chartContainer.attr(
      "transform",
      `translate(${parentWidth / 2}, ${parentHeight / 2})`,
    );

    chartContainer
      .selectAll("path.axis")
      .data(backLineList)
      .join("path")
      .attr("class", "axis")
      .attr("d", (d) => radarLine(d))
      .style("fill", "#CDCDCD")
      .style("stroke", "#CDCDCD")
      .style("fill-opacity", 0.1);

    chartContainer
      .selectAll("line")
      .data(axisList)
      .join("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr(
        "x2",
        (_, i) => rScale(maxY! * 1.1) * Math.cos(angleSlice * i - Math.PI / 2),
      )
      .attr(
        "y2",
        (_, i) => rScale(maxY! * 1.1) * Math.sin(angleSlice * i - Math.PI / 2),
      )
      .attr("class", "line")
      .style("stroke", "white")
      .style("stroke-width", "2px");

    chartContainer
      .selectAll("text")
      .data(axisList)
      .join("text")
      .style("font-size", "12px")
      .attr("text-anchor", "middle")
      .attr("font-family", "monospace")
      .attr("dy", "0.35em")
      .attr(
        "x",
        (_, i) => rScale(maxY! * 1.1) * Math.cos(angleSlice * i - Math.PI / 2),
      )
      .attr(
        "y",
        (_, i) => rScale(maxY! * 1.1) * Math.sin(angleSlice * i - Math.PI / 2),
      )
      .text((d) => d);

    chartContainer
      .selectAll("path.data")
      .data(data)
      .join("path")
      .attr("class", "data")
      .attr("d", (d) => radarLine(d.data.map(() => 0)))
      .transition()
      .attr("d", (d) => {
        return radarLine(d.data.map((a) => a.y));
      })
      .attr("fill", (d) => color(d.key))
      .attr("fill-opacity", 0.1)
      .attr("stroke", (d) => color(d.key))
      .attr("stroke-dasharray", (_, i) => (i % 2 === 1 ? "5,5" : "0,0"))
      .attr("stroke-width", 2)
      .attr("pointer-events", "none");

    chartContainer
      .selectAll("g")
      .data(data)
      .join("g")
      .attr("stroke", (d) => color(d.key))
      .attr("fill", (d) => color(d.key))
      .selectAll("circle")
      .data((d) => d.data.map((point, index) => ({ ...point, index })))
      .join("circle")
      .attr("r", 4)
      .attr(
        "cx",
        (d) => rScale(d.y) * Math.cos(angleSlice * d.index - Math.PI / 2),
      )
      .attr(
        "cy",
        (d) => rScale(d.y) * Math.sin(angleSlice * d.index - Math.PI / 2),
      )
      .on("mouseover", (e, d) => {
        const [xPoint, yPoint] = pointer(e, ref.current);
        const pointX =
          parentWidth / 2 +
          rScale(d.y) * Math.cos(angleSlice * d.index - Math.PI / 2);
        const pointY =
          parentHeight / 2 +
          rScale(d.y) * Math.sin(angleSlice * d.index - Math.PI / 2);
        const isPointTooltip = tooltipPosition === "point";
        showTooltip({
          left: isPointTooltip ? pointX : xPoint,
          top: isPointTooltip ? pointY : yPoint,
          data: { x: d.x, y: d.y },
        });
      })
      .on("mouseleave", hideTooltip);
  }, [
    angleSlice,
    axisList,
    backLineList,
    color,
    data,
    hideTooltip,
    maxY,
    parentHeight,
    parentWidth,
    rScale,
    radarLine,
    showTooltip,
    tooltipPosition,
  ]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const keyList = useMemo(() => data.map((d) => d.key), [data]);

  return (
    <div
      ref={parentRef}
      style={{
        width: width ?? "100%",
        height: height ?? "100%",
        position: "relative",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <svg width={"100%"} height={"100%"} ref={ref}>
        <g className={"chart"} />
      </svg>
      {children && tooltip.isOpen && tooltip.data && (
        <ChartTooltip
          left={tooltip.left}
          top={tooltip.top}
          align={tooltipPosition === "point" ? "center" : "cursor"}
          offsetX={tooltipOffset.x}
          offsetY={tooltipOffset.y}
        >
          {children({
            tooltipData: tooltip.data,
          })}
        </ChartTooltip>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          display: "flex",
          gap: "8px",
          fontSize: "14px",
          padding: "4px",
        }}
      >
        {keyList.map((key) => (
          <div
            key={`legend-${key}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <div
              style={{
                width: "14px",
                height: "14px",
                background: color(key) as string,
              }}
            />
            <span>{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RadarChart;
