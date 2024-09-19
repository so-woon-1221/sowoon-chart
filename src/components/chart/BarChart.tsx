import {
  PointerEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  type AxisDomain,
  type AxisScale,
  bisectLeft,
  pointer,
  scaleBand,
  scaleLinear,
  select,
} from "d3";
import { useParentSize } from "../../hooks/useParentSize.tsx";
import AxisBottom from "../common/AxisBottom.tsx";
import AxisLeft from "../common/AxisLeft.tsx";
import { useTooltip, useTooltipInPortal, defaultStyles } from "@visx/tooltip";
import { mergeRefs } from "../../util/utils.ts";
import type { ChartProps } from "../../util/types.ts";

type BarChartProps = ChartProps & {
  /**
   * padding between bars.
   */
  padding?: number;
  children?: ({
    tooltipData,
  }: {
    tooltipData: { x: string; y: number };
  }) => React.ReactNode;
};

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50,
};

const BarChart = ({
  data,
  width,
  height,
  margin = defaultMargin,
  color = "black",
  minY,
  maxY,
  padding = 0.1,
  children,
}: BarChartProps) => {
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
    width: parentWidth,
    height: parentHeight,
  } = useParentSize();

  const parent = mergeRefs(parentRef, containerRef);

  const ref = useRef<SVGSVGElement>(null);

  const x = useMemo(() => {
    return scaleBand()
      .domain(data.map((d) => d.x))
      .range([margin.left, (parentWidth ?? 0) - margin.right])
      .padding(padding);
  }, [data, margin.left, margin.right, padding, parentWidth]);

  const y = useMemo(() => {
    return scaleLinear()
      .domain([minY ?? 0, maxY ?? Math.max(...data.map((d) => d.y))])
      .range([(parentHeight ?? 0) - margin.bottom, margin.top]);
  }, [data, margin.bottom, margin.top, maxY, minY, parentHeight]);

  const drawChart = useCallback(() => {
    const svg = select(ref.current);

    const barArea = svg.select(".bar");

    const bars = barArea.selectAll("rect").data(data);
    bars
      .join("rect")
      .attr("x", (d) => x(d.x) ?? 0)
      .attr("y", (d) => y(d.y) ?? 0)
      .attr("fill", color)
      .attr("width", x.bandwidth())
      .attr("height", (d) => (parentHeight ?? 0) - y(d.y) - margin.bottom);
  }, [color, data, margin.bottom, parentHeight, x, y]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const onMouseMove: PointerEventHandler = useCallback(
    (e) => {
      if (children) {
        const [xPoint] = pointer(e);
        const xDomain = data.map((d) => x(d.x) as number);
        const index = bisectLeft(xDomain, xPoint) - 1;
        if (data[index]) {
          const tooltipX = x(data[index].x)! + x.bandwidth() / 2;
          const tooltipY = y(data[index].y);
          showTooltip({
            tooltipLeft: tooltipX,
            tooltipTop: tooltipY,
            tooltipData: data[index],
          });
        }
      }
    },
    [children, data, showTooltip, x, y],
  );

  const onMouseLeave = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  return (
    <div
      style={{
        width: width ?? "100%",
        height: height ?? "100%",
        position: "relative",
      }}
      ref={parent}
    >
      <svg
        width={"100%"}
        height={"100%"}
        ref={ref}
        onPointerMove={onMouseMove}
        onPointerLeave={onMouseLeave}
      >
        <AxisBottom
          scale={x as AxisScale<AxisDomain>}
          top={(parentHeight ?? 0) - margin.bottom}
        />
        <AxisLeft scale={y as AxisScale<AxisDomain>} left={margin.left} />
        <g className="bar" />
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
    </div>
  );
};

export default BarChart;
