import type { Meta, StoryObj } from '@storybook/react-vite'
import { TextInput } from './TextInput'

const meta: Meta<typeof TextInput> = {
  title: 'Components/TextInput',
  component: TextInput,
  tags: ['autodocs']
}
export default meta

type Story = StoryObj<typeof TextInput>

export const Default: Story = {
  args: { placeholder: 'Enter text...' }
}

export const Email: Story = {
  args: { type: 'email', placeholder: 'you@example.com' }
}

export const Password: Story = {
  args: { type: 'password', placeholder: 'Password' }
}

export const WithError: Story = {
  args: { placeholder: 'Enter text...', error: true, value: 'bad input' }
}

export const Disabled: Story = {
  args: { placeholder: 'Disabled', disabled: true }
}
