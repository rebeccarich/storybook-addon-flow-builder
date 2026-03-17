import type { Meta, StoryObj } from '@storybook/react-vite'
import { Modal } from './Modal'

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' }
}
export default meta

type Story = StoryObj<typeof Modal>

export const Default: Story = {
  args: {
    title: 'Confirm Action',
    children: 'Are you sure you want to proceed?'
  }
}

export const WithFooter: Story = {
  args: {
    title: 'Delete Item',
    children: 'This action cannot be undone.',
    footer: 'Cancel / Delete'
  }
}
