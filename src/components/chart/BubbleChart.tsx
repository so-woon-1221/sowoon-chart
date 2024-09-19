import { useParentSize } from "../../hooks/useParentSize.tsx";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { hierarchy, hsl, pack, select } from "d3";
import type { ChartProps } from "../../util/types.ts";

type Props = Pick<ChartProps, "width" | "height" | "data" | "margin"> & {
  children?: React.ReactNode;
  colorList?: string[];
};

const BubbleChart = ({
  width,
  height,
  data,
  margin = { top: 10, left: 30, right: 30, bottom: 10 },
  colorList = [
    "#0A0908",
    "#0891b2",
    "#C6AC8F",
    "#60D394",
    "#D1495B",
    "#9b5de5",
  ],
}: Props) => {
  const {
    ref: parentRef,
    height: parentHeight,
    width: parentWidth,
  } = useParentSize();
  const ref = useRef<SVGSVGElement>(null);

  const packData = useMemo(() => {
    return {
      children: data.map((d) => ({ key: d.x, value: d.y })),
      key: "전체",
      value: 0,
    };
  }, [data]);

  const root = useMemo(
    () =>
      hierarchy<{ key: string; value: number }>(packData).sum((d) => d.value),
    [packData],
  );

  const packGenerator = useMemo(() => {
    return pack<{ key: string; value: number }>()
      .size([
        parentWidth - margin.left - margin.right,
        parentHeight - margin.top - margin.bottom,
      ])
      .padding(1);
  }, [
    margin.bottom,
    margin.left,
    margin.right,
    margin.top,
    parentHeight,
    parentWidth,
  ]);

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select(".chart");

    const packData = packGenerator(root).descendants().slice(1);

    chartContainer
      .selectAll("circle")
      .data(packData)
      .join("circle")
      .attr("r", (d) => d.r)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("fill", (_, i) => colorList[i % colorList.length]);

    chartContainer
      .selectAll("text")
      .data(packData)
      .join("text")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 15)
      .attr("font-weight", 700)
      .attr("font-family", "Noto Sans KR")
      .attr("fill", (_, i) => {
        const backgroundColor = colorList[i % colorList.length];
        const colorObj = hsl(backgroundColor);

        return colorObj.l > 0.5 ? "black" : "white";
      })
      .text((d) => d.data.key);
  }, [colorList, packGenerator, root]);

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

export default BubbleChart;
