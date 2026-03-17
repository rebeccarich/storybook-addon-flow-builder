import type { Meta, StoryObj } from '@storybook/react-vite'
import { Toggle } from './Toggle'

const meta: Meta<typeof Toggle> = {
  title: 'Components/Toggle',
  component: Toggle,
  tags: ['autodocs']
}
export default meta

type Story = StoryObj<typeof Toggle>

export const Default: Story = {
  args: { label: 'Email notifications' }
}

export const On: Story = {
  args: { label: 'Dark mode', checked: true }
}

export const Disabled: Story = {
  args: { label: 'Premium feature', disabled: true }
}
