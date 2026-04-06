import {
  type D3DragEvent,
  drag,
  type DragBehavior,
  extent,
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  hsl,
  scaleLinear,
  select,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
  type SubjectPosition,
  zoom,
} from 'd3';
import { useEffect, useMemo, useRef } from 'react';

import { useParentSize } from '../../hooks/useParentSize';

/**
 * One node used by {@link NetworkChart}.
 */
export interface NetworkNodeDatum {
  id: string;
  group?: string;
  value: number;
}

/**
 * One directional or undirected-looking edge used by {@link NetworkChart}.
 */
export interface NetworkLinkDatum {
  source: string;
  target: string;
  value: number;
}

/**
 * Data object consumed by {@link NetworkChart}.
 */
export interface NetworkChartData {
  nodes: NetworkNodeDatum[];
  links: NetworkLinkDatum[];
}

/**
 * Props for {@link NetworkChart}.
 */
export type NetworkChartProps = {
  /**
   * Node and link data rendered by the force simulation.
   */
  data: NetworkChartData;
  /**
   * Fixed outer width. Defaults to the parent width.
   */
  width?: number;
  /**
   * Fixed outer height. Defaults to the parent height.
   */
  height?: number;
  /**
   * Maximum node radius.
   * @default 45
   */
  maxRadius?: number;
  /**
   * Minimum node radius.
   * @default 15
   */
  minRadius?: number;
  /**
   * Maximum link stroke width.
   * @default 10
   */
  maxLinkWidth?: number;
  /**
   * Minimum link stroke width.
   * @default 1
   */
  minLinkWidth?: number;
  /**
   * Base node color.
   * @default "#9b5de5"
   */
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

const getScaleDomain = (values: number[], fallback: [number, number]) => {
  const [min, max] = extent(values);

  if (min === undefined || max === undefined) {
    return fallback;
  }

  if (min === max) {
    if (min === 0) {
      return [0, 1] as [number, number];
    }

    return [0, max] as [number, number];
  }

  return [min, max] as [number, number];
};

/**
 * Renders an interactive force-directed network graph with drag and zoom support.
 */
const NetworkChart = ({
  data,
  width,
  height,
  maxRadius = 45,
  minRadius = 15,
  maxLinkWidth = 10,
  minLinkWidth = 1,
  color = '#9b5de5',
}: NetworkChartProps) => {
  const { ref: parentRef, width: parentWidth, height: parentHeight } = useParentSize();
  const ref = useRef<SVGSVGElement>(null);

  const strokeScale = useMemo(
    () =>
      scaleLinear()
        .domain(
          getScaleDomain(
            data.links.map((link) => +link.value),
            [minLinkWidth, maxLinkWidth],
          ),
        )
        .range([minLinkWidth, maxLinkWidth]),
    [data.links, maxLinkWidth, minLinkWidth],
  );

  const circleScale = useMemo(
    () =>
      scaleLinear()
        .domain(
          getScaleDomain(
            data.nodes.map((node) => +node.value),
            [minRadius, maxRadius],
          ),
        )
        .range([minRadius, maxRadius]),
    [data.nodes, maxRadius, minRadius],
  );

  const nodeDrag = (
    simulation: Simulation<Node, Link>,
  ): DragBehavior<Element, Node, SubjectPosition | Node> => {
    const dragStarted = (event: D3DragEvent<Element, Node, Node>) => {
      if (!event.active) {
        simulation.alphaTarget(0.3).restart();
      }

      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    };

    const dragged = (event: D3DragEvent<Element, Node, Node>) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    };

    const dragEnded = (event: D3DragEvent<Element, Node, Node>) => {
      if (!event.active) {
        simulation.alphaTarget(0);
      }

      event.subject.fx = null;
      event.subject.fy = null;
    };

    return drag<Element, Node>().on('start', dragStarted).on('drag', dragged).on('end', dragEnded);
  };

  useEffect(() => {
    const svgElement = ref.current;
    if (!svgElement || parentWidth <= 0 || parentHeight <= 0) {
      return;
    }

    const nodes: Node[] = data.nodes.map((node) => ({ ...node }));
    const links: Link[] = data.links.map((link) => ({
      ...link,
      source: link.source,
      target: link.target,
    }));

    const svg = select(svgElement);
    const chartArea = svg.select<SVGGElement>('g.chart');

    chartArea.attr('transform', null);
    svg.on('.zoom', null);

    if (nodes.length === 0) {
      chartArea.select('g.link').selectAll('*').remove();
      chartArea.select('g.node').selectAll('*').remove();
      chartArea.select('g.text').selectAll('*').remove();
      return;
    }

    const simulation = forceSimulation<Node>(nodes)
      .force(
        'link',
        forceLink<Node, Link>(links)
          .id((node) => node.id)
          .distance(100),
      )
      .force('center', forceCenter(parentWidth / 2, parentHeight / 2))
      .force('charge', forceManyBody().strength(-200))
      .force(
        'collide',
        forceCollide<Node>()
          .radius((node) => circleScale(+node.value) + 10)
          .strength(1),
      )
      .force('x', forceX(parentWidth))
      .force('y', forceY(parentHeight));

    const nodeLinkStatus: Record<string, boolean> = {};
    links.forEach((link) => {
      if (typeof link.source !== 'string' && typeof link.target !== 'string') {
        if (link.source.index !== undefined && link.target.index !== undefined) {
          nodeLinkStatus[`${link.source.index},${link.target.index}`] = true;
          nodeLinkStatus[`${link.target.index},${link.source.index}`] = true;
        }
      }
    });

    const isConnected = (sourceNode: Node, targetNode: Node) => {
      return (
        Boolean(nodeLinkStatus[`${sourceNode.index},${targetNode.index}`]) ||
        sourceNode.index === targetNode.index ||
        Boolean(nodeLinkStatus[`${targetNode.index},${sourceNode.index}`])
      );
    };

    let highlightedNodeId: string | null = null;

    const link = chartArea
      .select('g.link')
      .selectAll('line')
      .data(links)
      .join('line')
      .style('stroke-width', (currentLink) => strokeScale(+currentLink.value))
      .attr('stroke', '#aaa');

    const text = chartArea
      .select('g.text')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((node) => node.id)
      .attr('fill', () => {
        const hslColor = hsl(color);
        return hslColor.l > 0.5 ? '#000' : '#fff';
      })
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', (node) => `${circleScale(node.value) / 1.5}px`)
      .attr('pointer-events', 'none');

    const node = chartArea
      .select('g.node')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (currentNode) => circleScale(+currentNode.value))
      .attr('fill', color)
      .on('pointerenter', (_, hoveredNode) => {
        if (highlightedNodeId === hoveredNode.id) {
          return;
        }

        highlightedNodeId = hoveredNode.id;

        node
          .interrupt()
          .attr('r', (candidate) => {
            if (isConnected(hoveredNode, candidate)) {
              return 30;
            }

            return circleScale(candidate.value);
          })
          .style('opacity', (candidate) => {
            return isConnected(hoveredNode, candidate) ? 1 : 0.1;
          });

        link.interrupt().style('opacity', (currentLink) => {
          if (hoveredNode === currentLink.source || hoveredNode === currentLink.target) {
            return 1;
          }

          return 0.1;
        });

        text.interrupt().attr('font-size', (candidate) => {
          if (isConnected(hoveredNode, candidate)) {
            return '20px';
          }

          return `${circleScale(candidate.value) / 1.5}px`;
        });
      })
      .on('pointerleave', () => {
        if (highlightedNodeId === null) {
          return;
        }

        highlightedNodeId = null;

        node
          .interrupt()
          .attr('r', (currentNode) => circleScale(currentNode.value))
          .style('opacity', 1);

        link.interrupt().style('opacity', 1);

        text
          .interrupt()
          .attr('font-size', (currentNode) => `${circleScale(currentNode.value) / 1.5}px`);
      })
      .call(nodeDrag(simulation) as never);

    const ticked = () => {
      link
        .attr('x1', (currentLink) =>
          typeof currentLink.source === 'string' ? 0 : (currentLink.source.x ?? 0),
        )
        .attr('y1', (currentLink) =>
          typeof currentLink.source === 'string' ? 0 : (currentLink.source.y ?? 0),
        )
        .attr('x2', (currentLink) =>
          typeof currentLink.target === 'string' ? 0 : (currentLink.target.x ?? 0),
        )
        .attr('y2', (currentLink) =>
          typeof currentLink.target === 'string' ? 0 : (currentLink.target.y ?? 0),
        );

      node
        .attr('cx', (currentNode) => currentNode.x ?? 0)
        .attr('cy', (currentNode) => currentNode.y ?? 0);

      text
        .attr('x', (currentNode) => currentNode.x ?? 0)
        .attr('y', (currentNode) => currentNode.y ?? 0);
    };

    ticked();
    simulation.on('tick', ticked);
    simulation.alpha(1).restart();

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.7, 1.5])
      .extent([
        [0, 0],
        [parentWidth, parentHeight],
      ])
      .on('zoom', (event) => {
        chartArea.attr('transform', event.transform.toString());
      });

    svg.call(zoomBehavior as never);

    return () => {
      simulation.stop();
      simulation.on('tick', null);
      svg.on('.zoom', null);
      chartArea.selectAll('*').interrupt();
    };
  }, [circleScale, color, data.links, data.nodes, parentHeight, parentWidth, strokeScale]);

  return (
    <div
      ref={parentRef}
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
      }}
    >
      <svg width={'100%'} height={'100%'} ref={ref} className="z-[-1]">
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
