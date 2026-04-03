import { useCallback, useState } from 'react';

import type { TooltipAnchorMode } from '../util/types';

type TooltipPosition = {
  left: number;
  top: number;
};

type TooltipState<T> = TooltipPosition & {
  data: T | null;
  isOpen: boolean;
  positionMode: TooltipAnchorMode;
};

const defaultTooltipState = {
  left: 0,
  top: 0,
  data: null,
  isOpen: false,
  positionMode: 'cursor' as const,
};

export const useChartTooltip = <T>() => {
  const [tooltip, setTooltip] = useState<TooltipState<T>>(defaultTooltipState);

  const showTooltip = useCallback(
    ({
      left,
      top,
      data,
      positionMode = 'cursor',
    }: TooltipPosition & {
      data: T;
      positionMode?: TooltipAnchorMode;
    }) => {
      setTooltip({
        left,
        top,
        data,
        isOpen: true,
        positionMode,
      });
    },
    [],
  );

  const hideTooltip = useCallback(() => {
    setTooltip((prev) => {
      if (!prev.isOpen) {
        return prev;
      }

      return {
        ...prev,
        isOpen: false,
      };
    });
  }, []);

  return {
    tooltip,
    showTooltip,
    hideTooltip,
  };
};
