import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox } from './Checkbox'

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs']
}
export default meta

type Story = StoryObj<typeof Checkbox>

export const Default: Story = {
  args: { label: 'I agree to the terms and conditions' }
}

export const Checked: Story = {
  args: { label: 'Remember me', checked: true }
}

export const Disabled: Story = {
  args: { label: 'Unavailable option', disabled: true }
}
