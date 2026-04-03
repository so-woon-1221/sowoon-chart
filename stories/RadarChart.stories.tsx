import { type Meta, type StoryObj } from '@storybook/react-vite';
import React from 'react';

import RadarChart from '../src/components/chart/RadarChart';

const meta = {
  title: 'chart/RadarChart',
  component: RadarChart,
  tags: ['autodocs'],
} satisfies Meta<typeof RadarChart>;

export default meta;

type Story = StoryObj<typeof RadarChart>;

const data = [
  {
    key: 'AA',
    data: [
      { x: 'A', y: 10 },
      { x: 'B', y: 20 },
      { x: 'C', y: 30 },
      { x: 'D', y: 40 },
      { x: 'E', y: 50 },
    ],
  },
  {
    key: 'BB',
    data: [
      { x: 'A', y: 20 },
      { x: 'B', y: 20 },
      { x: 'C', y: 20 },
      { x: 'D', y: 20 },
      { x: 'E', y: 20 },
    ],
  },
];

const renderTooltip = ({ tooltipData }: { tooltipData: { x: string; y: number } }) => (
  <div>
    {tooltipData.x}: {tooltipData.y}
  </div>
);

export const 레이다차트: Story = {
  args: {
    data,
    height: 400,
    colorList: ['#0A0908', '#0891b2', '#C6AC8F', '#60D394', '#D1495B', '#9b5de5'],
    children: renderTooltip,
  },
  argTypes: {
    margin: {
      control: {
        type: 'number',
      },
    },
  },
};

export const 자동툴팁범례강조: Story = {
  args: {
    data,
    height: 400,
    colorList: ['#0A0908', '#0891b2', '#C6AC8F', '#60D394', '#D1495B', '#9b5de5'],
    tooltipPosition: 'auto',
    children: renderTooltip,
  },
  argTypes: {
    margin: {
      control: {
        type: 'number',
      },
    },
  },
};
