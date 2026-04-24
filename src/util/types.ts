import type { AxisDomain } from 'd3';
import type { ReactNode } from 'react';

/**
 * Margin values around a chart drawing area.
 */
export type Margin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

/**
 * Pixel offset applied to tooltip placement.
 */
export type TooltipOffset = {
  x: number;
  y: number;
};

/**
 * Concrete tooltip anchor modes used at render time.
 */
export type TooltipAnchorMode = 'cursor' | 'point';

/**
 * Public tooltip placement options.
 */
export type TooltipPositionMode = TooltipAnchorMode | 'auto';

/**
 * Legend placement relative to the chart.
 */
export type LegendPosition = 'bottom' | 'right';

/**
 * One rendered legend entry.
 */
export type LegendItem = {
  key: string;
  label: string;
  color: string;
};

/**
 * Accessibility text exposed to assistive technologies.
 */
export interface AccessibilityProps {
  /**
   * Accessible name for the rendered chart.
   */
  ariaLabel?: string;
  /**
   * Longer accessible description for the rendered chart.
   */
  ariaDescription?: string;
}

/**
 * Shared x/y data shape used by single-series charts.
 */
export type XYDatum = {
  x: string;
  y: number;
};

/**
 * Props passed into a tooltip render function.
 */
export type TooltipRenderProps<TData> = {
  tooltipData: TData;
};

/**
 * Render function used by tooltip-enabled charts.
 */
export type TooltipRenderer<TData> = (props: TooltipRenderProps<TData>) => ReactNode;

/**
 * Formats one axis tick label.
 */
export type AxisTickFormatter = (value: AxisDomain, index: number) => string;

export interface AxisOptionProps {
  /**
   * Preferred number of x-axis ticks.
   */
  xTickCount?: number;
  /**
   * Preferred number of y-axis ticks.
   */
  yTickCount?: number;
  /**
   * Custom x-axis tick label formatter.
   */
  xTickFormat?: AxisTickFormatter;
  /**
   * Custom y-axis tick label formatter.
   */
  yTickFormat?: AxisTickFormatter;
  /**
   * Angle in degrees for x-axis tick labels.
   * @default 0
   */
  xTickAngle?: number;
  /**
   * Optional x-axis label.
   */
  xAxisLabel?: string;
  /**
   * Optional y-axis label.
   */
  yAxisLabel?: string;
}

/**
 * Formats one rendered value label.
 */
export type ValueLabelFormatter<TData> = (
  value: number,
  datum: TData,
  key?: string,
) => string | number;

export interface ValueLabelProps<TData = XYDatum> {
  /**
   * Show value labels near chart marks.
   * @default false
   */
  showValueLabels?: boolean;
  /**
   * Custom value label formatter.
   */
  valueLabelFormatter?: ValueLabelFormatter<TData>;
}

export interface TooltipInteractionProps {
  /**
   * Tooltip anchor position.
   * `cursor` follows the pointer, `point` sticks to the matched chart point,
   * and `auto` uses cursor for mouse but switches to point on touch and pen input.
   */
  tooltipPosition?: TooltipPositionMode;
  /**
   * Show an active point marker while hovering.
   * @default false
   */
  showActiveMarker?: boolean;
  /**
   * Show crosshair guides while hovering.
   * @default false
   */
  showCrosshair?: boolean;
}

export interface BaseChartProps extends AccessibilityProps {
  /**
   * Width of the chart.
   */
  width?: number;
  /**
   * Height of the chart.
   */
  height?: number;
  /**
   * Margin around the chart.
   * @default { top: 20, right: 20, bottom: 50, left: 50 }
   */
  margin?: Margin;
}

export interface LegendProps {
  /**
   * Toggle legend rendering.
   * @default false
   */
  showLegend?: boolean;
  /**
   * Optional manual legend items. When omitted, charts may derive items from their own data.
   */
  legendItems?: LegendItem[];
  /**
   * Legend placement relative to the chart.
   * @default "bottom"
   */
  legendPosition?: LegendPosition;
  /**
   * Optional legend heading.
   */
  legendTitle?: string;
  /**
   * Display label used by single-series charts when auto-generating legend items.
   */
  seriesName?: string;
}

export interface CartesianChartProps<TData = XYDatum>
  extends BaseChartProps,
    AxisOptionProps,
    ValueLabelProps<TData> {
  /**
   * Data to be displayed in the chart.
   */
  data: TData[];
  /**
   * Minimum value for the y-axis.
   * If omitted, each chart chooses its own default baseline.
   */
  minY?: number;
  /**
   * Maximum value for the y-axis.
   * If omitted, each chart derives a sensible maximum from the data.
   */
  maxY?: number;
  /**
   * Display grid lines along the x-axis.
   */
  showGridVertical?: boolean;
  /**
   * Display grid lines along the y-axis.
   */
  showGridHorizontal?: boolean;
}

export interface ColorListProps {
  colorList?: string[];
}

/**
 * Shared Cartesian props for a single-series chart.
 */
export interface ChartProps extends CartesianChartProps<XYDatum> {
  /**
   * Color of the main chart mark.
   * This should be a valid CSS color string.
   * @default "black"
   */
  color?: string;
}

/**
 * Internal tooltip state shared across chart implementations.
 */
export interface TooltipData<TData = XYDatum> {
  x: number;
  y: number;
  data: TData;
}
