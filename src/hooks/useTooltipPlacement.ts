import { useLayoutEffect, useRef, useState } from 'react';

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

type Size = {
  width: number;
  height: number;
};

const hasSizeChanged = (prev: Size, next: Size) => {
  return prev.width !== next.width || prev.height !== next.height;
};

const getTooltipSize = (element: HTMLDivElement) => {
  return {
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
};

const getContainerSize = (element: HTMLElement) => {
  return {
    width: element.clientWidth,
    height: element.clientHeight,
  };
};

/**
 * Positions an absolutely placed tooltip inside its parent container while preventing overflow.
 */
export const useTooltipPlacement = ({
  left,
  top,
  offsetX,
  offsetY,
  align,
  padding = 8,
}: TooltipPlacementOptions) => {
  const ref = useRef<HTMLDivElement>(null);
  const tooltipSizeRef = useRef<Size>({ width: 0, height: 0 });
  const containerSizeRef = useRef<Size>({ width: 0, height: 0 });
  const [layoutVersion, setLayoutVersion] = useState(0);

  useLayoutEffect(() => {
    const tooltipElement = ref.current;
    const containerElement = tooltipElement?.parentElement;

    if (!tooltipElement) {
      return;
    }

    const syncSizes = () => {
      const nextTooltipSize = getTooltipSize(tooltipElement);
      const nextContainerSize = containerElement
        ? getContainerSize(containerElement)
        : { width: 0, height: 0 };

      let hasChanged = false;

      if (hasSizeChanged(tooltipSizeRef.current, nextTooltipSize)) {
        tooltipSizeRef.current = nextTooltipSize;
        hasChanged = true;
      }

      if (hasSizeChanged(containerSizeRef.current, nextContainerSize)) {
        containerSizeRef.current = nextContainerSize;
        hasChanged = true;
      }

      if (hasChanged) {
        setLayoutVersion((prev) => prev + 1);
      }
    };

    syncSizes();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', syncSizes);

      return () => {
        window.removeEventListener('resize', syncSizes);
      };
    }

    const tooltipObserver = new ResizeObserver(() => {
      syncSizes();
    });

    tooltipObserver.observe(tooltipElement);

    const containerObserver = containerElement
      ? new ResizeObserver(() => {
          syncSizes();
        })
      : null;

    if (containerObserver && containerElement) {
      containerObserver.observe(containerElement);
    }

    return () => {
      tooltipObserver.disconnect();
      containerObserver?.disconnect();
    };
  }, []);

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

    const tooltipSize =
      tooltipSizeRef.current.width > 0 && tooltipSizeRef.current.height > 0
        ? tooltipSizeRef.current
        : getTooltipSize(tooltipElement);
    const containerSize =
      containerSizeRef.current.width > 0 && containerSizeRef.current.height > 0
        ? containerSizeRef.current
        : getContainerSize(containerElement);
    const safePadding = Math.max(0, padding);
    const horizontalLeft =
      align === 'center' ? left - tooltipSize.width / 2 + offsetX : left + offsetX;
    const topGap = Math.max(8, Math.abs(offsetY));
    const aboveTop = top - tooltipSize.height + offsetY;
    const belowTop = top + topGap;
    const hasRoomBelow = belowTop + tooltipSize.height <= containerSize.height - safePadding;
    const resolvedTop = aboveTop < safePadding && hasRoomBelow ? belowTop : aboveTop;
    const maxLeft = Math.max(safePadding, containerSize.width - tooltipSize.width - safePadding);
    const maxTop = Math.max(safePadding, containerSize.height - tooltipSize.height - safePadding);

    tooltipElement.style.left = `${clamp(horizontalLeft, safePadding, maxLeft)}px`;
    tooltipElement.style.top = `${clamp(resolvedTop, safePadding, maxTop)}px`;
    tooltipElement.style.visibility = 'visible';
  }, [align, layoutVersion, left, offsetX, offsetY, padding, top]);

  return {
    ref,
  };
};
