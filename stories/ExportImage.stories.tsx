import { BarChart, ExportImage } from '../src'
import { type Meta, type StoryFn } from '@storybook/react'
import { useRef } from 'react'

const meta = {
  title: '도구/ExportImage',
  component: ExportImage,
  tags: ['autodocs']
} satisfies Meta<typeof ExportImage>

export default meta

type Story = StoryFn<typeof ExportImage>

const Export: Story = args => {
  const ref = useRef(null)

  return (
    <div ref={ref}>
      <ExportImage ref={ref} {...args} />
      <BarChart
        data={[
          { x: 'A', y: 10 },
          { x: 'B', y: 20 },
          { x: 'C', y: 30 },
          { x: 'D', y: 40 },
          { x: 'E', y: 50 }
        ]}
        height={400}
      />
    </div>
  )
}

export const Default = Export.bind({})
