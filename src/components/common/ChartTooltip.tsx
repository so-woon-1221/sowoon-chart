import type { ReactNode } from 'react';

type Props = {
  left: number;
  top: number;
  children: ReactNode;
  offsetX?: number;
  offsetY?: number;
  align?: 'center' | 'cursor';
};

const ChartTooltip = ({ left, top, children, offsetX, offsetY, align = 'cursor' }: Props) => {
  const resolvedOffsetX = offsetX ?? (align === 'center' ? 0 : 12);
  const resolvedOffsetY = offsetY ?? -12;
  const transform =
    align === 'center'
      ? `translate(calc(-50% + ${resolvedOffsetX}px), calc(-100% + ${resolvedOffsetY}px))`
      : `translate(${resolvedOffsetX}px, calc(-100% + ${resolvedOffsetY}px))`;

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        transform,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {children}
    </div>
  );
};

export default ChartTooltip;
