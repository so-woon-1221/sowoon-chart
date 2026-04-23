import { hierarchy, hsl, pack } from 'd3';
import { useMemo } from 'react';

import { useParentSize } from '../../hooks/useParentSize';
import type { ChartProps, LegendProps } from '../../util/types';
import ChartLegend from '../common/ChartLegend';
import { getLegendRightInset } from '../common/chartLegend.utils';

/**
 * Props for {@link BubbleChart}.
 */
export type BubbleChartProps = Pick<ChartProps, 'width' | 'height' | 'data' | 'margin'> &
  LegendProps & {
    /**
     * Reserved slot for future custom overlays.
     */
    children?: React.ReactNode;
    /**
     * Color palette applied to bubble nodes in order.
     */
    colorList?: string[];
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
}: BubbleChartProps) => {
  const { ref: parentRef, height: parentHeight, width: parentWidth } = useParentSize();

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
    return pack<{ key: string; value: number }>()
      .size([layoutWidth - margin.left - margin.right, parentHeight - margin.top - margin.bottom])
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

  return (
    <div
      ref={parentRef}
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        position: 'relative',
      }}
    >
      <svg width={'100%'} height={'100%'}>
        <g className={'chart'}>
          {bubbleNodes.map((node, index) => {
            const fill = colorList[index % colorList.length];

            return <circle key={node.data.key} r={node.r} cx={node.x} cy={node.y} fill={fill} />;
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
      {children}
      {resolvedLegendItems.length > 0 && (
        <ChartLegend items={resolvedLegendItems} position={legendPosition} title={legendTitle} />
      )}
    </div>
  );
};

export default BubbleChart;
