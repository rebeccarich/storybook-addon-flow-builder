import type { Meta, StoryObj } from '@storybook/react-vite'
import { Alert } from './Alert'

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs']
}
export default meta

type Story = StoryObj<typeof Alert>

export const Info: Story = {
  args: { variant: 'info', children: 'Your profile has been updated.' }
}

export const Success: Story = {
  args: { variant: 'success', children: 'Account created successfully!' }
}

export const Warning: Story = {
  args: { variant: 'warning', children: 'Your session will expire in 5 minutes.' }
}

export const Error: Story = {
  args: { variant: 'error', children: 'Unable to save changes. Please try again.' }
}
