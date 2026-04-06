/**
 * Flexible grouped or stacked row shape keyed by `x`.
 */
export type GroupedDatum = {
  x: string;
  [key: string]: number | string;
};
