import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  forceCollide,
} from 'd3-force';
import { select } from 'd3-selection';
import { drag } from 'd3-drag';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { extent } from 'd3-array';
import { zoom } from 'd3-zoom';
import { RectClipPath } from '@visx/clip-path';
import type { ComponentType } from 'react';
import type { SimulationLinkDatum, NumberValue } from 'd3';
import withParentSize from '../hooks/withParentSize';

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
  colorList?: string[];
  keyList?: string[];
}

const NetworkChart: ComponentType<Props> = ({
  id,
  data,
  width,
  height,
  colorList = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'],
  keyList,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const colorScale = useMemo(
    () =>
      scaleOrdinal()
        .domain(keyList ?? data.nodes.map(d => d.group))
        .range(colorList),
    [colorList, data.nodes, keyList],
  );

  const strokeScale = useMemo(
    () =>
      scaleLinear()
        .domain(extent(data.links.map(d => +d.value)) as NumberValue[])
        .range([1, 10]),
    [data.links],
  );
  const circleScale = useMemo(
    () =>
      scaleLinear()
        .domain(extent(data.nodes.map(d => +d.value)) as NumberValue[])
        .range([15, 30]),
    [data.nodes],
  );

  const nodeDrag = (simulation: any) => {
    const dragstarted = (event: any) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      // eslint-disable-next-line no-param-reassign
      event.subject.fx = event.subject.x;
      // eslint-disable-next-line no-param-reassign
      event.subject.fy = event.subject.y;
    };

    const dragged = (event: any) => {
      // eslint-disable-next-line no-param-reassign
      event.subject.fx = event.x;
      // eslint-disable-next-line no-param-reassign
      event.subject.fy = event.y;
    };

    const dragended = (event: any) => {
      if (!event.active) simulation.alphaTarget(0);
      // eslint-disable-next-line no-param-reassign
      event.subject.fx = null;
      // eslint-disable-next-line no-param-reassign
      event.subject.fy = null;
    };

    return drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  };

  const getContrastColor = useCallback((hexcolor: string) => {
    const r = parseInt(hexcolor.slice(1, 3), 16);
    const g = parseInt(hexcolor.slice(3, 5), 16);
    const b = parseInt(hexcolor.slice(5, 7), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000' : '#fff';
  }, []);

  const drawChart = useCallback(() => {
    const svg = select(svgRef.current);

    const chartArea = svg.select('g.chart');

    const simulation = forceSimulation(data.nodes as any)
      .force(
        'link',
        forceLink(data.links)
          .id((d: any) => d.id)
          .distance(100), // 노드 간의 거리를 줄임
      )
      .force('center', forceCenter(width! / 2, height! / 2))
      .force('charge', forceManyBody().strength(-200)) // 노드 간의 힘을 높임
      .force(
        'collide',
        forceCollide()
          .radius((d: any) => circleScale(+d.value) + 10)
          .strength(1),
      ) // 반지름을 늘리고 힘을 높임
      .force('x', forceX(width!))
      .force('y', forceY(height!));

    const nodeLinkStatus = {};
    data.links.forEach((d: any) => {
      // @ts-ignore
      nodeLinkStatus[`${d.source.index},${d.target.index}`] = 1;
      // @ts-ignore
      nodeLinkStatus[`${d.target.index},${d.source.index}`] = 1;
    });

    function isConnected(a: any, b: any) {
      return (
        // @ts-ignore
        nodeLinkStatus[`${a.index},${b.index}`] ||
        a.index === b.index ||
        // @ts-ignore
        nodeLinkStatus[`${b.index},${a.index}`]
      );
    }

    const link = chartArea
      .select('g.link')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .style('stroke-width', d => strokeScale(+d.value))
      .attr('stroke', '#aaa')
      .attr('x1', (d: SimulationLinkDatum<any>) => d.source.x)
      .attr('y1', (d: SimulationLinkDatum<any>) => d.source.y)
      .attr('x2', (d: SimulationLinkDatum<any>) => d.target.x)
      .attr('y2', (d: SimulationLinkDatum<any>) => d.target.y);

    const text = chartArea
      .select('g.text')
      .selectAll('text')
      .data(data.nodes)
      .join('text')
      .text(d => d.id)
      .attr('fill', d => getContrastColor(colorScale(d.group) as string))
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', d => `${circleScale(d.value) / 1.5}px`)
      .attr('pointer-events', 'none')
      .attr('x', (d: any) => d.x)
      .attr('y', (d: any) => d.y);

    const node = chartArea
      .select('g.node')
      .selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', d => circleScale(+d.value))
      .attr('fill', d => colorScale(d.group) as string)
      .attr('cx', (d: any) => d.x)
      .attr('cy', (d: any) => d.y)
      .on('mouseover', (_e, d: any) => {
        node
          .transition()
          .attr('r', o => {
            if (isConnected(d, o)) {
              return 30;
            }
            return circleScale(o.value);
          })
          .style('opacity', o => {
            let thisOpacity: number;
            if (isConnected(d, o)) {
              thisOpacity = 1;
            } else {
              thisOpacity = 0.1;
            }
            return thisOpacity;
          });
        link.transition().style('opacity', l => {
          if (d === l.source || d === l.target) {
            return 1;
          }
          return 0.1;
        });
        text.transition().attr('font-size', o => {
          if (isConnected(d, o)) {
            return '20px';
          }
          return `${circleScale(o.value) / 1.5}px`;
        });
      })
      .on('mouseleave', () => {
        node
          .transition()
          .attr('r', d => circleScale(d.value))
          .style('opacity', 1);
        link.transition().style('opacity', 1);
        text
          .transition()
          .attr('font-size', d => `${circleScale(d.value) / 1.5}px`);
      })
      .call(nodeDrag(simulation) as any);

    function ticked() {
      link
        .attr('x1', (d: SimulationLinkDatum<any>) => d.source.x)
        .attr('y1', (d: SimulationLinkDatum<any>) => d.source.y)
        .attr('x2', (d: SimulationLinkDatum<any>) => d.target.x)
        .attr('y2', (d: SimulationLinkDatum<any>) => d.target.y);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      text.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    }

    simulation.on('tick', ticked);

    svg.call(
      zoom()
        .scaleExtent([0.7, 1.5])
        .scaleExtent([0.7, 1.5])
        .extent([
          [0, 0],
          [width!, height!],
        ])
        .on('zoom', e => {
          svg.selectAll('g').attr('transform', e.transform);
        }) as any,
    );
  }, [
    circleScale,
    colorScale,
    data.links,
    data.nodes,
    getContrastColor,
    height,
    strokeScale,
    width,
  ]);

  useEffect(() => {
    if (data.nodes.length > 0) {
      drawChart();
    }
  }, [data.nodes.length, drawChart]);

  const drawLegend = useCallback(() => {
    const legendList =
      keyList ??
      data.nodes.reduce((acc: string[], cur: any) => {
        if (acc.indexOf(cur.group) === -1) {
          acc.push(cur.group);
        }
        return acc;
      }, []);

    if (legendList.length > 0) {
      return (
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translate(-50%, 0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            backgroundColor: 'white',
            paddingBottom: '0.5rem',
            zIndex: 1,
          }}
        >
          <ul
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${legendList.length}, minmax(0, 1fr))`,
              gap: '0.5rem',
            }}
          >
            {legendList.map(d => (
              <li
                key={`${id}-legend-${d}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  listStyle: 'none',
                }}
              >
                <svg width={15} height={15}>
                  <rect
                    x={0}
                    y={0}
                    width={15}
                    height={15}
                    fill={colorScale(d) as string}
                  />
                </svg>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return null;
  }, [colorScale, data.nodes, id, keyList]);

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {drawLegend()}
      <svg
        width={width}
        height={height}
        id={`${id}-chart`}
        clipPath={`url(#${id}-chart-clipPath)`}
        ref={svgRef}
      >
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
      </svg>
    </div>
  );
};

export default withParentSize(NetworkChart);
