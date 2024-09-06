import { useParentSize } from "../../hooks/useParentSize.tsx";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { arc, pie, scaleOrdinal, select, type PieArcDatum } from "d3";

type Props = Pick<ChartProps, "width" | "height" | "data"> & {
  children?: React.ReactNode;
  colorList?: string[];
};

const PieChart = ({
  width,
  height,
  colorList = [
    "#0A0908",
    "#0891b2",
    "#C6AC8F",
    "#60D394",
    "#D1495B",
    "#9b5de5",
  ],
  data,
  children,
}: Props) => {
  const {
    ref: parentRef,
    width: parentWidth,
    height: parentHeight,
  } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const colorScale = useMemo(() => {
    return scaleOrdinal()
      .domain(data.map((d) => d.x))
      .range(colorList);
  }, [colorList, data]);

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select(".chart");
    const pieWidth = parentWidth;
    const pieHeight = parentHeight;
    const radius = Math.min(pieWidth, pieHeight) / 2;
    const arcValue = arc<PieArcDatum<{ x: string; y: number }>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.85);
    // .cornerRadius(3)
    // .padAngle(0.005);

    const pieGenerator = pie<{ x: string; y: number }>()
      .sort(null)
      .value((d) => d.y);

    const chartData = pieGenerator(data);

    chartContainer
      .selectAll("path")
      .data(chartData)
      .join("path")
      .attr("transform", `translate(${pieWidth / 2}, ${pieHeight! / 2})`)
      .attr("fill", (d) => colorScale(d.data.x) as string)
      .attr("d", arcValue);
    // .attr('stroke', 'rgba(0,0,0,0.3)');
  }, [colorScale, data, parentHeight, parentWidth]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div
      ref={parentRef}
      style={{
        width: width ?? "100%",
        height: height ?? "100%",
        position: "relative",
      }}
    >
      <svg width={"100%"} height={"100%"} ref={ref}>
        <g className={"chart"} />
      </svg>
      {children && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default PieChart;
