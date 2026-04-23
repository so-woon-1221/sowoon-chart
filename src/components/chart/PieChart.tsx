import { arc, pie, type PieArcDatum, pointer, scaleOrdinal } from 'd3';
import { type PointerEvent, type ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { useChartTooltip } from '../../hooks/useChartTooltip';
import { useParentSize } from '../../hooks/useParentSize';
import {
  getEventPointerType,
  getTooltipAlign,
  resolveTooltipPositionMode,
} from '../../util/tooltip';
import type {
  BaseChartProps,
  LegendItem,
  LegendProps,
  TooltipOffset,
  TooltipPositionMode,
  TooltipRenderer,
  XYDatum,
} from '../../util/types';
import ChartLegend from '../common/ChartLegend';
import { getLegendRightInset } from '../common/chartLegend.utils';
import ChartTooltip from '../common/ChartTooltip';

/**
 * Props for {@link PieChart}.
 */
export type PieChartProps = Pick<BaseChartProps, 'width' | 'height'> & {
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
} & Omit<LegendProps, 'seriesName'>;

/**
 * Renders a donut-style pie chart with optional center content, legend highlighting, and tooltip support.
 */
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
  legendItems,
  legendPosition = 'bottom',
  legendTitle,
}: PieChartProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<XYDatum>();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const { ref: parentRef, width: parentWidth, height: parentHeight } = useParentSize();

  const ref = useRef<SVGSVGElement>(null);

  const pieWidth = useMemo(() => {
    return Math.max(parentWidth - getLegendRightInset(showLegend, legendPosition), 0);
  }, [legendPosition, parentWidth, showLegend]);

  const colorScale = useMemo(() => {
    return scaleOrdinal()
      .domain(data.map((d) => d.x))
      .range(colorList);
  }, [colorList, data]);

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

  const resolvedLegendItems = useMemo(() => {
    if (!showLegend) {
      return [];
    }

    if (legendItems?.length) {
      return legendItems;
    }

    return data.map((datum) => ({
      key: datum.x,
      label: datum.x,
      color: colorScale(datum.x) as string,
    }));
  }, [colorScale, data, legendItems, showLegend]);

  const handleSlicePointerMove = useCallback(
    (event: PointerEvent<SVGPathElement>, datum: PieArcDatum<XYDatum>) => {
      const [xPoint, yPoint] = pointer(event, ref.current ?? event.currentTarget);
      const [arcX, arcY] = arcValue.centroid(datum);
      const resolvedTooltipPosition = resolveTooltipPositionMode(
        tooltipPosition,
        getEventPointerType(event),
      );
      const isPointTooltip = resolvedTooltipPosition === 'point';

      setActiveKey(datum.data.x);
      showTooltip({
        left: isPointTooltip ? pieWidth / 2 + arcX : xPoint,
        top: isPointTooltip ? pieHeight / 2 + arcY : yPoint,
        data: datum.data,
        positionMode: resolvedTooltipPosition,
      });
    },
    [arcValue, pieHeight, pieWidth, showTooltip, tooltipPosition],
  );

  const handleSlicePointerEnd = useCallback(() => {
    setActiveKey(null);
    hideTooltip();
  }, [hideTooltip]);

  const handleLegendEnter = useCallback(
    (item: LegendItem) => {
      const datum = data.find((entry) => entry.x === item.key);
      setActiveKey(item.key);

      if (!children || !datum) {
        return;
      }

      const activeArc = chartData.find((entry) => entry.data.x === item.key);
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
    [arcValue, chartData, children, data, pieHeight, pieWidth, showTooltip],
  );

  const handleLegendLeave = useCallback(() => {
    setActiveKey(null);
    hideTooltip();
  }, [hideTooltip]);

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
        <g className={'chart'} transform={`translate(${pieWidth / 2}, ${pieHeight / 2})`}>
          {chartData.map((datum) => (
            <path
              key={datum.data.x}
              d={arcValue(datum) ?? undefined}
              fill={colorScale(datum.data.x) as string}
              opacity={!activeKey || datum.data.x === activeKey ? 1 : 0.35}
              stroke={activeKey === datum.data.x ? '#ffffff' : 'none'}
              strokeWidth={activeKey === datum.data.x ? 2 : 0}
              onPointerMove={(event) => handleSlicePointerMove(event, datum)}
              onPointerLeave={handleSlicePointerEnd}
              onPointerUp={handleSlicePointerEnd}
              onPointerCancel={handleSlicePointerEnd}
            />
          ))}
        </g>
      </svg>
      {centerNode && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: pieWidth / 2,
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
      {resolvedLegendItems.length > 0 && (
        <ChartLegend
          items={resolvedLegendItems}
          title={legendTitle}
          position={legendPosition}
          activeKey={activeKey}
          onItemEnter={handleLegendEnter}
          onItemLeave={handleLegendLeave}
          onItemFocus={handleLegendEnter}
          onItemBlur={handleLegendLeave}
        />
      )}
    </div>
  );
};

export default PieChart;
