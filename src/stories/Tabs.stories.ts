import type { Meta, StoryObj } from '@storybook/react'
import { Tabs } from './Tabs'

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  args: {
    tabs: [
      { label: 'Profile', value: 'profile' },
      { label: 'Settings', value: 'settings' },
      { label: 'Notifications', value: 'notifications' },
    ],
    value: 'profile',
  },
}

export const TwoTabs: Story = {
  args: {
    tabs: [
      { label: 'Sign In', value: 'signin' },
      { label: 'Sign Up', value: 'signup' },
    ],
    value: 'signin',
  },
}
