import { useCallback, useEffect, useMemo, useRef } from "react";
import { useParentSize } from "../../hooks/useParentSize.tsx";
import {
  DragBehavior,
  Simulation,
  SimulationLinkDatum,
  SimulationNodeDatum,
  D3DragEvent,
  SubjectPosition,
  hsl,
} from "d3";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  select,
  drag,
  scaleLinear,
  extent,
  zoom,
} from "d3";

type Props = {
  data: {
    nodes: { id: string; group?: string; value: number }[];
    links: { source: string; target: string; value: number }[];
  };
  width?: number;
  height?: number;
  maxRadius?: number;
  minRadius?: number;
  maxLinkWidth?: number;
  minLinkWidth?: number;
  color?: string;
};

interface Node extends SimulationNodeDatum {
  id: string;
  value: number;
  group?: string;
}
interface Link extends SimulationLinkDatum<Node> {
  source: Node | string;
  target: Node | string;
  value: number;
}

const NetworkChart = ({
  data,
  width,
  height,
  maxRadius = 45,
  minRadius = 15,
  maxLinkWidth = 10,
  minLinkWidth = 1,
  color = "#9b5de5",
}: Props) => {
  const {
    ref: parentRef,
    width: parentWidth,
    height: parentHeight,
  } = useParentSize();
  const ref = useRef<SVGSVGElement>(null);

  const strokeScale = useMemo(
    () =>
      scaleLinear()
        .domain(extent(data.links.map((d) => +d.value)) as [number, number])
        .range([minLinkWidth, maxLinkWidth]),
    [data.links, maxLinkWidth, minLinkWidth],
  );
  const circleScale = useMemo(
    () =>
      scaleLinear()
        .domain(extent(data.nodes.map((d) => +d.value)) as [number, number])
        .range([minRadius, maxRadius]),
    [data.nodes, maxRadius, minRadius],
  );

  const nodeDrag = (
    simulation: Simulation<Node, Link>,
  ): DragBehavior<Element, Node, SubjectPosition | Node> => {
    const dragStarted = (event: D3DragEvent<Element, Node, Node>) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();

      event.subject.fx = event.subject.x;

      event.subject.fy = event.subject.y;
    };

    const dragged = (event: D3DragEvent<Element, Node, Node>) => {
      event.subject.fx = event.x;

      event.subject.fy = event.y;
    };

    const dragEnded = (event: D3DragEvent<Element, Node, Node>) => {
      if (!event.active) simulation.alphaTarget(0);

      event.subject.fx = null;

      event.subject.fy = null;
    };

    return drag<Element, Node>()
      .on("start", dragStarted)
      .on("drag", dragged)
      .on("end", dragEnded);
  };

  const drawChart = useCallback(() => {
    const svg = select(ref.current);

    const chartArea = svg.select("g.chart");

    const simulation = forceSimulation<Node>(data.nodes)
      .force(
        "link",
        forceLink<Node, Link>(data.links)
          .id((d) => d.id)
          .distance(100), // 노드 간의 거리를 줄임
      )
      .force("center", forceCenter(parentWidth / 2, parentHeight / 2)) // 노드 중앙
      .force("charge", forceManyBody().strength(-200)) // 노드 간의 힘을 높임
      .force(
        "collide",
        forceCollide<Node>()
          .radius((d) => circleScale(+d.value) + 10)
          .strength(1),
      ) // 충돌반경
      .force("x", forceX(parentWidth))
      .force("y", forceY(parentHeight));

    const nodeLinkStatus: { [key: string]: number } = {};
    data.links.forEach((d: Link) => {
      if (typeof d.source !== "string" && typeof d.target !== "string") {
        if (d.source.index !== undefined && d.target.index !== undefined) {
          nodeLinkStatus[`${d.source.index},${d.target.index}`] = 1;
          nodeLinkStatus[`${d.target.index},${d.source.index}`] = 1;
        }
      }
    });

    function isConnected(a: Node, b: Node) {
      return (
        nodeLinkStatus[`${a.index},${b.index}`] ||
        a.index === b.index ||
        nodeLinkStatus[`${b.index},${a.index}`]
      );
    }

    const link = chartArea
      .select("g.link")
      .selectAll("line")
      .data(data.links as Link[])
      .join("line")
      .style("stroke-width", (d) => strokeScale(+d.value))
      .attr("stroke", "#aaa")
      .attr("x1", (d: Link) => (typeof d.source === "string" ? 0 : d.source.x!))
      .attr("y1", (d: Link) => (typeof d.source === "string" ? 0 : d.source.y!))
      .attr("x2", (d: Link) => (typeof d.target === "string" ? 0 : d.target.x!))
      .attr("y2", (d: Link) =>
        typeof d.target === "string" ? 0 : d.target.y!,
      );

    const text = chartArea
      .select("g.text")
      .selectAll("text")
      .data(data.nodes as Node[])
      .join("text")
      .text((d) => d.id)
      .attr("fill", () => {
        const hslColor = hsl(color);
        return hslColor.l > 0.5 ? "#000" : "#fff";
      })
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-size", (d) => `${circleScale(d.value) / 1.5}px`)
      .attr("pointer-events", "none")
      .attr("x", (d) => d.x ?? 0)
      .attr("y", (d) => d.y ?? 0);

    const node = chartArea
      .select("g.node")
      .selectAll("circle")
      .data(data.nodes as Node[])
      .join("circle")
      .attr("r", (d) => circleScale(+d.value))
      // .attr('fill', (d) => colorScale(d.group) as string)
      .attr("fill", color)
      .attr("cx", (d) => d.x ?? 0)
      .attr("cy", (d) => d.y ?? 0)
      .on("mouseover", (_, d) => {
        node
          .transition()
          .attr("r", (o) => {
            if (isConnected(d, o)) {
              return 30;
            }
            return circleScale(o.value);
            // return 10;
          })
          .style("opacity", (o) => {
            let thisOpacity = 0;
            if (isConnected(d, o)) {
              thisOpacity = 1;
            } else {
              thisOpacity = 0.1;
            }
            return thisOpacity;
          });
        link.transition().style("opacity", (l) => {
          if (d === l.source || d === l.target) {
            return 1;
          }
          return 0.1;
        });
        text.transition().attr("font-size", (o) => {
          if (isConnected(d, o)) {
            return "20px";
          }
          return `${circleScale(o.value) / 1.5}px`;
          // return "10px";
        });
      })
      .on("mouseleave", () => {
        node
          .transition()
          .attr("r", (d) => circleScale(d.value))
          .style("opacity", 1);
        link.transition().style("opacity", 1);
        text
          .transition()
          .attr("font-size", (d) => `${circleScale(d.value) / 1.5}px`);
      })
      .call(nodeDrag(simulation) as never);

    function ticked() {
      link
        .attr("x1", (d: Link) => (d.source as Node).x!)
        .attr("y1", (d: Link) => (d.source as Node).y!)
        .attr("x2", (d: Link) => (d.target as Node).x!)
        .attr("y2", (d: Link) => (d.target as Node).y!);

      node.attr("cx", (d: Node) => d.x!).attr("cy", (d: Node) => d.y!);

      text.attr("x", (d: Node) => d.x!).attr("y", (d: Node) => d.y!);
    }

    simulation.alpha(0).restart();
    simulation.on("tick", ticked);

    svg.call(
      zoom()
        .scaleExtent([0.7, 1.5])
        .scaleExtent([0.7, 1.5])
        .extent([
          [0, 0],
          [parentWidth, parentHeight],
        ])
        .on("zoom", (e) => {
          svg.selectAll("g").attr("transform", e.transform);
        }) as never,
    );
  }, [
    circleScale,
    color,
    data.links,
    data.nodes,
    parentHeight,
    parentWidth,
    strokeScale,
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
      <svg width={"100%"} height={"100%"} ref={ref} className="z-[-1]">
        <g className="chart">
          <g className="link" />
          <g className="node" />
          <g className="text" />
        </g>
      </svg>
    </div>
  );
};

export default NetworkChart;
