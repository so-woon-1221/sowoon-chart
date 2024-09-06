import { Meta, StoryObj } from "@storybook/react";
import BarChart from "../src/components/chart/BarChart";

const meta = {
  title: "chart/BarChart",
  component: BarChart,
  tags: ["autodocs"],
} satisfies Meta<typeof BarChart>;

export default meta;

type Story = StoryObj<typeof BarChart>;

export const 바차트: Story = {
  args: {
    data: [
      { x: "A", y: 10 },
      { x: "B", y: 20 },
      { x: "C", y: 30 },
      { x: "D", y: 40 },
      { x: "E", y: 50 },
    ],
    height: 400,
    children: ({ tooltipData }: { tooltipData: { x: string; y: number } }) => (
      <div>
        {tooltipData.x}: {tooltipData.y}
      </div>
    ),
  },
  argTypes: {
    padding: {
      control: {
        type: "number",
      },
    },
  },
};
