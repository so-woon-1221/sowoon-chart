import { useParentSize } from "../../hooks/useParentSize";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { arc, pie, scaleOrdinal, select, type PieArcDatum, pointer } from "d3";
import type { ChartProps, TooltipPositionMode } from "../../util/types";
import { useChartTooltip } from "../../hooks/useChartTooltip";
import ChartTooltip from "../common/ChartTooltip";

type Props = Pick<ChartProps, "width" | "height" | "data"> & {
  /**
   * Center node to display in the middle of the pie chart.
   */
  centerNode?: React.ReactNode;
  /**
   * List of colors to use for the pie chart.
   * It will be used in order for each data.
   */
  colorList?: string[];
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
  /**
   * Tooltip anchor position.
   * `cursor` follows the mouse and `point` sticks to the matched pie slice.
   * @default "cursor"
   */
  tooltipPosition?: TooltipPositionMode;
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
  centerNode,
  children,
  tooltipOffset = { x: 10, y: -10 },
  tooltipPosition = "cursor",
}: Props) => {
  const { tooltip, showTooltip, hideTooltip } =
    useChartTooltip<{ x: string; y: number }>();

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

    const pieGenerator = pie<{ x: string; y: number }>()
      .sort(null)
      .value((d) => d.y);

    const chartData = pieGenerator(data);

    const pies = chartContainer.selectAll("path").data(chartData);
    pies
      .join("path")
      .attr("transform", `translate(${pieWidth / 2}, ${pieHeight! / 2})`)
      .attr("fill", (d) => colorScale(d.data.x) as string)
      .attr("d", arcValue);

    pies
      .on("mousemove", (e, d) => {
        const [xPoint, yPoint] = pointer(e, ref.current);
        const [arcX, arcY] = arcValue.centroid(d);
        const isPointTooltip = tooltipPosition === "point";
        showTooltip({
          left: isPointTooltip ? pieWidth / 2 + arcX : xPoint,
          top: isPointTooltip ? pieHeight / 2 + arcY : yPoint,
          data: d.data,
        });
      })
      .on("mouseout", hideTooltip);
  }, [
    colorScale,
    data,
    hideTooltip,
    parentHeight,
    parentWidth,
    showTooltip,
    tooltipPosition,
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
        position: "relative",
      }}
    >
      <svg width={"100%"} height={"100%"} ref={ref}>
        <g className={"chart"} />
      </svg>
      {centerNode && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {centerNode}
        </div>
      )}
      {children && tooltip.isOpen && tooltip.data && (
        <ChartTooltip
          left={tooltip.left}
          top={tooltip.top}
          align={tooltipPosition === "point" ? "center" : "cursor"}
          offsetX={tooltipOffset.x}
          offsetY={tooltipOffset.y}
        >
          {children({ tooltipData: tooltip.data })}
        </ChartTooltip>
      )}
    </div>
  );
};

export default PieChart;
