import React from 'react';
import { ComponentStory, Meta } from '@storybook/react';
import { max } from 'd3-array';
import CanvasLineChart from '../lib/chart/CanvasLineChart';
import type { ChartProps } from '../lib/util';

export default {
  title: 'Canvas Line Chart',
  component: CanvasLineChart,
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

const Template: ComponentStory<typeof CanvasLineChart> = args => (
  <CanvasLineChart {...args} />
);

export const Single = Template.bind({});
const data = Array.from({ length: 100 }, (_d, i) => ({
  x: i.toString(),
  y: Math.random() * 100,
}));
Single.args = {
  data,
  id: 'single',
  height: 500,
  groupType: 'single',
  colorList: ['#000000'],
  displayIndex: undefined,
  legendLabelList: ['y값'],
  maxLimitY: max(data, d => +d.y),
  minLimitY: 0,
  tooltipMaker: d => d,
} as ChartProps;

export const Group = Template.bind({});
const groupedData = [
  { x: '2020-01-01', y1: 100, y2: 200, y3: 300 },
  { x: '2020-01-02', y1: 200, y2: 100, y3: 400 },
  { x: '2020-01-03', y1: 300, y2: 400, y3: 500 },
];
Group.args = {
  data: groupedData,
  id: 'group-line-chart',
  height: 500,
  groupType: 'group',
  colorList: ['#000000', '#ffaba1', '#abffff'],
  displayIndex: undefined,
  legendLabelList: ['y1', 'y2', 'y3'],
  maxLimitY: 500,
  minLimitY: 0,
  tooltipMaker: d => d,
} as ChartProps;

export const Stack = Template.bind({});
const stackedData = [
  { x: '2020-01-01', y1: 100, y2: 200, y3: 300 },
  { x: '2020-01-02', y1: 200, y2: 100, y3: 400 },
  { x: '2020-01-03', y1: 300, y2: 400, y3: 500 },
];
Stack.args = {
  data: stackedData,
  id: 'stack-line-chart',
  height: 500,
  groupType: 'stack',
  colorList: ['#000000', '#ffaba1', '#abffff'],
  displayIndex: undefined,
  legendLabelList: ['y1', 'y2', 'y3'],
  maxLimitY: 1200,
  minLimitY: 0,
  tooltipMaker: d => d,
} as ChartProps;
