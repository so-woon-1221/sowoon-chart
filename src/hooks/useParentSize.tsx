import { useCallback, useEffect, useRef, useState } from "react";

interface Size {
  width?: number;
  height?: number;
}

export const useParentSize = (props?: Size) => {
  const ref = useRef<HTMLDivElement>(null);
  const [parentWidth, setParentWidth] = useState<number>(0);
  const [parentHeight, setParentHeight] = useState<number>(0);

  const getSize = useCallback(() => {
    const parent = ref.current;
    if (parent) {
      const { width, height } = parent.getBoundingClientRect();
      setParentWidth(width);
      setParentHeight(height);
    }
  }, [ref]);

  useEffect(() => {
    getSize();
    window.addEventListener("resize", getSize);
    return () => window.removeEventListener("resize", getSize);
  }, [getSize]);

  return {
    ref,
    width: props?.width ?? parentWidth,
    height: props?.height ?? parentHeight,
  };
};
