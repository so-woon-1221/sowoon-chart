import React from "react";

import { ComponentStory, Meta } from "@storybook/react";

import LineChart from "../lib/LineChart";
import type { LineChartProps } from "../lib/LineChart";
import { max } from "d3-array";

export default {
  title: "LineChart",
  component: LineChart,
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

const Template: ComponentStory<typeof LineChart> = (args) => (
  <LineChart {...args} />
);

export const Single = Template.bind({});
const data = [
  { x: "2020-01-01", y: 100000 },
  { x: "2020-01-02", y: 200000 },
  { x: "2020-01-03", y: 300000 },
];
Single.args = {
  data: data,
  id: "chart",
  height: 500,
  groupType: "single",
  xType: "band",
  colorList: ["#000000"],
  displayIndex: undefined,
  legendLabelList: ["y값"],
  maxLimitY: max(data, (d) => +d.y),
  minLimitY: 0,
  tooltipMaker: (d) => {
    return d;
  },
} as LineChartProps;

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
} as LineChartProps;

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
} as LineChartProps;
