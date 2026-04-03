import { useLayoutEffect, useRef } from 'react';

type TooltipAlign = 'center' | 'cursor';

type TooltipPlacementOptions = {
  left: number;
  top: number;
  offsetX: number;
  offsetY: number;
  align: TooltipAlign;
  padding?: number;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

export const useTooltipPlacement = ({
  left,
  top,
  offsetX,
  offsetY,
  align,
  padding = 8,
}: TooltipPlacementOptions) => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const tooltipElement = ref.current;
    const containerElement = tooltipElement?.parentElement;

    if (!tooltipElement) {
      return;
    }

    if (!containerElement) {
      tooltipElement.style.left = `${left}px`;
      tooltipElement.style.top = `${top}px`;
      tooltipElement.style.visibility = 'visible';
      return;
    }

    const tooltipRect = tooltipElement.getBoundingClientRect();
    const containerRect = containerElement.getBoundingClientRect();
    const safePadding = Math.max(0, padding);
    const horizontalLeft =
      align === 'center' ? left - tooltipRect.width / 2 + offsetX : left + offsetX;
    const topGap = Math.max(8, Math.abs(offsetY));
    const aboveTop = top - tooltipRect.height + offsetY;
    const belowTop = top + topGap;
    const hasRoomBelow = belowTop + tooltipRect.height <= containerRect.height - safePadding;
    const resolvedTop = aboveTop < safePadding && hasRoomBelow ? belowTop : aboveTop;
    const maxLeft = Math.max(safePadding, containerRect.width - tooltipRect.width - safePadding);
    const maxTop = Math.max(safePadding, containerRect.height - tooltipRect.height - safePadding);

    tooltipElement.style.left = `${clamp(horizontalLeft, safePadding, maxLeft)}px`;
    tooltipElement.style.top = `${clamp(resolvedTop, safePadding, maxTop)}px`;
    tooltipElement.style.visibility = 'visible';
  }, [align, left, offsetX, offsetY, padding, top]);

  return {
    ref,
  };
};
