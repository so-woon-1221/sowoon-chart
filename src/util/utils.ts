import { bisectCenter } from 'd3';
import { type ForwardedRef } from 'react';

const getFiniteValues = (values: readonly number[]) => {
  return values.filter((value) => Number.isFinite(value));
};

const normalizeDomain = (min: number, max: number): [number, number] => {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : 0;

  if (safeMin === safeMax) {
    if (safeMin === 0) {
      return [0, 1];
    }

    return safeMin > 0 ? [0, safeMin] : [safeMin, 0];
  }

  return [safeMin, safeMax];
};

export function getFiniteExtentDomain(
  values: readonly number[],
  minValue?: number,
  maxValue?: number,
): [number, number] {
  const finiteValues = getFiniteValues(values);
  const dataMin = finiteValues.length > 0 ? Math.min(...finiteValues) : 0;
  const dataMax = finiteValues.length > 0 ? Math.max(...finiteValues) : 1;
  const resolvedMin = Number.isFinite(minValue ?? dataMin) ? (minValue ?? dataMin) : 0;
  const resolvedMax = Number.isFinite(maxValue ?? dataMax) ? (maxValue ?? dataMax) : 1;

  if (resolvedMin === resolvedMax) {
    if (resolvedMin === 0) {
      return [0, 1];
    }

    const padding = Math.abs(resolvedMin) * 0.1;
    return [resolvedMin - padding, resolvedMax + padding];
  }

  return [resolvedMin, resolvedMax];
}

export function getZeroBaselineDomain(
  values: readonly number[],
  minValue?: number,
  maxValue?: number,
): [number, number] {
  const finiteValues = getFiniteValues(values);
  const dataMin = finiteValues.length > 0 ? Math.min(...finiteValues) : 0;
  const dataMax = finiteValues.length > 0 ? Math.max(...finiteValues) : 0;

  return normalizeDomain(minValue ?? Math.min(0, dataMin), maxValue ?? Math.max(0, dataMax));
}

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
