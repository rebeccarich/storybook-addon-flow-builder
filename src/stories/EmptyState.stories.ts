import type { Meta, StoryObj } from '@storybook/react-vite'
import { EmptyState } from './EmptyState'

const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState',
  component: EmptyState,
  tags: ['autodocs']
}
export default meta

type Story = StoryObj<typeof EmptyState>

export const Default: Story = {
  args: {
    title: 'No items yet',
    description: 'Create your first item to get started.',
    icon: '\uD83D\uDCE6'
  }
}

export const Search: Story = {
  args: {
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
    icon: '\uD83D\uDD0D'
  }
}

export const NoIcon: Story = {
  args: {
    title: 'Nothing here',
    description: 'This section is empty.'
  }
}
