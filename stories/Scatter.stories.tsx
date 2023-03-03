import React from 'react';
import { ComponentStory, Meta } from '@storybook/react';
import ScatterChart from '../lib/chart/ScatterChart';

export default {
  title: 'Scatter',
  component: ScatterChart,
  argTypes: {
    data: {
      control: {
        type: 'object',
      },
    },
  },
} as Meta;

const Template: ComponentStory<typeof ScatterChart> = args => (
  <ScatterChart {...args} />
);

export const Scatter = Template.bind({});
const data = Array.from({ length: 100 }, () => ({
  x: Math.random().toString(36).substring(2),
  y: Math.random() * 100,
}));
Scatter.args = {
  data,
  id: 'scatter-chart',
  height: 500,
  colorList: ['#ff0000', '#00ff00', '#0000ff'],
  tooltipMaker: (x: string) => {
    const findData = data.find(d => d.x === x);
    return (
      <div>
        <div>{x}</div>
        <div>
          {findData?.y.toLocaleString('ko', {
            maximumFractionDigits: 2,
          })}
        </div>
      </div>
    );
  },
};
