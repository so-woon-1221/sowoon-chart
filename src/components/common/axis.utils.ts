import type { AxisDomain, AxisScale } from 'd3';

import type { AxisTickFormatter } from '../../util/types';

type TickableScale = AxisScale<AxisDomain> & {
  ticks?: (count?: number) => AxisDomain[];
  tickFormat?: (count?: number) => (value: AxisDomain, index: number) => string;
};

type BandLikeScale = AxisScale<AxisDomain> & {
  bandwidth?: () => number;
};

export type AxisTickItem = {
  value: AxisDomain;
  label: string;
  offset: number;
};

const getScaleTicks = (scale: AxisScale<AxisDomain>, count: number) => {
  const tickableScale = scale as TickableScale;

  if (typeof tickableScale.ticks === 'function') {
    return tickableScale.ticks(count);
  }

  const domain = scale.domain();

  if (count <= 0 || domain.length <= count) {
    return domain;
  }

  const step = Math.ceil(domain.length / count);
  return domain.filter((_, index) => index % step === 0);
};

const getScaleTickFormatter = (scale: AxisScale<AxisDomain>, count: number) => {
  const tickableScale = scale as TickableScale;

  if (typeof tickableScale.tickFormat === 'function') {
    return tickableScale.tickFormat(count);
  }

  return (value: AxisDomain) => String(value);
};

const getScaleBandwidth = (scale: AxisScale<AxisDomain>) => {
  const bandLikeScale = scale as BandLikeScale;

  return typeof bandLikeScale.bandwidth === 'function' ? bandLikeScale.bandwidth() : 0;
};

export const getAxisTickItems = (
  scale: AxisScale<AxisDomain>,
  count = 10,
  tickFormat?: AxisTickFormatter,
): AxisTickItem[] => {
  const defaultFormatter = getScaleTickFormatter(scale, count);
  const formatter = tickFormat ?? defaultFormatter;
  const bandwidthOffset = getScaleBandwidth(scale) / 2;

  return getScaleTicks(scale, count).flatMap((value, index) => {
    const scaled = scale(value);

    if (typeof scaled !== 'number') {
      return [];
    }

    return [
      {
        value,
        label: formatter(value, index),
        offset: scaled + bandwidthOffset,
      },
    ];
  });
};

export const getScaleRange = (scale: AxisScale<AxisDomain>) => {
  const range = scale.range();

  return {
    start: range[0] ?? 0,
    end: range[range.length - 1] ?? 0,
  };
};
