import { useEffect, useRef, useState } from 'react';

interface Size {
  width?: number;
  height?: number;
}

/**
 * Measures the rendered size of the wrapping element and returns a ref to attach.
 * Explicit `width` and `height` override observed values when provided.
 */
export const useParentSize = (props?: Size) => {
  const ref = useRef<HTMLDivElement>(null);
  const [parentWidth, setParentWidth] = useState<number>(0);
  const [parentHeight, setParentHeight] = useState<number>(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const updateSize = (width: number, height: number) => {
      setParentWidth((prevWidth) => (prevWidth === width ? prevWidth : width));
      setParentHeight((prevHeight) => (prevHeight === height ? prevHeight : height));
    };

    const syncRectSize = () => {
      const { width, height } = element.getBoundingClientRect();
      updateSize(width, height);
    };

    syncRectSize();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', syncRectSize);
      return () => window.removeEventListener('resize', syncRectSize);
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) {
        return;
      }

      updateSize(entry.contentRect.width, entry.contentRect.height);
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return {
    ref,
    width: props?.width ?? parentWidth,
    height: props?.height ?? parentHeight,
  };
};
