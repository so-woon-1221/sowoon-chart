import { type Meta, type StoryObj } from '@storybook/react-vite';

import Wordcloud from '../src/components/chart/Wordcloud';

const meta = {
  title: 'chart/Wordcloud',
  component: Wordcloud,
  tags: ['autodocs'],
} satisfies Meta<typeof Wordcloud>;

export default meta;

type Story = StoryObj<typeof Wordcloud>;

const renderTooltip = ({ tooltipData }: { tooltipData: { x: string; y: number } }) => (
  <div style={{ background: '#111827', color: '#fff', padding: '4px 6px' }}>
    {tooltipData.x}: {tooltipData.y}
  </div>
);

export const 워드클라우드: Story = {
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
    data: [
      { x: 'React', y: 42 },
      { x: 'D3', y: 36 },
      { x: 'SVG', y: 28 },
      { x: 'Tooltip', y: 24 },
      { x: 'Worker', y: 18 },
    ],
    height: 400,
    tooltipPosition: 'cursor',
    children: renderTooltip,
  },
};

export const 빈데이터: Story = {
  args: {
    data: [],
    height: 400,
  },
};
