import { ComponentStory, Meta } from '@storybook/react';
import React from 'react';
import PieChartC from '../lib/chart/PieChart';

export default {
  title: 'Pie Chart',
  component: PieChartC,
  argTypes: {
    data: {
      control: {
        type: 'object',
      },
    },
    colorList: {
      control: {
        type: 'object',
      },
    },
  },
} as Meta;

const Template: ComponentStory<typeof PieChartC> = (args: {
  data: Array<{ key: string; value: number }>;
  colorList: Array<string>;
  width?: number;
  height?: number;
  id: string;
}) => <PieChartC {...args} />;

export const PieChart = Template.bind({});
PieChart.args = {
  data: [
    { key: 'A', value: 100 },
    { key: 'B', value: 200 },
    { key: 'C', value: 300 },
    { key: 'D', value: 400 },
  ],
  colorList: ['#003049', '#d62828', '#f77f00', '#fcbf49'],
  id: 'pie-chart',
  height: 500,
};
