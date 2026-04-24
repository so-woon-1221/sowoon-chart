import { type Meta, type StoryObj } from '@storybook/react-vite';

import Wordcloud from '../src/components/chart/Wordcloud';

const meta = {
  title: 'chart/Wordcloud',
  component: Wordcloud,
  tags: ['autodocs'],
} satisfies Meta<typeof Wordcloud>;

export default meta;

type Story = StoryObj<typeof Wordcloud>;

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
  },
  argTypes: {
    padding: {
      control: {
        type: 'number',
      },
    },
  },
};

export const 빈데이터: Story = {
  args: {
    data: [],
    height: 400,
  },
};
