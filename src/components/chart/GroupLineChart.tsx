import {
  type AxisDomain,
  type AxisScale,
  line,
  pointer,
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  select,
} from 'd3';
import { type PointerEventHandler, useCallback, useEffect, useMemo, useRef } from 'react';

import { useChartTooltip } from '../../hooks/useChartTooltip';
import { useParentSize } from '../../hooks/useParentSize';
import type {
  CartesianChartProps,
  ColorListProps,
  GroupedDatum,
  ScatterDatum,
  TooltipOffset,
  TooltipPositionMode,
  TooltipRenderer,
  XYDatum,
} from '../../util/types';
import { getClosestIndex } from '../../util/utils';
import CartesianFrame from '../common/CartesianFrame';
import ChartTooltip from '../common/ChartTooltip';

type Props = CartesianChartProps<GroupedDatum> &
  ColorListProps & {
  /**
   * Data to display in the chart.
   */
  data: GroupedDatum[];
  /**
   * Tooltip children.
   * @param tooltipData
   */
  children?: TooltipRenderer<ScatterDatum>;
  /**
   * Offset of the tooltip from the mouse pointer.
   */
  tooltipOffset?: TooltipOffset;
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

const GroupLineChart = ({
  width,
  height,
  margin = defaultMargin,
  children,
  data,
  minY,
  maxY,
  colorList = ['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00'],
  tooltipOffset = { x: 10, y: -10 },
  tooltipPosition = 'point',
  showGridHorizontal = true,
  showGridVertical = true,
}: Props) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<ScatterDatum>();

  const { ref: parentRef, width: parentWidth, height: parentHeight } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const keyList = useMemo(() => {
    return Object.keys(data[0]).filter((key) => key !== 'x');
  }, [data]);

  const x = useMemo(() => {
    return scaleBand()
      .domain(data.map((d) => d.x))
      .range([margin.left, (parentWidth ?? 0) - margin.right]);
  }, [data, margin.left, margin.right, parentWidth]);

  const xPositions = useMemo(() => {
    return data.map((d) => (x(d.x) ?? 0) + x.bandwidth() / 2);
  }, [data, x]);

  const y = useMemo(() => {
    const maxYList = keyList.map((key) => {
      return Math.max(...data.map((d) => d[key] as number));
    });
    const max = Math.max(...maxYList);

    return scaleLinear()
      .domain([minY ?? 0, maxY ?? max])
      .range([(parentHeight ?? 0) - margin.bottom, margin.top]);
  }, [data, keyList, margin.bottom, margin.top, maxY, minY, parentHeight]);

  const colorScale = useMemo(() => {
    return scaleOrdinal().domain(keyList).range(colorList);
  }, [colorList, keyList]);

  const lineGenerator = useMemo(() => {
    return line<XYDatum>()
      .x((d) => (x(d.x) as number) + x.bandwidth() / 2)
      .y((d) => y(d.y));
  }, [x, y]);

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select('.chart');

    const lines = chartContainer.selectAll('g').data(keyList);

    lines
      .join('g')
      .attr('stroke', (key) => colorScale(key) as string)
      .selectAll('path')
      .data((key) => {
        return [data.map((d) => ({ x: d.x, y: d[key] as number }))];
      })
      .join('path')
      .attr('fill', 'none')
      .attr('stroke-width', 1.5)
      .attr('d', lineGenerator);
  }, [colorScale, data, keyList, lineGenerator]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const onMouseMove: PointerEventHandler = useCallback(
    (e) => {
      if (children) {
        const [xPoint, yPoint] = pointer(e);
        const index = getClosestIndex(xPositions, xPoint);
        const point = data[index];

        if (!point || keyList.length === 0) {
          return;
        }

        const yData = y.invert(yPoint);
        const yIndex = keyList.reduce((closestIndex, key, currentIndex) => {
          const currentValue = point[key];
          const closestValue = point[keyList[closestIndex]];

          if (typeof currentValue !== 'number' || typeof closestValue !== 'number') {
            return closestIndex;
          }

          return Math.abs(currentValue - yData) < Math.abs(closestValue - yData)
            ? currentIndex
            : closestIndex;
        }, 0);
        const value = point[keyList[yIndex]];

        if (typeof value !== 'number') {
          return;
        }

        const isPointTooltip = tooltipPosition === 'point';

        showTooltip({
          left: isPointTooltip ? xPositions[index] : xPoint,
          top: isPointTooltip ? y(value) : yPoint,
          data: {
            x: point.x,
            y: value,
            value,
          },
        });
      }
    },
    [children, data, keyList, showTooltip, tooltipPosition, xPositions, y],
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
      onPointerMove={onMouseMove}
      onPointerLeave={hideTooltip}
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
    />
  );
};

export default GroupLineChart;
