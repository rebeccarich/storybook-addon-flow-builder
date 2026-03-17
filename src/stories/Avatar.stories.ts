import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar } from './Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs']
}
export default meta

type Story = StoryObj<typeof Avatar>

export const Default: Story = {
  args: { name: 'Jane Doe' }
}

export const WithImage: Story = {
  args: {
    name: 'Jane Doe',
    src: 'https://i.pravatar.cc/150?u=jane'
  }
}

export const Small: Story = {
  args: { name: 'JD', size: 'small' }
}

export const Large: Story = {
  args: { name: 'Jane Doe', size: 'large' }
}
