import type { LegendPosition } from '../../util/types';

export const CHART_LEGEND_RIGHT_WIDTH = 132;
export const CHART_LEGEND_RIGHT_GAP = 12;

export const getLegendRightInset = (hasLegend: boolean, position: LegendPosition) => {
  if (!hasLegend || position !== 'right') {
    return 0;
  }

  return CHART_LEGEND_RIGHT_WIDTH + CHART_LEGEND_RIGHT_GAP;
};
