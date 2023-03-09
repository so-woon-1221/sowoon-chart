import React from 'react';
import { ComponentStory, Meta } from '@storybook/react';
import TreemapChart from '../lib/chart/TreemapChart';

export default {
  title: 'Treemap',
  component: TreemapChart,
} as Meta;

const Template: ComponentStory<typeof TreemapChart> = args => (
  <TreemapChart {...args} />
);

export const Treemap = Template.bind({});
const data = Array.from({ length: 10 }, (_, i) => ({
  id: `id-${i}`,
  parent: i === 0 ? null : `id-0`,
  value: i === 0 ? null : Math.random() * 100,
}));

Treemap.args = {
  data: data.sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
  height: 600,
  colorSet: ['#ef4444', '#0891b2'],
  id: 'treemap',
};
