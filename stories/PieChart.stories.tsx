import { type Meta, type StoryObj } from '@storybook/react-vite';
import React from 'react';

import PieChart from '../src/components/chart/PieChart';

const meta = {
  title: 'chart/PieChart',
  component: PieChart,
  tags: ['autodocs'],
} satisfies Meta<typeof PieChart>;

export default meta;

type Story = StoryObj<typeof PieChart>;

const data = [
  { x: 'A', y: 10 },
  { x: 'B', y: 20 },
  { x: 'C', y: 30 },
  { x: 'D', y: 40 },
  { x: 'E', y: 50 },
];

const singleDatumData = [{ x: 'A', y: 100 }];

const renderTooltip = ({ tooltipData }: { tooltipData: { x: string; y: number } }) => (
  <div>
    {tooltipData.x}: {tooltipData.y}
  </div>
);

export const 기본: Story = {
  args: {
    data,
    height: 400,
    centerNode: <div>툴팁</div>,
    tooltipPosition: 'cursor',
    children: renderTooltip,
  },
};

export const 포인트툴팁: Story = {
  args: {
    data,
    height: 400,
    centerNode: <div>툴팁</div>,
    tooltipPosition: 'point',
    children: renderTooltip,
  },
};

export const 단일데이터: Story = {
  args: {
    data: singleDatumData,
    height: 400,
    centerNode: <div>단일</div>,
    tooltipPosition: 'point',
    children: renderTooltip,
  },
};

export const 자동툴팁범례: Story = {
  args: {
    data,
    height: 400,
    centerNode: <div>Auto</div>,
    showLegend: true,
    tooltipPosition: 'auto',
    children: renderTooltip,
  },
};
