import type { Meta, StoryObj } from '@storybook/react'
import { Select } from './Select'

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof Select>

const countries = [
  { label: 'United States', value: 'us' },
  { label: 'United Kingdom', value: 'gb' },
  { label: 'Canada', value: 'ca' },
  { label: 'Australia', value: 'au' },
]

export const Default: Story = {
  args: { options: countries, placeholder: 'Choose a country...' },
}

export const WithSelection: Story = {
  args: { options: countries, value: 'gb' },
}

export const Disabled: Story = {
  args: { options: countries, disabled: true },
}
