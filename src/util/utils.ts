import { bisectCenter } from 'd3';
import { type ForwardedRef } from 'react';

export function getClosestIndex(positions: number[], point: number) {
  if (positions.length === 0) {
    return -1;
  }

  return Math.max(0, Math.min(positions.length - 1, bisectCenter(positions, point)));
}

export function isSameActivePoint<
  T extends {
    left: number;
    top: number;
    color: string;
  },
>(prev: T | null, next: T | null) {
  if (prev === next) {
    return true;
  }

  if (!prev || !next) {
    return false;
  }

  return prev.left === next.left && prev.top === next.top && prev.color === next.color;
}

export function mergeRefs<T>(...refs: ForwardedRef<T>[]) {
  return (node: T) => {
    refs.forEach((ref) => {
      if (ref && typeof ref !== 'function') {
        ref.current = node;
      }
    });
  };
}
