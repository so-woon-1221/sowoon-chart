import { type Meta, type StoryObj } from '@storybook/react-vite';

import NetworkChart from '../src/components/chart/NetworkChart';

const meta = {
  title: 'chart/NetworkChart',
  component: NetworkChart,
  tags: ['autodocs'],
} satisfies Meta<typeof NetworkChart>;

export default meta;

type Story = StoryObj<typeof NetworkChart>;

const renderTooltip = ({
  tooltipData,
}: {
  tooltipData: { id: string; value: number; group?: string };
}) => (
  <div style={{ background: '#111827', color: '#fff', padding: '4px 6px' }}>
    {tooltipData.id}: {tooltipData.value}
  </div>
);

export const 네트워크차트: Story = {
  args: {
    data: {
      links: [
        { source: 'A', target: 'B', value: 10 },
        { source: 'B', target: 'C', value: 20 },
        { source: 'C', target: 'D', value: 30 },
        { source: 'D', target: 'E', value: 40 },
        { source: 'E', target: 'A', value: 50 },
      ],
      nodes: [
        { group: '', id: 'A', value: 10 },
        { group: '', id: 'B', value: 20 },
        { group: '', id: 'C', value: 30 },
        { group: '', id: 'D', value: 40 },
        { group: '', id: 'E', value: 50 },
      ],
    },
    height: 600,
    children: renderTooltip,
  },
};

export const 커서툴팁: Story = {
  args: {
    data: {
      links: [
        { source: 'A', target: 'B', value: 10 },
        { source: 'B', target: 'C', value: 20 },
        { source: 'C', target: 'D', value: 30 },
        { source: 'D', target: 'E', value: 40 },
        { source: 'E', target: 'A', value: 50 },
      ],
      nodes: [
        { group: 'team-1', id: 'A', value: 10 },
        { group: 'team-1', id: 'B', value: 20 },
        { group: 'team-2', id: 'C', value: 30 },
        { group: 'team-2', id: 'D', value: 40 },
        { group: 'team-3', id: 'E', value: 50 },
      ],
    },
    height: 600,
    tooltipPosition: 'cursor',
    children: renderTooltip,
  },
};
