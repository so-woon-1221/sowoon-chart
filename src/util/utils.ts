import { bisectCenter } from "d3";
import { type ForwardedRef } from "react";

export function getClosestIndex(positions: number[], point: number) {
  if (positions.length === 0) {
    return -1;
  }

  return Math.max(
    0,
    Math.min(positions.length - 1, bisectCenter(positions, point)),
  );
}

export function mergeRefs<T>(...refs: ForwardedRef<T>[]) {
  return (node: T) => {
    refs.forEach((ref) => {
      if (ref && typeof ref !== "function") {
        ref.current = node;
      }
    });
  };
}
