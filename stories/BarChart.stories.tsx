import { type Meta, type StoryObj } from '@storybook/react-vite';

import BarChart from '../src/components/chart/BarChart';

const meta = {
  title: 'chart/BarChart',
  component: BarChart,
  tags: ['autodocs'],
} satisfies Meta<typeof BarChart>;

export default meta;

type Story = StoryObj<typeof BarChart>;

const data = [
  { x: 'A', y: 10 },
  { x: 'B', y: 20 },
  { x: 'C', y: 30 },
  { x: 'D', y: 40 },
  { x: 'E', y: 50 },
];

const singleDatumData = [{ x: 'A', y: 18 }];
const negativeData = [
  { x: 'A', y: 18 },
  { x: 'B', y: -12 },
  { x: 'C', y: 24 },
  { x: 'D', y: -8 },
];

const renderTooltip = ({ tooltipData }: { tooltipData: { x: string; y: number } }) => (
  <div>
    {tooltipData.x}: {tooltipData.y}
  </div>
);

export const 기본: Story = {
  args: {
    data,
    height: 400,
    tooltipPosition: 'point',
    children: renderTooltip,
  },
  argTypes: {
    padding: {
      control: {
        type: 'number',
      },
    },
  },
};

export const 커서툴팁: Story = {
  args: {
    data,
    height: 400,
    tooltipPosition: 'cursor',
    children: renderTooltip,
  },
};

export const 값라벨: Story = {
  args: {
    data,
    height: 400,
    tooltipPosition: 'point',
    showValueLabels: true,
    valueLabelFormatter: (value) => `${value}%`,
    children: renderTooltip,
  },
};

export const 단일데이터: Story = {
  args: {
    data: singleDatumData,
    height: 400,
    tooltipPosition: 'point',
    children: renderTooltip,
  },
};

export const 음수값: Story = {
  args: {
    data: negativeData,
    height: 400,
    tooltipPosition: 'point',
    children: renderTooltip,
  },
};
