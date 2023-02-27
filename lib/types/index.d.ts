import type { ScaleType } from "@visx/scale";

export interface ChartProps {
    /**
     * data
     * - x :
     *   - data that will be displayed on the x-axis
     *   - type : string
     * - The values on the y-axis can be freely named keys with numeric values.
     */
    data: { [key: string]: string | number; x: string }[];
    /**
     * id
     * - id of svg
     */
    id: string;
    /**
     * scale type of x-axis
     * - band : bandScale
     * - time : timeScale
     * - linear : linearScale
     * - default : bandScale
     * @default band
     * @type ScaleType
     */
    xType?: ScaleType;
    /**
     * type of group
     * - stack : stacked graph
     * - group : group graph
     * - single : single graph
     * @default single
     * @type "stack" | "group" | "single"
     */
    groupType?: "stack" | "group" | "single";
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
