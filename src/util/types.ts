export interface ChartProps {
  /**
   * Data to be displayed in the chart.
   * Each element in the array should have an `x` and `y` property.
   * `x` should be a string and `y` should be a number.
   */
  data: Array<{ x: string; y: number }>;
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
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /**
   * Color of the line in the chart.
   * This should be a valid CSS color string.
   * @default "black"
   */
  color?: string;
  /**
   * Minimum value for the y-axis.
   * if not provided, the minimum value in the data will be used.
   */
  minY?: number;
  /**
   * Maximum value for the y-axis
   * if not provided, the maximum value in the data will be used.
   */
  maxY?: number;
}
