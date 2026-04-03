import { arc, pie, type PieArcDatum, pointer, scaleOrdinal, select } from 'd3';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useChartTooltip } from '../../hooks/useChartTooltip';
import { useParentSize } from '../../hooks/useParentSize';
import { getEventPointerType, getTooltipAlign, resolveTooltipPositionMode } from '../../util/tooltip';
import type {
  BaseChartProps,
  TooltipOffset,
  TooltipPositionMode,
  TooltipRenderer,
  XYDatum,
} from '../../util/types';
import ChartTooltip from '../common/ChartTooltip';

type Props = Pick<BaseChartProps, 'width' | 'height'> & {
  data: XYDatum[];
  /**
   * Center node to display in the middle of the pie chart.
   */
  centerNode?: ReactNode;
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
  children?: TooltipRenderer<XYDatum>;
  /**
   * Offset of the tooltip from the mouse pointer.
   * @default { x: 10, y: -10 }
   */
  tooltipOffset?: TooltipOffset;
  /**
   * Tooltip anchor position.
   * `cursor` follows the mouse and `point` sticks to the matched pie slice.
   * @default "cursor"
   */
  tooltipPosition?: TooltipPositionMode;
  /**
   * Show a legend below the chart.
   * Hovering legend items will highlight the related slice.
   * @default false
   */
  showLegend?: boolean;
};

const PieChart = ({
  width,
  height,
  colorList = ['#0A0908', '#0891b2', '#C6AC8F', '#60D394', '#D1495B', '#9b5de5'],
  data,
  centerNode,
  children,
  tooltipOffset = { x: 10, y: -10 },
  tooltipPosition = 'cursor',
  showLegend = false,
}: Props) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<XYDatum>();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const { ref: parentRef, width: parentWidth, height: parentHeight } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const colorScale = useMemo(() => {
    return scaleOrdinal()
      .domain(data.map((d) => d.x))
      .range(colorList);
  }, [colorList, data]);

  const pieWidth = parentWidth;
  const pieHeight = parentHeight;

  const radius = useMemo(() => Math.min(pieWidth, pieHeight) / 2, [pieHeight, pieWidth]);

  const arcValue = useMemo(() => {
    return arc<PieArcDatum<XYDatum>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.85);
  }, [radius]);

  const chartData = useMemo(() => {
    const pieGenerator = pie<XYDatum>()
      .sort(null)
      .value((d) => d.y);

    return pieGenerator(data);
  }, [data]);

  const drawChart = useCallback(() => {
    const svg = select(ref.current);
    const chartContainer = svg.select('.chart');

    const pies = chartContainer.selectAll('path').data(chartData);
    pies
      .join('path')
      .attr('transform', `translate(${pieWidth / 2}, ${pieHeight! / 2})`)
      .attr('fill', (d) => colorScale(d.data.x) as string)
      .attr('d', arcValue)
      .attr('opacity', (d) => (!activeKey || d.data.x === activeKey ? 1 : 0.35))
      .attr('stroke', (d) => (activeKey === d.data.x ? '#ffffff' : 'none'))
      .attr('stroke-width', (d) => (activeKey === d.data.x ? 2 : 0));

    pies
      .on('pointermove', (e, d) => {
        const [xPoint, yPoint] = pointer(e, ref.current);
        const [arcX, arcY] = arcValue.centroid(d);
        const resolvedTooltipPosition = resolveTooltipPositionMode(
          tooltipPosition,
          getEventPointerType(e),
        );
        const isPointTooltip = resolvedTooltipPosition === 'point';
        setActiveKey(d.data.x);
        showTooltip({
          left: isPointTooltip ? pieWidth / 2 + arcX : xPoint,
          top: isPointTooltip ? pieHeight / 2 + arcY : yPoint,
          data: d.data,
          positionMode: resolvedTooltipPosition,
        });
      })
      .on('pointerleave', () => {
        setActiveKey(null);
        hideTooltip();
      })
      .on('pointerup', () => {
        setActiveKey(null);
        hideTooltip();
      })
      .on('pointercancel', () => {
        setActiveKey(null);
        hideTooltip();
      });
  }, [
    activeKey,
    arcValue,
    chartData,
    colorScale,
    hideTooltip,
    pieHeight,
    pieWidth,
    showTooltip,
    tooltipPosition,
  ]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const handleLegendEnter = useCallback(
    (datum: XYDatum) => {
      setActiveKey(datum.x);

      if (!children) {
        return;
      }

      const activeArc = chartData.find((entry) => entry.data.x === datum.x);
      if (!activeArc) {
        return;
      }

      const [arcX, arcY] = arcValue.centroid(activeArc);
      showTooltip({
        left: pieWidth / 2 + arcX,
        top: pieHeight / 2 + arcY,
        data: datum,
        positionMode: 'point',
      });
    },
    [arcValue, chartData, children, pieHeight, pieWidth, showTooltip],
  );

  const handleLegendLeave = useCallback(() => {
    setActiveKey(null);
    hideTooltip();
  }, [hideTooltip]);

  const legend = showLegend ? (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        display: 'flex',
        gap: '8px',
        fontSize: '14px',
        padding: '4px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      {data.map((datum) => (
        <button
          key={`legend-${datum.x}`}
          type="button"
          onPointerEnter={() => handleLegendEnter(datum)}
          onPointerLeave={handleLegendLeave}
          onFocus={() => handleLegendEnter(datum)}
          onBlur={handleLegendLeave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
            opacity: !activeKey || activeKey === datum.x ? 1 : 0.45,
          }}
        >
          <span
            style={{
              width: '14px',
              height: '14px',
              background: colorScale(datum.x) as string,
              display: 'inline-block',
            }}
          />
          <span>{datum.x}</span>
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div
      ref={parentRef}
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        position: 'relative',
      }}
    >
      <svg width={'100%'} height={'100%'} ref={ref}>
        <g className={'chart'} />
      </svg>
      {centerNode && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {centerNode}
        </div>
      )}
      {children && tooltip.isOpen && tooltip.data && (
        <ChartTooltip
          left={tooltip.left}
          top={tooltip.top}
          align={getTooltipAlign(tooltip.positionMode)}
          offsetX={tooltipOffset.x}
          offsetY={tooltipOffset.y}
        >
          {children({ tooltipData: tooltip.data })}
        </ChartTooltip>
      )}
      {legend}
    </div>
  );
};

export default PieChart;
