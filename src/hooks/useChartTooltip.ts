import { useCallback, useState } from 'react';

type TooltipPosition = {
  left: number;
  top: number;
};

type TooltipState<T> = TooltipPosition & {
  data: T | null;
  isOpen: boolean;
};

const defaultTooltipState = {
  left: 0,
  top: 0,
  data: null,
  isOpen: false,
};

export const useChartTooltip = <T>() => {
  const [tooltip, setTooltip] = useState<TooltipState<T>>(defaultTooltipState);

  const showTooltip = useCallback(
    ({
      left,
      top,
      data,
    }: TooltipPosition & {
      data: T;
    }) => {
      setTooltip({
        left,
        top,
        data,
        isOpen: true,
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
