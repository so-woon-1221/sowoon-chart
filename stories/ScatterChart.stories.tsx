import type { Meta, StoryObj } from '@storybook/react'
import ScatterChart from '../src/components/chart/ScatterChart'
import React from 'react'

const meta = {
  title: 'chart/ScatterChart',
  component: ScatterChart,
  tags: ['autodocs']
} satisfies Meta<typeof ScatterChart>

export default meta

type Story = StoryObj<typeof ScatterChart>

const data = [
  { x: 'A', y: 10, value: 10 },
  { x: 'B', y: 20, value: 20 },
  { x: 'C', y: 30, value: 30 },
  { x: 'D', y: 40, value: 40 },
  { x: 'E', y: 50, value: 50 }
]

const singleDatumData = [{ x: 'A', y: 14, value: 18 }]

const negativeData = [
  { x: 'A', y: -10, value: 12 },
  { x: 'B', y: 8, value: 18 },
  { x: 'C', y: -4, value: 10 },
  { x: 'D', y: 16, value: 20 },
  { x: 'E', y: 6, value: 14 }
]

const renderTooltip = ({
  tooltipData
}: {
  tooltipData: { x: string; y: number; value: number }
}) => (
  <div>
    {tooltipData.x}: {tooltipData.y} / {tooltipData.value}
  </div>
)

export const 기본: Story = {
  args: {
    data,
    height: 400,
    tooltipPosition: 'cursor',
    children: renderTooltip
  }
}

export const 포인트툴팁: Story = {
  args: {
    data,
    height: 400,
    tooltipPosition: 'point',
    children: renderTooltip
  }
}

export const 단일데이터: Story = {
  args: {
    data: singleDatumData,
    height: 400,
    tooltipPosition: 'point',
    children: renderTooltip
  }
}

export const 음수값: Story = {
  args: {
    data: negativeData,
    height: 400,
    minY: -20,
    maxY: 20,
    tooltipPosition: 'cursor',
    children: renderTooltip
  }
}
