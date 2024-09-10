import type { Meta, StoryObj } from "@storybook/react";
import StackBarChart from "../src/components/chart/StackBarChart";

const meta = {
  title: "chart/StackBarChart",
  component: StackBarChart,
  tags: ["autodocs"],
} satisfies Meta<typeof StackBarChart>;

export default meta;

type Story = StoryObj<typeof StackBarChart>;

export const 스택라인차트: Story = {
  args: {
    data: [
      { x: "A", y: 10, y2: 20 },
      { x: "B", y: 20, y2: 30 },
      { x: "C", y: 30, y2: 40 },
      { x: "D", y: 40, y2: 50 },
      { x: "E", y: 50, y2: 60 },
    ],
    height: 400,
    children: ({ tooltipData }) => (
      <div>
        {tooltipData.x}: {tooltipData.y}
      </div>
    ),
  },
};
