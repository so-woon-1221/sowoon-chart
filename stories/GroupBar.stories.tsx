import { type Meta, type StoryObj } from '@storybook/react-vite';

import GroupBarChart from '../src/components/chart/GroupBarChart';

const meta = {
  title: 'chart/GroupBarChart',
  component: GroupBarChart,
  tags: ['autodocs'],
} satisfies Meta<typeof GroupBarChart>;

export default meta;

type Story = StoryObj<typeof GroupBarChart>;

export const 그룹바차트: Story = {
  args: {
    data: [
      { x: 'A', y: 10, y2: 20, y3: 30 },
      { x: 'B', y: 20, y2: 30, y3: 40 },
      { x: 'C', y: 30, y2: 40, y3: 50 },
      { x: 'D', y: 40, y2: 50, y3: 60 },
      { x: 'E', y: 50, y2: 60, y3: 70 },
    ],
    height: 400,
    children: ({ tooltipData }) => (
      <div>
        {tooltipData.x}: {tooltipData.y}
      </div>
    ),
  },
};
