import { hierarchy, hsl, pack, pointer } from 'd3';
import { type PointerEvent, type ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { useChartTooltip } from '../../hooks/useChartTooltip';
import { useParentSize } from '../../hooks/useParentSize';
import {
  getEventPointerType,
  getTooltipAlign,
  resolveTooltipPositionMode,
} from '../../util/tooltip';
import type {
  ChartProps,
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
 * Props for {@link BubbleChart}.
 */
export type BubbleChartProps = Pick<
  ChartProps,
  'ariaDescription' | 'ariaLabel' | 'data' | 'height' | 'margin' | 'width'
> &
  LegendProps & {
    /**
     * Custom tooltip renderer shown while hovering a bubble.
     */
    children?: ReactNode | TooltipRenderer<XYDatum>;
    /**
     * Color palette applied to bubble nodes in order.
     */
    colorList?: string[];
    /**
     * Offset of the tooltip from the pointer or bubble.
     * @default { x: 10, y: -10 }
     */
    tooltipOffset?: TooltipOffset;
    /**
     * Tooltip anchor position.
     * @default "point"
     */
    tooltipPosition?: TooltipPositionMode;
  };

/**
 * Renders packed circles sized by each datum's `y` value.
 */
const BubbleChart = ({
  width,
  height,
  data,
  margin = { top: 10, left: 30, right: 30, bottom: 10 },
  colorList = ['#0A0908', '#0891b2', '#C6AC8F', '#60D394', '#D1495B', '#9b5de5'],
  showLegend = false,
  legendItems,
  legendPosition = 'bottom',
  legendTitle,
  seriesName,
  children,
  tooltipOffset = { x: 10, y: -10 },
  tooltipPosition = 'point',
  ariaLabel = 'Bubble chart',
  ariaDescription,
}: BubbleChartProps) => {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip<XYDatum>();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const { ref: parentRef, height: parentHeight, width: parentWidth } = useParentSize();
  const svgRef = useRef<SVGSVGElement>(null);

  const tooltipRenderer = typeof children === 'function' ? children : null;
  const overlayNode = typeof children === 'function' ? null : children;

  const layoutWidth = useMemo(() => {
    return Math.max(parentWidth - getLegendRightInset(showLegend, legendPosition), 0);
  }, [legendPosition, parentWidth, showLegend]);

  const packData = useMemo(() => {
    return {
      children: data.map((d) => ({ key: d.x, value: d.y })),
      key: '전체',
      value: 0,
    };
  }, [data]);

  const root = useMemo(
    () => hierarchy<{ key: string; value: number }>(packData).sum((d) => d.value),
    [packData],
  );

  const packGenerator = useMemo(() => {
    const chartWidth = Math.max(layoutWidth - margin.left - margin.right, 0);
    const chartHeight = Math.max(parentHeight - margin.top - margin.bottom, 0);

    return pack<{ key: string; value: number }>()
      .size([chartWidth, chartHeight])
      .padding(1);
  }, [layoutWidth, margin.bottom, margin.left, margin.right, margin.top, parentHeight]);

  const resolvedLegendItems = useMemo(() => {
    if (!showLegend) {
      return [];
    }

    if (legendItems?.length) {
      return legendItems;
    }

    return [
      {
        key: 'bubble',
        label: seriesName ?? 'Bubbles',
        color: colorList[0] ?? '#0A0908',
      },
    ];
  }, [colorList, legendItems, seriesName, showLegend]);

  const bubbleNodes = useMemo(() => {
    return packGenerator(root).descendants().slice(1);
  }, [packGenerator, root]);

  const showBubbleTooltip = useCallback(
    (
      event: PointerEvent<SVGCircleElement>,
      datum: XYDatum,
      point: { x: number; y: number },
    ) => {
      setActiveKey(datum.x);

      if (!tooltipRenderer) {
        return;
      }

      const [xPoint, yPoint] = pointer(event, svgRef.current ?? event.currentTarget);
      const resolvedTooltipPosition = resolveTooltipPositionMode(
        tooltipPosition,
        getEventPointerType(event),
      );
      const isPointTooltip = resolvedTooltipPosition === 'point';

      showTooltip({
        left: isPointTooltip ? point.x : xPoint,
        top: isPointTooltip ? point.y : yPoint,
        data: datum,
        positionMode: resolvedTooltipPosition,
      });
    },
    [showTooltip, tooltipPosition, tooltipRenderer],
  );

  const hideBubbleTooltip = useCallback(() => {
    setActiveKey(null);
    hideTooltip();
  }, [hideTooltip]);

  const focusBubble = useCallback(
    (datum: XYDatum, point: { x: number; y: number }) => {
      setActiveKey(datum.x);

      if (!tooltipRenderer) {
        return;
      }

      showTooltip({
        left: point.x,
        top: point.y,
        data: datum,
        positionMode: 'point',
      });
    },
    [showTooltip, tooltipRenderer],
  );

  return (
    <div
      ref={parentRef}
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        position: 'relative',
      }}
    >
      <svg width={'100%'} height={'100%'} ref={svgRef} role="img" aria-label={ariaLabel}>
        <title>{ariaLabel}</title>
        {ariaDescription && <desc>{ariaDescription}</desc>}
        <g className={'chart'}>
          {bubbleNodes.map((node, index) => {
            const fill = colorList[index % colorList.length];
            const datum = { x: node.data.key, y: node.data.value };

            return (
              <circle
                key={node.data.key}
                r={node.r}
                cx={node.x}
                cy={node.y}
                fill={fill}
                opacity={!activeKey || activeKey === node.data.key ? 1 : 0.35}
                cursor={tooltipRenderer ? 'pointer' : 'default'}
                tabIndex={tooltipRenderer ? 0 : undefined}
                aria-label={tooltipRenderer ? `${datum.x}: ${datum.y}` : undefined}
                onPointerMove={(event) =>
                  showBubbleTooltip(event, datum, { x: node.x, y: node.y })
                }
                onPointerLeave={hideBubbleTooltip}
                onPointerUp={hideBubbleTooltip}
                onPointerCancel={hideBubbleTooltip}
                onFocus={() => focusBubble(datum, { x: node.x, y: node.y })}
                onBlur={hideBubbleTooltip}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    hideBubbleTooltip();
                  }
                }}
              />
            );
          })}
          {bubbleNodes.map((node, index) => {
            const backgroundColor = colorList[index % colorList.length];
            const colorObj = hsl(backgroundColor);

            return (
              <text
                key={node.data.key}
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={15}
                fontWeight={700}
                fontFamily="Noto Sans KR"
                fill={colorObj.l > 0.5 ? 'black' : 'white'}
              >
                {node.data.key}
              </text>
            );
          })}
        </g>
      </svg>
      {overlayNode}
      {resolvedLegendItems.length > 0 && (
        <ChartLegend items={resolvedLegendItems} position={legendPosition} title={legendTitle} />
      )}
      {tooltipRenderer && tooltip.isOpen && tooltip.data && (
        <ChartTooltip
          left={tooltip.left}
          top={tooltip.top}
          align={getTooltipAlign(tooltip.positionMode)}
          offsetX={tooltipOffset.x}
          offsetY={tooltipOffset.y}
        >
          {tooltipRenderer({ tooltipData: tooltip.data })}
        </ChartTooltip>
      )}
    </div>
  );
};

export default BubbleChart;
