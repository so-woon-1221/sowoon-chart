import AxisBottom from "../common/AxisBottom.tsx";
import {
  type AxisDomain,
  type AxisScale,
  type Line,
  line,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  select,
  stack,
} from "d3";
import AxisLeft from "../common/AxisLeft.tsx";
import { useParentSize } from "../../hooks/useParentSize.tsx";
import { useCallback, useEffect, useMemo, useRef } from "react";

type DataType = {
  x: string;
  [key: string]: number | string;
};

type Props = Omit<ChartProps, "data" | "color"> & {
  data: DataType[];
  colorList: string[];
};

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 30,
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
}: Props) => {
  const {
    ref: parentRef,
    height: parentHeight,
    width: parentWidth,
  } = useParentSize();

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

    console.log(series);

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

export default StackLineChart;
