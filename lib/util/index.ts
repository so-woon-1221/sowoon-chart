import { max } from 'd3-array';

export interface ChartProps {
  /**
   * data
   * - x :
   *   - data that will be displayed on the x-axis
   *   - type : string
   * - The values on the y-axis can be freely named keys with numeric values.
   */
  data: Array<{
    [key: string]: string | number | JSX.Element | undefined;
    x: string;
    tooltipData?: JSX.Element;
  }>;
  /**
   * id
   * - id of svg
   */
  id: string;
  // /**
  //  * scale type of x-axis
  //  * - band : bandScale
  //  * - time : timeScale
  //  * - linear : linearScale
  //  * - default : bandScale
  //  * @default band
  //  * @type ScaleType
  //  */
  // xType?: "band" | "time";
  /**
   * type of group
   * - stack : stacked graph
   * - group : group graph
   * - single : single graph
   * @default single
   * @type "stack" | "group" | "single"
   */
  groupType?: 'stack' | 'group' | 'single';
  /**
   * List of colors for the graph
   * - Colors are applied in the order of the keyList
   * - If the length of colorList is shorter than that of keyList, the last color in colorList is repeated.
   * - If the length of colorList is longer than that of keyList, the excess part of colorList is ignored.
   * @default ["#000000"]
   * @type string[]
   * @example
   * colorList = ["#000000", "#ffffff"]
   * keyList = ["y1", "y2"]
   * => y1 : #000000, y2 : #ffffff
   */
  colorList: string[];
  /**
   * max value of y-axis
   * - max value of y-axis can be specified
   * - If not specified, the smallest value of y-axis is specified as the smallest value of y-axis.
   * @default undefined
   * @type number
   */
  maxLimitY?: number;
  /**
   * min value of y-axis
   * - min value of y-axis can be specified
   * - If not specified, the smallest value of y-axis is specified as the smallest value of y-axis.
   * - If groupType is stack, minLimitY is 0.
   * @default undefined
   * @type number
   */
  minLimitY?: number;
  /**
   * unit of y-axis
   * - unit of y-axis can be specified
   * - If not specified, the unit is not displayed.
   */
  displayIndex?: string;
  /**
   * function that returns tooltip
   * @param d : x value of mouseover
   */
  tooltipMaker?: (d: string) => JSX.Element | string | undefined;
  /**
   * legend label list
   * - legend label list can be specified
   * - If not specified, keyList is used.
   * @default keyList
   * @type string[]
   */
  legendLabelList?: string[];
  /**
   * width
   * - width of svg
   * - If not specified, the width of the parent component is used.
   * @default undefined
   * @type number
   */
  width?: number;
  /**
   * height
   * - height of svg
   * - If not specified, the height of the parent component is used.
   * @default undefined
   * @type number
   */
  height?: number;
}

export interface WordCloudProps {
  /**
   * Data for the chart.
   * Each element of the array should have the following format:
   * {
   *  text: string;
   *  value: number;
   * }
   */
  data: {
    text: string;
    value: number;
  }[];
  /**
   * ID of the chart
   * */
  id: string;
  width?: number;
  height?: number;
  /**
   * Color list for the chart
   * - five colors are used by default
   * - rotate when the number of data points exceeds the number of colors
   * @default ["#0A0908", "#0891b2", "#C6AC8F", "#60D394", "#D1495B", "#9b5de5"]
   */
  colorList?: string[];
  /**
   * Type of the spiral
   * - "rectangular" or "archimedean"
   * @default "rectangular"
   * */
  type?: 'rectangular' | 'archimedean';
  /**
   * WordCloud Web worker spinner
   * - the spinner is displayed while the Web worker is running.
   * - If not specified, the default spinner is used.
   * @default undefined
   * */
  spinner?: JSX.Element | string;
}

export const makeDisplayNum = (numbers: number[]) => {
  if (max(numbers)! >= 100000) {
    let checkIndex = 10;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let count = 0;
      // eslint-disable-next-line no-restricted-syntax
      for (const number of numbers) {
        if (number % checkIndex === 0) {
          count += 1;
        }
      }
      if (count === numbers.length) {
        checkIndex *= 10;
      } else {
        break;
      }
    }
    checkIndex /= 10;
    switch (checkIndex) {
      case 1:
        return ['', checkIndex];
      case 10:
        return ['십', checkIndex];
      case 100:
        return ['백', checkIndex];
      case 1000:
        return ['천', checkIndex];
      case 10000:
        return ['만', checkIndex];
      case 100000:
        return ['십만', checkIndex];
      case 1000000:
        return ['백만', checkIndex];
      case 10000000:
        return ['천만', checkIndex];
      case 100000000:
        return ['억', checkIndex];
      case 1000000000:
        return ['십억', checkIndex];
      case 10000000000:
        return ['백억', checkIndex];
      case 100000000000:
        return ['천억', checkIndex];
      case 1000000000000:
        return ['조', checkIndex];
      default:
        return ['', checkIndex];
    }
  } else {
    return ['', 1];
  }
};
