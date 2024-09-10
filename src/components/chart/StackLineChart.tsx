import AxisBottom from "../common/AxisBottom.tsx";
import {
  type AxisDomain,
  type AxisScale,
  bisectCenter,
  bisectLeft,
  type Line,
  line,
  pointer,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  select,
  stack,
} from "d3";
import AxisLeft from "../common/AxisLeft.tsx";
import { useParentSize } from "../../hooks/useParentSize.tsx";
import {
  type PointerEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
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
   * It will be used in order for
   * each data.
   */
  colorList: string[];
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

const StackLineChart = ({
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
  minY,
  children,
  tooltipOffset = { x: 20, y: -20 },
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

  const min = useMemo(() => {
    if (minY) {
      return minY;
    }
    const list = keyList.map((key) => {
      return Math.min(...data.map((d) => d[key] as number));
    });
    return Math.min(...list);
  }, [data, keyList, minY]);

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
        .range([margin.left, (parentWidth ?? 0) - margin.right]),
    [data, margin.left, margin.right, parentWidth],
  );

  const y = useMemo(
    () =>
      scaleLinear()
        .domain([min, max])
        .range([(parentHeight ?? 0) - margin.bottom, margin.top]),
    [margin.bottom, margin.top, max, min, parentHeight],
  );

  const lineGenerator: Line<[number, number]> = useMemo(() => {
    return line<[number, number]>()
      .x((_, i) => x(data[i].x)! + x.bandwidth() / 2)
      .y((d) => y(d[1] as number));
  }, [data, x, y]);

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select("g.chart");

    const lineArea = chartContainer.selectAll(".line").data(series);
    lineArea
      .join("g")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", (d) => colorScale(d.key) as string)
      .attr("stroke-width", 1.5)
      .selectAll("path")
      .data((d) => [d])
      .join("path")
      .attr("d", (d) => lineGenerator(d as [number, number][]));
  }, [colorScale, lineGenerator, series]);

  const onMouseMove: PointerEventHandler = useCallback(
    (e) => {
      if (children) {
        const [xPoint, yPoint] = pointer(e);
        const xDomain = data.map((d) => x(d.x) as number);
        const index = bisectLeft(xDomain, xPoint) - 1;

        const yData = y.invert(yPoint);
        const yDomain = series.map((d) => d[index][1] as number);
        const yIndex = Math.max(
          0,
          Math.min(yDomain.length - 1, bisectCenter(yDomain, yData)),
        );

        if (data[index]) {
          const tooltipX = x(data[index].x)! + x.bandwidth() / 2;
          const tooltipY = y(series[yIndex][index][1] as number);
          showTooltip({
            tooltipLeft: tooltipX + tooltipOffset.x,
            tooltipTop: tooltipY + tooltipOffset.y,
            tooltipData: {
              x: data[index].x,
              y: series[yIndex][index][1] - series[yIndex][index][0],
            },
          });
        }
      }
    },
    [
      children,
      data,
      series,
      showTooltip,
      tooltipOffset.x,
      tooltipOffset.y,
      x,
      y,
    ],
  );

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
      <svg
        width={"100%"}
        height={"100%"}
        ref={ref}
        onPointerMove={onMouseMove}
        onPointerLeave={hideTooltip}
      >
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
          {children({ tooltipData: tooltipData as { x: string; y: number } })}
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

export default StackLineChart;
