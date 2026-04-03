import {
  type AxisDomain,
  type AxisScale,
  bisectCenter,
  pointer,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  select,
  stack,
} from 'd3';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useChartTooltip } from '../../hooks/useChartTooltip';
import { useParentSize } from '../../hooks/useParentSize';
import type { ChartProps, TooltipPositionMode } from '../../util/types';
import CartesianFrame from '../common/CartesianFrame';
import ChartTooltip from '../common/ChartTooltip';

type DataType = {
  x: string;
  [key: string]: number | string;
};

type Props = Omit<ChartProps, 'data' | 'color'> & {
  /**
   * Data to display in the chart.
   */
  data: DataType[];
  /**
   * List of colors to use for the chart.
   * It will be used in order for each data.
   */
  colorList: string[];
  /**
   * Gap between the bars.
   */
  padding?: number;
  /**
   * Children to render in the
   * tooltip when it is open.
   * It will receive the tooltipData
   * as a prop.
   * @param tooltipData - The data of the tooltip.
   * @returns The children to render.
   */
  children?: ({ tooltipData }: { tooltipData: { x: string; y: number } }) => React.ReactNode;
  /**
   * Offset of the tooltip from the mouse pointer.
   * @default { x: 10, y: -10 }
   */
  tooltipOffset?: { x: number; y: number };
  /**
   * Tooltip anchor position.
   * `cursor` follows the mouse and `point` sticks to the matched data point.
   * @default "point"
   */
  tooltipPosition?: TooltipPositionMode;
};

const defaultMargin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 50,
};

const StackBarChart = ({
  width,
  height,
  margin = defaultMargin,
  data,
  colorList = ['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00'],
  maxY,
  padding = 0.1,
  children,
  tooltipOffset = { x: 10, y: -10 },
  tooltipPosition = 'point',
  showGridHorizontal = true,
  showGridVertical = true,
}: Props) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<{ x: string; y: number }>();

  const { ref: parentRef, height: parentHeight, width: parentWidth } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const keyList = useMemo(() => Object.keys(data[0]).filter((key) => key !== 'x'), [data]);

  const max = useMemo(() => {
    if (maxY) {
      return maxY;
    }
    return Math.max(...data.map((d) => keyList.reduce((acc, key) => acc + (d[key] as number), 0)));
  }, [data, keyList, maxY]);

  const colorScale = useMemo(() => {
    return scaleOrdinal().domain(keyList).range(colorList);
  }, [colorList, keyList]);

  const series = useMemo(() => {
    return stack<DataType>()
      .keys(keyList)
      .value((d, key) => (d[key] as number) ?? 0)(data);
  }, [data, keyList]);

  const x = useMemo(
    () =>
      scaleBand()
        .domain(data.map((d) => d.x))
        .range([margin.left, (parentWidth ?? 0) - margin.right])
        .padding(padding),
    [data, margin.left, margin.right, padding, parentWidth],
  );

  const y = useMemo(
    () =>
      scaleLinear()
        .domain([0, max])
        .range([(parentHeight ?? 0) - margin.bottom, margin.top]),
    [margin.bottom, margin.top, max, parentHeight],
  );

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select('.chart');

    const barGroup = chartContainer
      .selectAll('g')
      .data(series)
      .join('g')
      .attr('fill', (d) => colorScale(d.key) as string);
    barGroup
      .selectAll('rect')
      .data((d) => d)
      .join('rect')
      .attr('x', (d) => x(d.data.x)!)
      .attr('y', (d) => y(d[1]))
      .attr('height', (d) => y(d[0]) - y(d[1]))
      .attr('width', x.bandwidth())
      .on('mousemove', (e, d) => {
        const [pointerX, pointerY] = pointer(e, ref.current);
        const xPoint = pointerX - x.bandwidth() / 2;
        const xDomain = data.map((d) => x(d.x) as number);
        const index = Math.max(0, Math.min(xDomain.length - 1, bisectCenter(xDomain, xPoint)));

        const point = data[index];
        if (point) {
          const isPointTooltip = tooltipPosition === 'point';
          showTooltip({
            left: isPointTooltip ? x(point.x)! + x.bandwidth() / 2 : pointerX,
            top: isPointTooltip ? y(d[1]) : pointerY,
            data: { x: d.data.x, y: d[1] - d[0] },
          });
        }
      })
      .on('mouseout', hideTooltip);
  }, [colorScale, data, hideTooltip, series, showTooltip, tooltipPosition, x, y]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const legend = (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        display: 'flex',
        gap: '8px',
        fontSize: '14px',
        padding: '4px',
      }}
    >
      {keyList.map((key) => (
        <div
          key={`legend-${key}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <div
            style={{
              width: '14px',
              height: '14px',
              background: colorScale(key) as string,
            }}
          />
          <span>{key}</span>
        </div>
      ))}
    </div>
  );

  return (
    <CartesianFrame
      containerRef={parentRef}
      svgRef={ref}
      width={width}
      height={height}
      parentWidth={parentWidth}
      parentHeight={parentHeight}
      margin={margin}
      xScale={x as AxisScale<AxisDomain>}
      yScale={y as AxisScale<AxisDomain>}
      showGridVertical={showGridVertical}
      showGridHorizontal={showGridHorizontal}
      chart={<g className="chart" />}
      tooltip={
        children &&
        tooltip.isOpen &&
        tooltip.data && (
          <ChartTooltip
            left={tooltip.left}
            top={tooltip.top}
            align={tooltipPosition === 'point' ? 'center' : 'cursor'}
            offsetX={tooltipOffset.x}
            offsetY={tooltipOffset.y}
          >
            {children({
              tooltipData: tooltip.data,
            })}
          </ChartTooltip>
        )
      }
      overlay={legend}
      containerStyle={{
        display: 'flex',
        justifyContent: 'center',
      }}
    />
  );
};

export default StackBarChart;
