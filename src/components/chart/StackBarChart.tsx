import AxisBottom from "../common/AxisBottom.tsx";
import {
  AxisDomain,
  AxisScale,
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
  padding?: number;
};

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 30,
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
  // minY,
  padding = 0.1,
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

  // const min = useMemo(() => {
  //   if (minY) {
  //     return minY;
  //   }
  //   const list = keyList.map((key) => {
  //     return Math.min(...data.map((d) => d[key] as number));
  //   });
  //   return Math.min(...list);
  // }, [data, keyList, minY]);

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
      .attr("width", x.bandwidth());
  }, [colorScale, series, x, y]);

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

export default StackBarChart;
