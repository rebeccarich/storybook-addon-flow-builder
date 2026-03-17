import type { Meta, StoryObj } from '@storybook/react'
import { IconButton } from './IconButton'

const meta: Meta<typeof IconButton> = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof IconButton>

export const Close: Story = {
  args: { label: 'Close', icon: '\u00D7' },
}

export const Edit: Story = {
  args: { label: 'Edit', icon: '\u270E' },
}

export const Delete: Story = {
  args: { label: 'Delete', icon: '\uD83D\uDDD1', variant: 'danger' },
}

export const Small: Story = {
  args: { label: 'Menu', icon: '\u2630', size: 'small' },
}
