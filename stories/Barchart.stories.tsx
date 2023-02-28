import React from "react";
import BarChart from "../lib/chart/BarChart";
import { ComponentStory, Meta } from "@storybook/react";
import { max } from "d3-array";
import type { ChartProps } from "../lib/types";

export default {
  title: "BarChart",
  component: BarChart,
  argTypes: {
    data: {
      control: {
        type: "object",
      },
    },
    groupType: {
      control: {
        type: "select",
        options: ["none", "stack", "group"],
      },
    },
    xType: {
      control: {
        type: "select",
        options: ["band", "time"],
      },
    },
    maxLimitY: {
      control: {
        type: "number",
      },
    },
    minLimitY: {
      control: {
        type: "number",
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component: `LineChart with tooltip and legend.`,
      },
    },
  },
} as Meta;

const Template: ComponentStory<typeof BarChart> = (args) => (
  <BarChart {...args} />
);

export const Single = Template.bind({});
const data = [
  { x: "2020-01-01", y: 100000 },
  { x: "2020-01-02", y: 200000 },
  { x: "2020-01-03", y: 300000 },
  { x: "2020-01-04", y: 400000 },
  { x: "2020-01-05", y: 500000 },
  { x: "2020-01-06", y: 600000 },
  { x: "2020-01-07", y: 700000 },
  { x: "2020-01-08", y: 800000 },
  { x: "2020-01-09", y: 900000 },
  { x: "2020-01-10", y: 1000000 },
  { x: "2020-01-11", y: 1100000 },
  { x: "2020-01-12", y: 1200000 },
  { x: "2020-01-13", y: 1300000 },
  { x: "2020-01-14", y: 1400000 },
  { x: "2020-01-15", y: 1500000 },
  { x: "2020-01-16", y: 1600000 },
  { x: "2020-01-17", y: 1700000 },
  { x: "2020-01-18", y: 1800000 },
  { x: "2020-01-19", y: 1900000 },
  { x: "2020-01-20", y: 2000000 },
  { x: "2020-01-21", y: 2100000 },
  { x: "2020-01-22", y: 2200000 },
  { x: "2020-01-23", y: 2300000 },
  { x: "2020-01-24", y: 2400000 },
  { x: "2020-01-25", y: 2500000 },
  { x: "2020-01-26", y: 2600000 },
  { x: "2020-01-27", y: 2700000 },
  { x: "2020-01-28", y: 2800000 },
  { x: "2020-01-29", y: 2900000 },
  { x: "2020-01-30", y: 3000000 },
];
Single.args = {
  data: data,
  id: "chart",
  height: 500,
  groupType: "single",
  xType: "band",
  colorList: ["#354965"],
  displayIndex: undefined,
  legendLabelList: ["y값"],
  maxLimitY: max(data, (d) => +d.y),
  minLimitY: 0,
  tooltipMaker: (d) => {
    return data.find((a) => a.x == d) ? data.find((a) => a.x == d)!.y : "";
  },
} as ChartProps;

export const Group = Template.bind({});
const groupedData = [
  { x: "2020-01-01", y1: 100, y2: 200, y3: 300 },
  { x: "2020-01-02", y1: 200, y2: 100, y3: 400 },
  { x: "2020-01-03", y1: 300, y2: 400, y3: 500 },
];
Group.args = {
  data: groupedData,
  id: "chart",
  height: 500,
  groupType: "group",
  xType: "band",
  colorList: ["#000000", "#ffaba1", "#abffff"],
  displayIndex: undefined,
  legendLabelList: ["y1", "y2", "y3"],
  maxLimitY: 500,
  minLimitY: 0,
  tooltipMaker: (d) => {
    return d;
  },
} as ChartProps;

export const Stack = Template.bind({});
const stackedData = [
  { x: "2020-01-01", y1: 100, y2: 200, y3: 300 },
  { x: "2020-01-02", y1: 200, y2: 100, y3: 400 },
  { x: "2020-01-03", y1: 300, y2: 400, y3: 500 },
];
Stack.args = {
  data: stackedData,
  id: "chart",
  height: 500,
  groupType: "stack",
  xType: "band",
  colorList: ["#000000", "#ffaba1", "#abffff"],
  displayIndex: undefined,
  legendLabelList: ["y1", "y2", "y3"],
  maxLimitY: 1200,
  minLimitY: 0,
  tooltipMaker: (d) => {
    return d;
  },
} as ChartProps;
