import { scaleOrdinal } from 'd3-scale';
import { select } from 'd3-selection';
import { arc, pie } from 'd3-shape';
import React, { useCallback, useMemo, useState } from 'react';

import type { ComponentType } from 'react';
import withParentSize from '../hooks/withParentSize';

interface Props {
  /**
   * data
   * - key :
   *   - key of the data
   *   - type: string
   * - value :
   *  - value of the data
   *  - type: number
   */
  data: Array<{ key: string; value: number; description?: string }>;
  /**
   * List of colors for the graph
   * - Colors are applied in the order of the keyList
   * - If the length of colorList is shorter than that of keyList, the last color in colorList is repeated.
   * - If the length of colorList is longer than that of keyList, the excess part of colorList is ignored.
   */
  colorList: Array<string>;
  width?: number;
  height?: number;
  /**
   * id
   * - id of svg
   */
  id: string;
}

const legendWidth = 200;

const PieChart: ComponentType<Props> = ({
  data,
  colorList,
  width,
  height,
  id,
}) => {
  const [tooltipData, setTooltipData] = useState<{
    key: string;
    value: number;
    description?: string;
  }>();

  const color = useMemo(
    () =>
      scaleOrdinal()
        .domain(data.map(d => d.key))
        .range(colorList),
    [colorList, data],
  );

  const drawChart = useCallback(() => {
    const pieWidth = width! - legendWidth;
    const pieHeight = height!;
    // 차트 그리기 ////////////////////////////////////////////////////////////////////
    const radius = Math.min(pieWidth, pieHeight) / 2;
    const arcValue = arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.85)
      .cornerRadius(3)
      .padAngle(0.005);

    const pieGenerator = pie()
      .sort(null)
      .value((d: any) => d.value);

    const chartData = pieGenerator(data as any);

    select(`#${id}-pie-chart`)
      .selectAll('path')
      .data(chartData)
      .join('path')
      .attr('transform', `translate(${pieWidth / 2}, ${pieHeight! / 2})`)
      .attr('fill', (d: any) => color(d.data.key) as string)
      .attr('stroke', 'rgba(0,0,0,0.3)')
      .on('mouseover touchmove', function handler(_, d: any) {
        select(this)
          .transition()
          .attr(
            'transform',
            `translate(${pieWidth / 2}, ${pieHeight! / 2}) scale(1.05)`,
          )
          .attr('filter', 'drop-shadow(1px 1px 4px rgba(0,0,0,0.4))');
        setTooltipData({
          key: d.data.key,
          value: d.data.value,
          description: d.data.description,
        });
      })
      .on('mouseleave touchend', function handler() {
        select(this)
          .transition()
          .attr(
            'transform',
            `translate(${pieWidth / 2}, ${pieHeight! / 2}) scale(1)`,
          )
          .attr('filter', '');
        setTooltipData(undefined);
      });
    select(`#${id}-pie-chart`)
      .selectAll('path')
      .attr('d', arcValue as any);
    /// //
    return <g id={`${id}-pie-chart`} />;
  }, [color, data, height, id, width]);

  const drawLegend = useCallback(
    () =>
      color.domain().map((d: string, i) => (
        <div key={`legend-${d}`}>
          {i > 0 && (
            <div
              style={{
                width: '100%',
                height: 1,
                backgroundColor: 'rgba(0,0,0,0.1)',
              }}
            />
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.2rem',
            }}
          >
            <div
              style={{
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <svg width={15} height={15}>
                <rect
                  x={0}
                  y={0}
                  width={15}
                  height={15}
                  fill={color(d) as string}
                />
              </svg>
              <span>{data.find(row => row.key === d)?.description ?? d}</span>
            </div>
            <span>
              {data
                .find(row => row.key === d)
                ?.value.toLocaleString('ko', {
                  maximumFractionDigits: 1,
                })}
            </span>
          </div>
        </div>
      )),
    [color, data],
  );

  return (
    <div
      style={{
        width: width!,
        height: height!,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          width: `calc(100% - ${legendWidth}px)`,
          height: '100%',
        }}
      >
        <svg width={width! - legendWidth} height={height}>
          {drawChart()}
        </svg>
        {tooltipData && (
          <div
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <span>{tooltipData.description ?? tooltipData.key}</span>
              <span>
                {tooltipData.value.toLocaleString('ko', {
                  maximumFractionDigits: 1,
                })}
              </span>
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          display: 'grid',
          overflowY: 'auto',
          gap: '0.5rem',
          width: legendWidth,
          maxHeight: `${height! - 50}px`,
          marginRight: '1rem',
        }}
      >
        {drawLegend()}
      </div>
    </div>
  );
};

export default withParentSize(PieChart);
