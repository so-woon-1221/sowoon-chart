import type { CSSProperties } from 'react';

import type { LegendItem, LegendPosition } from '../../util/types';
import { CHART_LEGEND_RIGHT_WIDTH } from './chartLegend.utils';

type ChartLegendProps = {
  items: LegendItem[];
  title?: string;
  position?: LegendPosition;
  activeKey?: string | null;
  onItemEnter?: (item: LegendItem) => void;
  onItemLeave?: () => void;
  onItemFocus?: (item: LegendItem) => void;
  onItemBlur?: () => void;
};

const getContainerStyle = (position: LegendPosition): CSSProperties => {
  if (position === 'right') {
    return {
      position: 'absolute',
      top: '50%',
      right: 0,
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      fontSize: '14px',
      padding: '4px',
      alignItems: 'flex-start',
      zIndex: 1,
      width: `${CHART_LEGEND_RIGHT_WIDTH}px`,
      maxWidth: `${CHART_LEGEND_RIGHT_WIDTH}px`,
    };
  }

  return {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '8px',
    fontSize: '14px',
    padding: '4px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '100%',
    zIndex: 1,
  };
};

const itemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

const buttonStyle: CSSProperties = {
  ...itemStyle,
  cursor: 'pointer',
  background: 'transparent',
  border: 0,
  padding: 0,
  color: 'inherit',
  font: 'inherit',
  outlineOffset: '2px',
  borderRadius: '2px',
  touchAction: 'manipulation',
};

const titleStyle: CSSProperties = {
  fontWeight: 600,
  width: '100%',
};

const swatchStyle = (color: string): CSSProperties => ({
  width: '14px',
  height: '14px',
  background: color,
  display: 'inline-block',
  borderRadius: '2px',
});

const ChartLegend = ({
  items,
  title,
  position = 'bottom',
  activeKey = null,
  onItemEnter,
  onItemLeave,
  onItemFocus,
  onItemBlur,
}: ChartLegendProps) => {
  if (items.length === 0) {
    return null;
  }

  const interactive = Boolean(onItemEnter || onItemLeave || onItemFocus || onItemBlur);
  const containerStyle = getContainerStyle(position);

  return (
    <div style={containerStyle} aria-label={title ?? 'Chart legend'}>
      {title && <div style={titleStyle}>{title}</div>}
      {items.map((item) => {
        const opacity = !activeKey || activeKey === item.key ? 1 : 0.45;

        if (interactive) {
          return (
            <button
              key={item.key}
              type="button"
              onPointerEnter={() => onItemEnter?.(item)}
              onPointerLeave={onItemLeave}
              onFocus={() => onItemFocus?.(item)}
              onBlur={onItemBlur}
              style={{
                ...buttonStyle,
                opacity,
              }}
            >
              <span aria-hidden="true" style={swatchStyle(item.color)} />
              <span>{item.label}</span>
            </button>
          );
        }

        return (
          <div
            key={item.key}
            style={{
              ...itemStyle,
              opacity,
            }}
          >
            <span aria-hidden="true" style={swatchStyle(item.color)} />
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ChartLegend;
