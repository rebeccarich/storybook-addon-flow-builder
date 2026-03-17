import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card } from './Card'

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs']
}
export default meta

type Story = StoryObj<typeof Card>

export const Default: Story = {
  args: {
    title: 'Card Title',
    children: 'This is the card body content.'
  }
}

export const WithFooter: Story = {
  args: {
    title: 'Order Summary',
    children: '2 items in your cart',
    footer: 'Total: $49.99'
  }
}

export const NoTitle: Story = {
  args: {
    children: 'A simple card without a title.'
  }
}
