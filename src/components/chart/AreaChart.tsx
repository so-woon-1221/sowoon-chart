import AxisBottom from "../common/AxisBottom.tsx";
import {
  area,
  type AxisDomain,
  type AxisScale,
  bisectLeft,
  line,
  pointer,
  scaleBand,
  scaleLinear,
  select,
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

type Props = ChartProps & {
  children?: ({
    tooltipData,
  }: {
    tooltipData: { x: string; y: number };
  }) => React.ReactNode;
  fillGradient?: boolean;
  drawStroke?: boolean;
};

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50,
};

const AreaChart = ({
  width,
  height,
  margin = defaultMargin,
  minY,
  maxY,
  data,
  color = "black",
  children,
  fillGradient = false,
  drawStroke = true,
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

  const x = useMemo(() => {
    return scaleBand()
      .domain(data.map((d) => d.x))
      .range([margin.left, (parentWidth ?? 0) - margin.right]);
  }, [data, margin.left, margin.right, parentWidth]);

  const y = useMemo(() => {
    return scaleLinear()
      .domain([minY ?? 0, maxY ?? Math.max(...data.map((d) => d.y))])
      .range([(parentHeight ?? 0) - margin.bottom, margin.top]);
  }, [data, margin.bottom, margin.top, maxY, minY, parentHeight]);

  const areaGenerator = useMemo(() => {
    return area<{ x: string; y: number }>()
      .x((d) => x(d.x)! + x.bandwidth() / 2)
      .y0((d) => y(d.y))
      .y1(() => y(0));
  }, [x, y]);

  const lineGenerator = useMemo(() => {
    return line<{ x: string; y: number }>()
      .x((d) => x(d.x)! + x.bandwidth() / 2)
      .y((d) => y(d.y));
  }, [x, y]);

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select(".chart");

    const fillColor = fillGradient ? `url(#${color})` : color;

    const chartArea = chartContainer.selectAll("path.area").data([data]);
    chartArea
      .join("path")
      .attr("class", "area")
      .attr("d", areaGenerator)
      .attr("fill", fillColor);

    if (drawStroke) {
      const line = chartContainer.selectAll("path.line").data([data]);
      line
        .join("path")
        .attr("class", "line")
        .attr("d", lineGenerator)
        .attr("fill", "none")
        .attr("stroke", color);
    }
  }, [areaGenerator, color, data, drawStroke, fillGradient, lineGenerator]);

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

  return (
    <div
      ref={parent}
      style={{
        width: width ?? "100%",
        height: height ?? "100%",
        position: "relative",
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
        {fillGradient && (
          <defs>
            <linearGradient id={color} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
        )}
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

export default AreaChart;
