import React from 'react';
import { ComponentStory, Meta } from '@storybook/react';
import { max } from 'd3';
import LineWithBrushChart from '../lib/chart/LineWithBrushChart';
import { ChartProps } from '../lib/util';

export default {
  title: 'LineWithBrushChart',
  component: LineWithBrushChart,
  argTypes: {
    data: {
      control: {
        type: 'object',
      },
    },
    groupType: {
      control: {
        type: 'select',
        options: ['none', 'stack', 'group'],
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
} as Meta;

const Template: ComponentStory<typeof LineWithBrushChart> = args => (
  <LineWithBrushChart {...args} />
);

export const Single = Template.bind({});
const data = Array.from({ length: 100 }, (_, i) => ({
  x: i.toString(),
  y: Math.random() * 100,
}));
Single.args = {
  data,
  groupType: 'single',
  maxLimitY: 100,
  minLimitY: 0,
  id: 'single-brush-line',
  colorList: ['#000000'],
  height: 500,
  displayIndex: '회',
  tooltipMaker: d => {
    const findData = data.find(datum => datum.x === d);
    return (
      <div>
        <div>x: {d}</div>
        <div>y: {findData?.y.toLocaleString()}</div>
      </div>
    );
  },
} as ChartProps;

export const Group = Template.bind({});
const groupData = Array.from({ length: 100 }, (_, i) => ({
  x: i.toString(),
  y1: Math.random() * 100,
  y2: Math.random() * 100,
  y3: Math.random() * 100,
}));
Group.args = {
  data: groupData,
  groupType: 'group',
  maxLimitY: 100,
  minLimitY: 0,
  id: 'group-brush-line',
  colorList: ['#000000', '#ff0000', '#00ff00'],
  height: 500,
  tooltipMaker: d => {
    const findData = groupData.find(datum => datum.x === d);
    return (
      <div>
        <div>x: {d}</div>
        <div>y1: {findData?.y1.toLocaleString()}</div>
        <div>y2: {findData?.y2.toLocaleString()}</div>
        <div>y3: {findData?.y3.toLocaleString()}</div>
      </div>
    );
  },
} as ChartProps;

export const Stack = Template.bind({});
const stackData = Array.from({ length: 100 }, (_, i) => ({
  x: i.toString(),
  y1: Math.random() * 100,
  y2: Math.random() * 100,
  y3: Math.random() * 100,
}));
Stack.args = {
  data: stackData,
  groupType: 'stack',
  maxLimitY: max(stackData, d => d.y1 + d.y2 + d.y3),
  minLimitY: 0,
  id: 'stack-brush-line',
  colorList: ['#000000', '#ff0000', '#00ff00'],
  height: 500,
  tooltipMaker: d => {
    const findData = stackData.find(datum => datum.x === d);
    return (
      <div>
        <div>x: {d}</div>
        <div>y1: {findData?.y1.toLocaleString()}</div>
        <div>y2: {findData?.y2.toLocaleString()}</div>
        <div>y3: {findData?.y3.toLocaleString()}</div>
      </div>
    );
  },
} as ChartProps;
