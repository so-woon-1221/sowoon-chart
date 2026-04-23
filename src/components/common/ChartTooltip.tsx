import type { ReactNode } from 'react';

import { useTooltipPlacement } from '../../hooks/useTooltipPlacement';

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
  const { ref } = useTooltipPlacement({
    left,
    top,
    offsetX: resolvedOffsetX,
    offsetY: resolvedOffsetY,
    align,
  });

  return (
    <div
      ref={ref}
      role="tooltip"
      aria-live="polite"
      style={{
        position: 'absolute',
        left,
        top,
        visibility: 'hidden',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {children}
    </div>
  );
};

export default ChartTooltip;
