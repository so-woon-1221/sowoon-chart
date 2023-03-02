import { ComponentStory, Meta } from "@storybook/react";
import BrushLine from "../lib/chart/BrushLineChart";
import React from "react";
import { max } from "d3-array";
import { ChartProps } from "../lib/util";

export default {
  title: "BrushLine",
  component: BrushLine,
  argTypes: {
    data: {
      control: {
        type: "object",
      },
    },
    groupType: {
      control: {
        type: "select",
        options: ["single", "stack", "group"],
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
        required: false,
      },
    },
  },
} as Meta;

const Template: ComponentStory<typeof BrushLine> = (args) => (
  <BrushLine {...args} />
);

export const Single = Template.bind({});
const data = Array.from({ length: 100 }, (_, i) => ({
  x: i.toString(),
  y: Math.random() * 100,
}));
Single.args = {
  data: data,
  id: "single",
  height: 500,
  groupType: "single",
  colorList: ["#000000"],
  displayIndex: undefined,
  legendLabelList: ["y값"],
  maxLimitY: max(data, (d) => +d.y),
  minLimitY: 0,
  tooltipMaker: (d) => {
    return d;
  },
} as ChartProps;
