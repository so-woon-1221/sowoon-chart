import AxisBottom from "../common/AxisBottom.tsx";
import {
  area,
  AxisDomain,
  AxisScale,
  scaleBand,
  scaleLinear,
  select,
} from "d3";
import AxisLeft from "../common/AxisLeft.tsx";
import { useParentSize } from "../../hooks/useParentSize.tsx";
import { useCallback, useEffect, useMemo, useRef } from "react";

type Props = ChartProps & {};

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 30,
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
}: Props) => {
  const {
    ref: parentRef,
    height: parentHeight,
    width: parentWidth,
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

  const areaGenerator = useMemo(() => {
    return area<{ x: string; y: number }>()
      .x((d) => x(d.x)! + x.bandwidth() / 2)
      .y0((d) => y(d.y))
      .y1(() => y(0));
  }, [x, y]);

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select(".chart");

    const chartArea = chartContainer.selectAll("path").data([data]);
    chartArea.join("path").attr("d", areaGenerator).attr("fill", color);
  }, [areaGenerator, color, data]);

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
        <g className="chart" />
      </svg>
    </div>
  );
};

export default AreaChart;
