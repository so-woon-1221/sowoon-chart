import type { Meta, StoryObj } from "@storybook/react";
import ScatterChart from "../src/components/chart/ScatterChart";

const meta = {
  title: "chart/ScatterChart",
  component: ScatterChart,
  tags: ["autodocs"],
} satisfies Meta<typeof ScatterChart>;

export default meta;

type Story = StoryObj<typeof ScatterChart>;

export const Scatter차트: Story = {
  args: {
    data: [
      { x: "A", y: 10, value: 10 },
      { x: "B", y: 20, value: 20 },
      { x: "C", y: 30, value: 30 },
      { x: "D", y: 40, value: 40 },
      { x: "E", y: 50, value: 50 },
    ],
    height: 400,
    children: ({ tooltipData }: { tooltipData: { x: string; y: number } }) => (
      <div>
        {tooltipData.x}: {tooltipData.y}
      </div>
    ),
  },
};
