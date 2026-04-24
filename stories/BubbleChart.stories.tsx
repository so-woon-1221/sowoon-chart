import { type Meta, type StoryObj } from '@storybook/react-vite';

import BubbleChart from '../src/components/chart/BubbleChart';

const meta = {
  title: 'chart/BubbleChart',
  component: BubbleChart,
  tags: ['autodocs'],
} satisfies Meta<typeof BubbleChart>;

export default meta;

type Story = StoryObj<typeof BubbleChart>;

const renderTooltip = ({ tooltipData }: { tooltipData: { x: string; y: number } }) => (
  <div style={{ background: '#111827', color: '#fff', padding: '4px 6px' }}>
    {tooltipData.x}: {tooltipData.y}
  </div>
);

export const 버블차트: Story = {
  args: {
    data: [
      { x: 'A', y: 10 },
      { x: 'B', y: 20 },
      { x: 'C', y: 30 },
      { x: 'D', y: 40 },
      { x: 'E', y: 50 },
    ],
    height: 400,
    children: renderTooltip,
  },
};

export const 커서툴팁: Story = {
  args: {
    data: [
      { x: 'A', y: 10 },
      { x: 'B', y: 20 },
      { x: 'C', y: 30 },
      { x: 'D', y: 40 },
      { x: 'E', y: 50 },
    ],
    height: 400,
    tooltipPosition: 'cursor',
    children: renderTooltip,
  },
};
