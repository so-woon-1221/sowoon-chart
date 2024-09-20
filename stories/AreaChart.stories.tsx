import { Meta, StoryObj } from '@storybook/react'
import AreaChart from '../src/components/chart/AreaChart'

const meta = {
  title: 'chart/AreaChart',
  component: AreaChart,
  tags: ['autodocs']
} satisfies Meta<typeof AreaChart>

export default meta

type Story = StoryObj<typeof AreaChart>

export const Area차트: Story = {
  args: {
    data: [
      { x: 'A', y: 10 },
      { x: 'B', y: 20 },
      { x: 'C', y: 30 },
      { x: 'D', y: 40 },
      { x: 'E', y: 50 }
    ],
    height: 400,
    children: ({ tooltipData }: { tooltipData: { x: string; y: number } }) => (
      <div style={{ background: 'black', color: 'white', padding: '4px' }}>
        {tooltipData.x}: {tooltipData.y}
      </div>
    )
  },
  argTypes: {
    color: {
      control: {
        type: 'color'
      }
    }
  }
}
