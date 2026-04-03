import { type Meta, type StoryFn } from '@storybook/react-vite';
import React from 'react';
import { useRef } from 'react';

import BarChart from '../src/components/chart/BarChart';
import ExportImage from '../src/components/common/ExportImage';

const meta = {
  title: '도구/ExportImage',
  component: ExportImage,
  tags: ['autodocs'],
} satisfies Meta<typeof ExportImage>;

export default meta;

type Story = StoryFn<typeof ExportImage>;

const Export: Story = (args) => {
  const ref = useRef(null);

  return (
    <div ref={ref}>
      <ExportImage ref={ref} {...args} />
      <BarChart
        data={[
          { x: 'A', y: 10 },
          { x: 'B', y: 20 },
          { x: 'C', y: 30 },
          { x: 'D', y: 40 },
          { x: 'E', y: 50 },
        ]}
        height={400}
      />
    </div>
  );
};

export const Default = Export.bind({});
