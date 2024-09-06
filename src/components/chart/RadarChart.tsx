import { useParentSize } from "../../hooks/useParentSize.tsx";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  curveLinearClosed,
  lineRadial,
  max,
  scaleLinear,
  scaleOrdinal,
  select,
} from "d3";

type Props = {
  width?: number;
  height?: number;
  data: {
    key: string;
    data: {
      x: string;
      y: number;
    }[];
  }[];
  colorList: string[];
  margin?: number;
};

const RadarChart = ({ width, height, margin = 60, data, colorList }: Props) => {
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
      `translate(${parentWidth! / 2}, ${parentHeight! / 2})`,
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
      // .transition()
      .attr("d", (d) => {
        return radarLine(d.data.map((a) => a.y));
      })
      .attr("fill", (d) => color(d.key))
      .attr("fill-opacity", 0.1)
      .attr("stroke", (d) => color(d.key))
      .attr("stroke-dasharray", (_, i) => (i % 2 === 1 ? "5,5" : "0,0"))
      .attr("stroke-width", 2);

    chartContainer
      .selectAll("g")
      .data(data)
      .join("g")
      .attr("stroke", (d) => color(d.key))
      .attr("fill", "none")
      .selectAll("circle")
      .data((d) => d.data)
      .join("circle")
      .attr("r", 4)
      .attr(
        "cx",
        (d, i) => rScale(d.y) * Math.cos(angleSlice * i - Math.PI / 2),
      )
      .attr(
        "cy",
        (d, i) => rScale(d.y) * Math.sin(angleSlice * i - Math.PI / 2),
      );
  }, [
    angleSlice,
    axisList,
    backLineList,
    color,
    data,
    maxY,
    parentHeight,
    parentWidth,
    rScale,
    radarLine,
  ]);

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
        <g className={"chart"} />
      </svg>
    </div>
  );
};

export default RadarChart;
