import type { ValueLabelFormatter } from '../../util/types';

export const formatValueLabel = <TData,>(
  value: number,
  datum: TData,
  formatter?: ValueLabelFormatter<TData>,
  key?: string,
) => {
  return String(formatter ? formatter(value, datum, key) : value);
};

export const getValueLabelDy = (value: number) => {
  return value >= 0 ? -8 : 14;
};
