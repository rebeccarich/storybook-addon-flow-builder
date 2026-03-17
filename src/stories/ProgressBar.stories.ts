import type { Meta, StoryObj } from '@storybook/react'
import { ProgressBar } from './ProgressBar'

const meta: Meta<typeof ProgressBar> = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof ProgressBar>

export const Default: Story = {
  args: { value: 60 },
}

export const WithLabel: Story = {
  args: { value: 33, label: 'Step 1 of 3' },
}

export const Complete: Story = {
  args: { value: 100, label: 'All done!' },
}

export const Empty: Story = {
  args: { value: 0, label: 'Not started' },
}
