import { useCallback, useEffect, useRef, useState } from 'react';

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

const createDefaultTooltipState = <T>(): TooltipState<T> => ({
  left: 0,
  top: 0,
  data: null,
  isOpen: false,
  positionMode: 'cursor',
});

const isSameTooltipState = <T>(prev: TooltipState<T>, next: TooltipState<T>) => {
  return (
    prev.left === next.left &&
    prev.top === next.top &&
    prev.isOpen === next.isOpen &&
    prev.positionMode === next.positionMode &&
    prev.data === next.data
  );
};

export const useChartTooltip = <T>() => {
  const [tooltip, setTooltip] = useState<TooltipState<T>>(() => createDefaultTooltipState<T>());
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<TooltipState<T> | null>(null);
  const latestRef = useRef<TooltipState<T>>(createDefaultTooltipState<T>());

  useEffect(() => {
    latestRef.current = tooltip;
  }, [tooltip]);

  const flushPending = useCallback(() => {
    frameRef.current = null;

    const nextTooltip = pendingRef.current;
    pendingRef.current = null;

    if (!nextTooltip) {
      return;
    }

    setTooltip((prev) => {
      if (isSameTooltipState(prev, nextTooltip)) {
        latestRef.current = prev;
        return prev;
      }

      latestRef.current = nextTooltip;
      return nextTooltip;
    });
  }, []);

  const queueTooltip = useCallback(
    (nextTooltip: TooltipState<T>) => {
      pendingRef.current = nextTooltip;

      if (frameRef.current !== null) {
        return;
      }

      if (typeof window === 'undefined') {
        flushPending();
        return;
      }

      frameRef.current = window.requestAnimationFrame(flushPending);
    },
    [flushPending],
  );

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
      queueTooltip({
        left,
        top,
        data,
        isOpen: true,
        positionMode,
      });
    },
    [queueTooltip],
  );

  const hideTooltip = useCallback(() => {
    if (frameRef.current !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    pendingRef.current = null;

    setTooltip((prev) => {
      if (!prev.isOpen) {
        latestRef.current = prev;
        return prev;
      }

      const hiddenTooltip = {
        ...prev,
        isOpen: false,
      };

      latestRef.current = hiddenTooltip;
      return hiddenTooltip;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return {
    tooltip,
    showTooltip,
    hideTooltip,
  };
};
