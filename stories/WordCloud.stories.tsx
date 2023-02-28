import React from "react";
import WordCloudChart from "../lib/chart/WordCloud";
import { ComponentStory, Meta } from "@storybook/react";

export default {
  title: "WorldCloud",
  component: WordCloudChart,
  argTypes: {
    data: {
      control: {
        type: "object",
      },
    },
    type: {
      control: {
        type: "select",
      },
      options: ["rectangular", "archimedean"],
    },
  },
} as Meta;

const Template: ComponentStory<typeof WordCloudChart> = (args) => (
  <WordCloudChart {...args} />
);

export const WordCloud = Template.bind({});
WordCloud.args = {
  data: [
    { text: "A", value: 100 },
    { text: "B", value: 200 },
    { text: "C", value: 300 },
    { text: "D", value: 400 },
  ],
  id: "word-cloud-chart",
  type: "rectangular",
  height: 500,
};
