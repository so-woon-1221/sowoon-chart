import { ComponentStory, Meta } from '@storybook/react';
import React from 'react';
import { max } from 'd3-array';
import BrushLine from '../lib/chart/BrushLineChart';
import { ChartProps } from '../lib/util';

export default {
  title: 'BrushLine',
  component: BrushLine,
  argTypes: {
    data: {
      control: {
        type: 'object',
      },
    },
    groupType: {
      control: {
        type: 'select',
        options: ['single', 'stack', 'group'],
      },
    },
    maxLimitY: {
      control: {
        type: 'number',
      },
    },
    minLimitY: {
      control: {
        type: 'number',
        required: false,
      },
    },
  },
} as Meta;

const Template: ComponentStory<typeof BrushLine> = args => (
  <BrushLine {...args} />
);

export const Single = Template.bind({});
const data = Array.from({ length: 50 }, (_, i) => ({
  x: i.toString(),
  y: Math.random() * 100,
}));
Single.args = {
  data,
  id: 'single',
  height: 100,
  groupType: 'single',
  colorList: ['#000000'],
  displayIndex: undefined,
  legendLabelList: ['y값'],
  maxLimitY: max(data, d => +d.y),
  minLimitY: 0,
  tooltipMaker: d => d,
  setBrushDomain: d => {
    console.log(d);
  },
} as ChartProps;

export const Group = Template.bind({});
const data1 = Array.from({ length: 50 }, (_, i) => ({
  x: i.toString(),
  y1: Math.random() * 100,
  y2: Math.random() * 100,
  y3: Math.random() * 100,
}));
Group.args = {
  data: data1,
  id: 'group-brush',
  height: 100,
  groupType: 'group',
  colorList: ['#000000', '#ff0000', '#00ff00'],
  displayIndex: undefined,
  legendLabelList: ['y1', 'y2', 'y3'],
  maxLimitY: undefined,
  minLimitY: 0,
  tooltipMaker: d => d,
  setBrushDomain: d => {
    console.log(d);
  },
} as ChartProps;

export const Stack = Template.bind({});
const data2 = Array.from({ length: 50 }, (_, i) => ({
  x: i.toString(),
  y1: Math.random() * 100,
  y2: Math.random() * 100,
  y3: Math.random() * 100,
}));
Stack.args = {
  data: data2,
  id: 'stack-brush',
  height: 100,
  groupType: 'stack',
  colorList: ['#000000', '#ff0000', '#00ff00'],
  displayIndex: undefined,
  legendLabelList: ['y1', 'y2', 'y3'],
  maxLimitY: max(data2, d => +d.y1 + +d.y2 + +d.y3),
  minLimitY: 0,
  tooltipMaker: d => d,
  setBrushDomain: d => {
    console.log(d);
  },
} as ChartProps;
