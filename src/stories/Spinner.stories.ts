import type { Meta, StoryObj } from '@storybook/react'
import { Spinner } from './Spinner'

const meta: Meta<typeof Spinner> = {
  title: 'Components/Spinner',
  component: Spinner,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof Spinner>

export const Default: Story = {
  args: {},
}

export const WithLabel: Story = {
  args: { label: 'Loading...' },
}

export const Small: Story = {
  args: { size: 'small' },
}

export const Large: Story = {
  args: { size: 'large', label: 'Please wait' },
}
