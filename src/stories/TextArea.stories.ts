import type { Meta, StoryObj } from '@storybook/react'
import { TextArea } from './TextArea'

const meta: Meta<typeof TextArea> = {
  title: 'Components/TextArea',
  component: TextArea,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof TextArea>

export const Default: Story = {
  args: { placeholder: 'Write something...' },
}

export const WithValue: Story = {
  args: { value: 'This is a longer piece of text that spans multiple lines.' },
}

export const Disabled: Story = {
  args: { placeholder: 'Disabled', disabled: true },
}
