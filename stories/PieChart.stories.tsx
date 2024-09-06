import { Meta, StoryObj } from "@storybook/react";
import PieChart from "../src/components/chart/PieChart";

const meta = {
  title: "chart/PieChart",
  component: PieChart,
  tags: ["autodocs"],
} satisfies Meta<typeof PieChart>;

export default meta;

type Story = StoryObj<typeof PieChart>;

export const 파이차트: Story = {
  args: {
    data: [
      { x: "A", y: 10 },
      { x: "B", y: 20 },
      { x: "C", y: 30 },
      { x: "D", y: 40 },
      { x: "E", y: 50 },
    ],
    height: 400,
    children: <div>툴팁</div>,
  },
};
