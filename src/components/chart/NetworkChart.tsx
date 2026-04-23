import {
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
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3';
import {
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type WheelEvent,
} from 'react';

import { useParentSize } from '../../hooks/useParentSize';
import type { AccessibilityProps, LegendProps } from '../../util/types';
import ChartLegend from '../common/ChartLegend';
import { getLegendRightInset } from '../common/chartLegend.utils';

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
export type NetworkChartProps = AccessibilityProps &
  LegendProps & {
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

type GraphState = {
  nodes: Node[];
  links: Link[];
};

type ZoomTransformState = {
  x: number;
  y: number;
  k: number;
};

type PanState = {
  pointerId: number;
  clientX: number;
  clientY: number;
  x: number;
  y: number;
};

const initialGraphState: GraphState = {
  nodes: [],
  links: [],
};

const initialTransformState: ZoomTransformState = {
  x: 0,
  y: 0,
  k: 1,
};

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

const getLinkEndpointId = (endpoint: Node | string) => {
  return typeof endpoint === 'string' ? endpoint : endpoint.id;
};

const getLinkEndpointNode = (endpoint: Node | string, nodesById: Map<string, Node>) => {
  return typeof endpoint === 'string' ? nodesById.get(endpoint) : endpoint;
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
  showLegend = false,
  legendItems,
  legendPosition = 'bottom',
  legendTitle,
  seriesName,
  ariaLabel = 'Network chart',
  ariaDescription,
}: NetworkChartProps) => {
  const { ref: parentRef, width: parentWidth, height: parentHeight } = useParentSize();
  const ref = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<Simulation<Node, Link> | null>(null);
  const draggedNodeIdRef = useRef<string | null>(null);
  const panStateRef = useRef<PanState | null>(null);
  const [graph, setGraph] = useState<GraphState>(initialGraphState);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [transform, setTransform] = useState<ZoomTransformState>(initialTransformState);

  const layoutWidth = useMemo(() => {
    return Math.max(parentWidth - getLegendRightInset(showLegend, legendPosition), 0);
  }, [legendPosition, parentWidth, showLegend]);

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

  const resolvedLegendItems = useMemo(() => {
    if (!showLegend) {
      return [];
    }

    if (legendItems?.length) {
      return legendItems;
    }

    return [
      {
        key: 'network',
        label: seriesName ?? 'Nodes',
        color,
      },
    ];
  }, [color, legendItems, seriesName, showLegend]);

  const textFill = useMemo(() => {
    const hslColor = hsl(color);
    return hslColor.l > 0.5 ? '#000' : '#fff';
  }, [color]);

  const nodesById = useMemo(() => {
    return new Map(graph.nodes.map((node) => [node.id, node]));
  }, [graph.nodes]);

  const connectedNodeIds = useMemo(() => {
    if (!activeNodeId) {
      return new Set<string>();
    }

    const nextConnectedNodeIds = new Set<string>([activeNodeId]);

    graph.links.forEach((link) => {
      const sourceId = getLinkEndpointId(link.source);
      const targetId = getLinkEndpointId(link.target);

      if (sourceId === activeNodeId) {
        nextConnectedNodeIds.add(targetId);
      }

      if (targetId === activeNodeId) {
        nextConnectedNodeIds.add(sourceId);
      }
    });

    return nextConnectedNodeIds;
  }, [activeNodeId, graph.links]);

  useEffect(() => {
    const resetFrameId = window.requestAnimationFrame(() => {
      setTransform(initialTransformState);
      setActiveNodeId(null);
    });

    if (layoutWidth <= 0 || parentHeight <= 0) {
      const emptyFrameId = window.requestAnimationFrame(() => {
        setGraph(initialGraphState);
      });

      return () => {
        window.cancelAnimationFrame(resetFrameId);
        window.cancelAnimationFrame(emptyFrameId);
      };
    }

    const nodes: Node[] = data.nodes.map((node) => ({ ...node }));
    const links: Link[] = data.links.map((link) => ({
      ...link,
      source: link.source,
      target: link.target,
    }));

    if (nodes.length === 0) {
      const emptyFrameId = window.requestAnimationFrame(() => {
        setGraph(initialGraphState);
      });

      return () => {
        window.cancelAnimationFrame(resetFrameId);
        window.cancelAnimationFrame(emptyFrameId);
      };
    }

    const simulation = forceSimulation<Node>(nodes)
      .force(
        'link',
        forceLink<Node, Link>(links)
          .id((node) => node.id)
          .distance(100),
      )
      .force('center', forceCenter(layoutWidth / 2, parentHeight / 2))
      .force('charge', forceManyBody().strength(-200))
      .force(
        'collide',
        forceCollide<Node>()
          .radius((node) => circleScale(+node.value) + 10)
          .strength(1),
      )
      .force('x', forceX(layoutWidth))
      .force('y', forceY(parentHeight));

    simulationRef.current = simulation;

    let frameId: number | null = null;
    const flushGraph = () => {
      frameId = null;
      setGraph({
        nodes: [...nodes],
        links: [...links],
      });
    };

    const ticked = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(flushGraph);
    };

    ticked();
    simulation.on('tick', ticked);
    simulation.alpha(1).restart();

    return () => {
      simulation.stop();
      simulation.on('tick', null);
      if (simulationRef.current === simulation) {
        simulationRef.current = null;
      }
      window.cancelAnimationFrame(resetFrameId);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [circleScale, data.links, data.nodes, layoutWidth, parentHeight]);

  const getSvgPoint = useCallback((event: { clientX: number; clientY: number }) => {
    const svg = ref.current;

    if (!svg) {
      return {
        x: event.clientX,
        y: event.clientY,
      };
    }

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;

    const screenMatrix = svg.getScreenCTM();
    if (!screenMatrix) {
      return {
        x: event.clientX,
        y: event.clientY,
      };
    }

    const svgPoint = point.matrixTransform(screenMatrix.inverse());
    return {
      x: svgPoint.x,
      y: svgPoint.y,
    };
  }, []);

  const getChartPoint = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const point = getSvgPoint(event);

      return {
        x: (point.x - transform.x) / transform.k,
        y: (point.y - transform.y) / transform.k,
      };
    },
    [getSvgPoint, transform],
  );

  const handleWheel = useCallback(
    (event: WheelEvent<SVGSVGElement>) => {
      event.preventDefault();

      const point = getSvgPoint(event);
      const zoomStep = event.deltaY < 0 ? 1.1 : 0.9;

      setTransform((prev) => {
        const nextScale = Math.min(1.5, Math.max(0.7, prev.k * zoomStep));

        return {
          k: nextScale,
          x: point.x - ((point.x - prev.x) / prev.k) * nextScale,
          y: point.y - ((point.y - prev.y) / prev.k) * nextScale,
        };
      });
    },
    [getSvgPoint],
  );

  const handleSvgPointerDown = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      if (event.button !== 0) {
        return;
      }

      panStateRef.current = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        x: transform.x,
        y: transform.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [transform.x, transform.y],
  );

  const handleSvgPointerMove = useCallback((event: PointerEvent<SVGSVGElement>) => {
    const panState = panStateRef.current;

    if (!panState || panState.pointerId !== event.pointerId) {
      return;
    }

    setTransform((prev) => ({
      ...prev,
      x: panState.x + event.clientX - panState.clientX,
      y: panState.y + event.clientY - panState.clientY,
    }));
  }, []);

  const handleSvgPointerEnd = useCallback((event: PointerEvent<SVGSVGElement>) => {
    if (panStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    panStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const handleNodePointerDown = useCallback(
    (event: PointerEvent<SVGCircleElement>, node: Node) => {
      event.stopPropagation();
      draggedNodeIdRef.current = node.id;
      event.currentTarget.setPointerCapture(event.pointerId);

      const chartPoint = getChartPoint(event);
      node.fx = chartPoint.x;
      node.fy = chartPoint.y;

      const simulation = simulationRef.current;
      if (simulation) {
        simulation.alphaTarget(0.3).restart();
      }
    },
    [getChartPoint],
  );

  const handleNodePointerMove = useCallback(
    (event: PointerEvent<SVGCircleElement>, node: Node) => {
      if (draggedNodeIdRef.current !== node.id) {
        return;
      }

      event.stopPropagation();
      const chartPoint = getChartPoint(event);
      node.fx = chartPoint.x;
      node.fy = chartPoint.y;

      setGraph((prev) => ({
        nodes: [...prev.nodes],
        links: [...prev.links],
      }));
    },
    [getChartPoint],
  );

  const handleNodePointerEnd = useCallback((event: PointerEvent<SVGCircleElement>, node: Node) => {
    if (draggedNodeIdRef.current !== node.id) {
      return;
    }

    event.stopPropagation();
    draggedNodeIdRef.current = null;
    node.fx = null;
    node.fy = null;

    const simulation = simulationRef.current;
    if (simulation) {
      simulation.alphaTarget(0);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  return (
    <div
      ref={parentRef}
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        position: 'relative',
      }}
    >
      <svg
        width={'100%'}
        height={'100%'}
        ref={ref}
        className="z-[-1]"
        role="img"
        aria-label={ariaLabel}
        style={{ touchAction: 'none' }}
        onWheel={handleWheel}
        onPointerDown={handleSvgPointerDown}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerEnd}
        onPointerCancel={handleSvgPointerEnd}
        onPointerLeave={handleSvgPointerEnd}
      >
        <title>{ariaLabel}</title>
        {ariaDescription && <desc>{ariaDescription}</desc>}
        <g
          className="chart"
          transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}
        >
          <g className="link">
            {graph.links.map((link, index) => {
              const source = getLinkEndpointNode(link.source, nodesById);
              const target = getLinkEndpointNode(link.target, nodesById);
              const sourceId = getLinkEndpointId(link.source);
              const targetId = getLinkEndpointId(link.target);
              const isActiveLink =
                !activeNodeId || sourceId === activeNodeId || targetId === activeNodeId;

              return (
                <line
                  key={`${sourceId}-${targetId}-${index}`}
                  x1={source?.x ?? 0}
                  y1={source?.y ?? 0}
                  x2={target?.x ?? 0}
                  y2={target?.y ?? 0}
                  stroke="#aaa"
                  strokeWidth={strokeScale(+link.value)}
                  opacity={isActiveLink ? 1 : 0.1}
                />
              );
            })}
          </g>
          <g className="node">
            {graph.nodes.map((node) => {
              const isConnected = !activeNodeId || connectedNodeIds.has(node.id);

              return (
                <circle
                  key={node.id}
                  r={activeNodeId && isConnected ? 30 : circleScale(+node.value)}
                  cx={node.x ?? 0}
                  cy={node.y ?? 0}
                  fill={color}
                  opacity={isConnected ? 1 : 0.1}
                  tabIndex={0}
                  aria-label={`${node.id}: ${node.value}`}
                  onPointerEnter={() => setActiveNodeId(node.id)}
                  onPointerLeave={() => setActiveNodeId(null)}
                  onFocus={() => setActiveNodeId(node.id)}
                  onBlur={() => setActiveNodeId(null)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      setActiveNodeId(null);
                    }
                  }}
                  onPointerDown={(event) => handleNodePointerDown(event, node)}
                  onPointerMove={(event) => handleNodePointerMove(event, node)}
                  onPointerUp={(event) => handleNodePointerEnd(event, node)}
                  onPointerCancel={(event) => handleNodePointerEnd(event, node)}
                />
              );
            })}
          </g>
          <g className="text">
            {graph.nodes.map((node) => {
              const isConnected = !activeNodeId || connectedNodeIds.has(node.id);

              return (
                <text
                  key={node.id}
                  x={node.x ?? 0}
                  y={node.y ?? 0}
                  fill={textFill}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontSize={activeNodeId && isConnected ? 20 : circleScale(node.value) / 1.5}
                  pointerEvents="none"
                >
                  {node.id}
                </text>
              );
            })}
          </g>
        </g>
      </svg>
      {resolvedLegendItems.length > 0 && (
        <ChartLegend items={resolvedLegendItems} position={legendPosition} title={legendTitle} />
      )}
    </div>
  );
};

export default NetworkChart;
