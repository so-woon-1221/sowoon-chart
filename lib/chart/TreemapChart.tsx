import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { select, pointer } from 'd3-selection';
import { stratify, treemap } from 'd3-hierarchy';
import { extent, sum } from 'd3-array';
import { scaleLog } from 'd3-scale';
import type { HierarchyNode } from 'd3-hierarchy';
import { TooltipWithBounds as Tooltip } from '@visx/tooltip';
import withParentSize from '../hooks/withParentSize';

interface Props {
  data: Array<{ id: string; parent: string | null; value: number | null }>;
  width?: number;
  height?: number;
  id: string;
  colorSet?: string[];
}

const margin = { left: 15, right: 15, top: 15, bottom: 15 };

const Treemap: ComponentType<Props> = ({
  data,
  id,
  width,
  height,
  colorSet = ['#ef4444', '#0891b2'],
}) => {
  const [isTransitionEnd, setIsTransitionEnd] = useState(true);

  const colorScale = useMemo(
    () =>
      scaleLog()
        .domain(
          extent(
            data
              .filter(
                d => d.parent !== null && d.value !== null && d.value! > 0,
              )
              .map(d => d.value!),
          ) as any,
        )
        .range(colorSet as any),
    [colorSet, data],
  );

  const [tooltipData, setTooltipData] = useState<
    | {
        parent: string;
        key: string;
        value: number;
        x: number | undefined;
        y: number | undefined;
      }
    | undefined
  >();

  const totalSum = useMemo(
    () =>
      sum(
        data
          .filter(d => d.parent !== null || d.id !== '기타')
          .map(d => d.value),
      ),
    [data],
  );

  const drawChart = useCallback(() => {
    const chartArea = select(`#${id}-tree`).attr(
      'transform',
      `translate(${(margin.left + margin.right) / 2}, ${
        (margin.top + margin.bottom) / 2
      })`,
    );
    const clipPathArea = select(`#${id}-clip-path`).attr(
      'transform',
      `translate(${(margin.left + margin.right) / 2}, ${
        (margin.top + margin.bottom) / 2
      })`,
    );
    const textArea = select(`#${id}-text`).attr(
      'transform',
      `translate(${(margin.left + margin.right) / 2}, ${
        (margin.top + margin.bottom) / 2
      })`,
    );
    const numberArea = select(`#${id}-number`).attr(
      'transform',
      `translate(${(margin.left + margin.right) / 2}, ${
        (margin.top + margin.bottom) / 2
      })`,
    );

    const root = stratify()
      .id((d: any) => d.id)
      .parentId((d: any) => d.parent)(data);
    root.sum((d: any) => d.value || 0);

    treemap()
      .size([
        width! - (margin.left + margin.right),
        height! - (margin.top + margin.bottom),
      ])
      .padding(0)(root);

    chartArea
      .selectAll('rect')
      .data(root.leaves())
      .join(enter =>
        enter
          .append('rect')
          .attr('x', (d: any) => d.x0)
          .attr('y', (d: any) => d.y0)
          .attr('width', (d: any) => (d.x1 - d.x0) / 2)
          .attr('height', (d: any) => (d.y1 - d.y0) / 2),
      )
      .attr('cursor', 'pointer')
      .on('pointermove', (e, d: HierarchyNode<any>) => {
        if (d.value && d.parent?.value && isTransitionEnd) {
          setTooltipData({
            parent: d.data.parent,
            key: d.data.id,
            value: d.value,
            x: pointer(e)[0] + 15,
            y: pointer(e)[1] + 10,
          });
        } else {
          setTooltipData(undefined);
        }
      })
      .on('mouseleave', () => {
        setTooltipData(undefined);
      })
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      // .transition()
      // .on('end', () => setIsTransitionEnd(true))
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .style('stroke', '#eee')
      .style('fill', (d: any) => colorScale(d.value));

    clipPathArea
      .selectAll('clipPath')
      .data(root.leaves())
      .join('clipPath')
      .attr('id', d => `${id}-${d.id!.replace(/ /g, '')}`)
      .selectAll('rect')
      .data(d => [d])
      .join('rect')
      .attr('x', (d: any) => d.x0 + 8)
      .attr('y', (d: any) => d.y0)
      .attr('width', (d: any) => d.x1 - d.x0 - 16)
      .attr('height', (d: any) => d.y1 - d.y0 - 8);

    textArea
      .selectAll('g')
      .data(root.leaves())
      .join('g')
      .attr('clip-path', d => `url(#${id}-${d.id!.replace(/ /g, '')})`)
      .selectAll('text')
      .data(d => [d])
      .join('text')
      .call(() => {})
      .attr('x', (d: any) => d.x0 + 8)
      .attr('y', (d: any) => d.y0 + 18)
      .text((d: any) => d.id)
      .style('font-size', '12px')
      .attr('fill', 'white')
      .attr('pointer-events', 'none');

    numberArea
      .selectAll('g')
      .data(root.leaves())
      .join('g')
      .attr('clip-path', d => `url(#${id}-${d.id!.replace(/ /g, '')})`)
      .selectAll('text')
      .data(d => [d])
      .join('text')
      .call(() => {})
      .attr('x', (d: any) => d.x0 + 8)
      .attr('y', (d: any) => d.y0 + 36)
      .text(
        (d: any) =>
          `${((+d.data.value / totalSum) * 100).toLocaleString('ko', {
            maximumFractionDigits: 2,
          })}%`,
      )
      .style('font-size', '12px')
      .attr('fill', 'white')
      .attr('pointer-events', 'none');

    return null;
  }, [colorScale, data, height, id, isTransitionEnd, totalSum, width]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div className="relative h-full w-full">
      <svg width={width} height={height}>
        <g>
          <g id={`${id}-tree`} />
          <g id={`${id}-clip-path`} />
          <g id={`${id}-text`} />
          <g id={`${id}-number`} />
        </g>
      </svg>
      {tooltipData && (
        <Tooltip
          left={tooltipData?.x ? tooltipData.x : 0}
          top={tooltipData?.y ? tooltipData.y : 0}
          id={`${id}-chart-tooltip`}
        >
          <div className="gap-y-1 text-sm dark:text-zinc-700">
            <div className="flex flex-col gap-y-1 dark:text-zinc-700">
              <span>{tooltipData.key}</span>
              <span className="font-bold">
                {tooltipData?.value.toLocaleString('ko-KR', {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </Tooltip>
      )}
    </div>
  );
};

export default withParentSize(Treemap);
