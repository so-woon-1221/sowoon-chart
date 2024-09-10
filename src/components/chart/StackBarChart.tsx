import AxisBottom from "../common/AxisBottom.tsx";
import {
  type AxisDomain,
  type AxisScale,
  bisectCenter,
  pointer,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  select,
  stack,
} from "d3";
import AxisLeft from "../common/AxisLeft.tsx";
import { useParentSize } from "../../hooks/useParentSize.tsx";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { defaultStyles, useTooltip, useTooltipInPortal } from "@visx/tooltip";
import { mergeRefs } from "../../util/utils.ts";
import { type ChartProps } from "../../util/types.ts";

type DataType = {
  x: string;
  [key: string]: number | string;
};

type Props = Omit<ChartProps, "data" | "color"> & {
  /**
   * Data to display in the chart.
   */
  data: DataType[];
  /**
   * List of colors to use for the chart.
   * It will be used in order for each data.
   */
  colorList: string[];
  /**
   * Gap between the bars.
   */
  padding?: number;
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
};

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50,
};

const StackBarChart = ({
  width,
  height,
  margin = defaultMargin,
  data,
  colorList = [
    "#98abc5",
    "#8a89a6",
    "#7b6888",
    "#6b486b",
    "#a05d56",
    "#d0743c",
    "#ff8c00",
  ],
  maxY,
  padding = 0.1,
  children,
  tooltipOffset = { x: 10, y: -10 },
}: Props) => {
  const {
    showTooltip,
    tooltipOpen,
    tooltipData,
    tooltipLeft,
    tooltipTop,
    hideTooltip,
  } = useTooltip();
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    detectBounds: true,
  });

  const {
    ref: parentRef,
    height: parentHeight,
    width: parentWidth,
  } = useParentSize();

  const parent = mergeRefs(containerRef, parentRef);

  const ref = useRef<SVGSVGElement>(null);

  const keyList = useMemo(
    () => Object.keys(data[0]).filter((key) => key !== "x"),
    [data],
  );

  const max = useMemo(() => {
    if (maxY) {
      return maxY;
    }
    return Math.max(
      ...data.map((d) =>
        keyList.reduce((acc, key) => acc + (d[key] as number), 0),
      ),
    );
  }, [data, keyList, maxY]);

  const colorScale = useMemo(() => {
    return scaleOrdinal()
      .domain(data.map((d) => d.x))
      .range(colorList);
  }, [data, colorList]);

  const series = useMemo(() => {
    return stack<DataType>()
      .keys(keyList)
      .value((d, key) => (d[key] as number) ?? 0)(data);
  }, [data, keyList]);

  const x = useMemo(
    () =>
      scaleBand()
        .domain(data.map((d) => d.x))
        .range([margin.left, (parentWidth ?? 0) - margin.right])
        .padding(padding),
    [data, margin.left, margin.right, padding, parentWidth],
  );

  const y = useMemo(
    () =>
      scaleLinear()
        .domain([0, max])
        .range([(parentHeight ?? 0) - margin.bottom, margin.top]),
    [margin.bottom, margin.top, max, parentHeight],
  );

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select(".chart");

    const barGroup = chartContainer
      .selectAll("g")
      .data(series)
      .join("g")
      .attr("fill", (d) => colorScale(d.key) as string);
    barGroup
      .selectAll("rect")
      .data((d) => d)
      .join("rect")
      .attr("x", (d) => x(d.data.x)!)
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .on("mousemove", (e, d) => {
        let [xPoint] = pointer(e);
        xPoint = xPoint - x.bandwidth() / 2;
        const xDomain = data.map((d) => x(d.x) as number);
        const index = Math.max(
          0,
          Math.min(xDomain.length - 1, bisectCenter(xDomain, xPoint)),
        );

        const point = data[index];
        if (point) {
          showTooltip({
            tooltipData: { x: d.data.x, y: d[1] - d[0] },
            tooltipLeft: x(point.x)! + x.bandwidth() / 2 + tooltipOffset.x,
            tooltipTop: y(d[1]) + tooltipOffset.y,
          });
        }
      })
      .on("mouseout", hideTooltip);
  }, [
    colorScale,
    data,
    hideTooltip,
    series,
    showTooltip,
    tooltipOffset.x,
    tooltipOffset.y,
    x,
    y,
  ]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div
      ref={parent}
      style={{
        width: width ?? "100%",
        height: height ?? "100%",
        position: "relative",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <svg width={"100%"} height={"100%"} ref={ref}>
        <AxisBottom
          scale={x as AxisScale<AxisDomain>}
          top={(parentHeight ?? 0) - margin.bottom}
        />
        <AxisLeft scale={y as AxisScale<AxisDomain>} left={margin.left} />
        <g className="chart" />
      </svg>
      {children && tooltipOpen && (
        <TooltipInPortal
          left={tooltipLeft}
          top={tooltipTop}
          style={{
            ...defaultStyles,
            background: "transparent",
            border: "none",
            boxShadow: "none",
            padding: 0,
          }}
        >
          {children({
            tooltipData: tooltipData as {
              x: string;
              y: number;
            },
          })}
        </TooltipInPortal>
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
                background: colorScale(key) as string,
              }}
            />
            <span>{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StackBarChart;
