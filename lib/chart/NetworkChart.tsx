import React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  select,
  forceX,
  forceY,
  drag,
  scaleLinear,
  extent,
  zoom,
} from "d3";
import { RectClipPath } from "@visx/clip-path";
import withParentSize from "../hooks/withParentSize";
import type { ComponentType } from "react";
import type { SimulationLinkDatum, NumberValue } from "d3";

interface Props {
  /**
   * Data for the network chart
   */
  data: {
    nodes: { id: string; group: string; value: number }[];
    links: { source: string; target: string; value: number }[];
  };
  /**
   * ID of the chart
   */
  id: string;
  width?: number;
  height?: number;
}

const NetworkChart: ComponentType<Props> = ({ id, data, width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isZoom, _] = useState(false);

  // const colorScale = useMemo(
  //   () =>
  //     scaleOrdinal()
  //       .domain(data.nodes.map((d) => d.group))
  //       .range(schemeTableau10),
  //   [data.nodes]
  // );
  const strokeScale = useMemo(
    () =>
      scaleLinear()
        .domain(extent(data.links.map((d) => +d.value)) as NumberValue[])
        .range([1, 10]),
    [data.links]
  );
  const circleScale = useMemo(() => {
    return scaleLinear()
      .domain(extent(data.nodes.map((d) => +d.value)) as NumberValue[])
      .range([5, 30]);
  }, [data.nodes]);

  const nodeDrag = (simulation: any) => {
    const dragstarted = (event: any) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    };

    const dragged = (event: any) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    };

    const dragended = (event: any) => {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    };

    return drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  const drawChart = useCallback(() => {
    const svg = select(svgRef.current);

    const chartArea = svg.select("g.chart");

    const simulation = forceSimulation(data.nodes as any)
      .force(
        "link",
        forceLink(data.links)
          .id((d: any) => d.id)
          .distance(250)
      )
      .force("center", forceCenter(width! / 2, height! / 2))
      .force("charge", forceManyBody().strength(-300))
      .force("x", forceX(width!))
      .force("y", forceY(height!));

    const nodeLinkStatus = Object.assign({});
    data.links.forEach((d: any) => {
      nodeLinkStatus[`${d.source.index},${d.target.index}`] = 1;
      nodeLinkStatus[`${d.target.index},${d.source.index}`] = 1;
    });

    function isConnected(a: any, b: any) {
      return (
        nodeLinkStatus[`${a.index},${b.index}`] ||
        a.index === b.index ||
        nodeLinkStatus[`${b.index},${a.index}`]
      );
    }

    const link = chartArea
      .select("g.link")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .style("stroke-width", (d) => strokeScale(+d.value))
      .attr("stroke", "#aaa")
      .attr("x1", (d: SimulationLinkDatum<any>) => d.source.x)
      .attr("y1", (d: SimulationLinkDatum<any>) => d.source.y)
      .attr("x2", (d: SimulationLinkDatum<any>) => d.target.x)
      .attr("y2", (d: SimulationLinkDatum<any>) => d.target.y);

    const node = chartArea
      .select("g.node")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", (d) => circleScale(+d.value))
      // .attr("r", 10)
      //   .attr("fill", (d) => colorScale(d.group) as string)
      .attr("fill", "#354965")
      .attr("cx", (d: any) => d.x)
      .attr("cy", (d: any) => d.y)
      .on("mouseover", function (e, d: any) {
        node
          .transition()
          .attr("r", (o) => {
            if (isConnected(d, o)) {
              return 30;
            } else {
              return circleScale(o.value);
              // return 10;
            }
          })
          .style("opacity", function (o) {
            let thisOpacity: number;
            if (isConnected(d, o)) {
              thisOpacity = 1;
            } else {
              thisOpacity = 0.1;
            }
            return thisOpacity;
          });
        link.transition().style("opacity", function (l) {
          if (d == l.source || d == l.target) {
            return 1;
          } else {
            return 0.1;
          }
        });
        text.transition().attr("font-size", (o) => {
          if (isConnected(d, o)) {
            return "20px";
          } else {
            return circleScale(o.value) / 1.5 + "px";
            // return "10px";
          }
        });
      })
      .on("mouseleave", () => {
        node
          .transition()
          .attr("r", (d) => circleScale(d.value))
          // .attr("r", 10)
          .style("opacity", 1);
        link.transition().style("opacity", 1);
        text
          .transition()
          .attr("font-size", (d) => circleScale(d.value) / 1.5 + "px");
        // .attr("font-size", "10px");
      })
      .call(nodeDrag(simulation) as any);

    const text = chartArea
      .select("g.text")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .text((d) => d.id)
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-size", (d) => circleScale(d.value) / 1.5 + "px")
      // .attr("font-size", "10px")
      .attr("pointer-events", "none")
      .attr("x", (d: any) => d.x)
      .attr("y", (d: any) => d.y);

    function ticked() {
      link
        .attr("x1", (d: SimulationLinkDatum<any>) => d.source.x)
        .attr("y1", (d: SimulationLinkDatum<any>) => d.source.y)
        .attr("x2", (d: SimulationLinkDatum<any>) => d.target.x)
        .attr("y2", (d: SimulationLinkDatum<any>) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);

      text.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    }

    simulation.on("tick", ticked);

    svg.call(
      zoom()
        .scaleExtent(isZoom ? [0.7, 1.5] : [1, 1])
        .extent([
          [0, 0],
          [width!, height!],
        ])
        .on("zoom", (e) => {
          svg.selectAll("g").attr("transform", e.transform);
        }) as any
    );
  }, [circleScale, data.links, data.nodes, height, isZoom, strokeScale, width]);

  useEffect(() => {
    if (data.nodes.length > 0) {
      drawChart();
    }
  }, [data.nodes.length, drawChart]);

  return (
    <div className="relative flex h-full w-full flex-col">
      <svg
        width={width}
        height={height}
        id={`${id}-chart`}
        clipPath={`url(#${id}-chart-clipPath)`}
        ref={svgRef}
      >
        <>
          <RectClipPath
            id={`${id}-chart-clipPath`}
            x={0}
            y={0}
            width={width}
            height={height}
          />
          <g className="chart">
            <g className="link" />
            <g className="node" />
            <g className="text" />
          </g>
        </>
      </svg>
    </div>
  );
};

export default withParentSize(NetworkChart);
