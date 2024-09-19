import { useParentSize } from "../../hooks/useParentSize.tsx";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { arc, pie, scaleOrdinal, select, type PieArcDatum, pointer } from "d3";
import { defaultStyles, useTooltip, useTooltipInPortal } from "@visx/tooltip";
import { mergeRefs } from "../../util/utils.ts";
import type { ChartProps } from "../../util/types.ts";

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
    width: parentWidth,
    height: parentHeight,
  } = useParentSize();

  const parent = mergeRefs(containerRef, parentRef);

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
        const [x, y] = pointer(e);
        showTooltip({
          tooltipData: d.data,
          tooltipLeft: x + parentWidth / 2 + tooltipOffset.x,
          tooltipTop: y + parentHeight / 2 + tooltipOffset.y,
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
    tooltipOffset.x,
    tooltipOffset.y,
  ]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div
      ref={parent}
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

export default PieChart;
