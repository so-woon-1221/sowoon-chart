import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  type AxisDomain,
  type AxisScale,
  line,
  scaleBand,
  scaleLinear,
  select,
} from "d3";
import { useParentSize } from "../../hooks/useParentSize.tsx";
import AxisBottom from "../common/AxisBottom.tsx";
import AxisLeft from "../common/AxisLeft.tsx";

type LineChartProps = ChartProps & {};

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 30,
  left: 50,
};

/**
 * Line chart component.
 */
const LineChart = ({
  data,
  margin = defaultMargin,
  color = "black",
  minY,
  maxY,
  width,
  height,
}: LineChartProps) => {
  const {
    ref: parentRef,
    width: parentWidth,
    height: parentHeight,
  } = useParentSize();
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

  const drawChart = useCallback(() => {
    const svg = select(ref.current);

    const lineArea = svg.select(".line");
    const lineGenerator = line<{ x: string; y: number }>()
      .x((d) => x(d.x)! + x.bandwidth() / 2)
      .y((d) => y(d.y));

    lineArea
      .selectAll("path")
      .data([data])
      .join("path")
      .attr("d", lineGenerator)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.5);
  }, [color, data, x, y]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div
      ref={parentRef}
      style={{
        width: width ?? "100%",
        height: height ?? "100%",
      }}
    >
      <svg width={"100%"} height={"100%"} ref={ref}>
        <AxisBottom
          scale={x as AxisScale<AxisDomain>}
          top={(parentHeight ?? 0) - margin.bottom}
        />
        <AxisLeft scale={y as AxisScale<AxisDomain>} left={margin.left} />
        <g className="line" />
      </svg>
    </div>
  );
};

export default LineChart;
