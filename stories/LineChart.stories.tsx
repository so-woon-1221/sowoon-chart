import { Meta, StoryObj } from "@storybook/react";
import LineChart from "../src/components/chart/LineChart";

const meta = {
  title: "chart/LineChart",
  component: LineChart,
  tags: ["autodocs"],
} satisfies Meta<typeof LineChart>;

export default meta;

type Story = StoryObj<typeof LineChart>;

export const 라인차트: Story = {
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
      <div style={{ background: "black", color: "white", padding: "4px" }}>
        {tooltipData.x}: {tooltipData.y}
      </div>
    ),
  },
};
