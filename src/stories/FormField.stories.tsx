import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FormField } from './FormField'
import { TextInput } from './TextInput'

const meta: Meta<typeof FormField> = {
  title: 'Components/FormField',
  component: FormField,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof FormField>

export const Default: Story = {
  args: {
    label: 'Email address',
    hint: "We'll never share your email.",
    children: <TextInput type="email" placeholder="you@example.com" />,
  },
}

export const WithError: Story = {
  args: {
    label: 'Email address',
    error: 'Please enter a valid email address.',
    children: <TextInput type="email" error value="not-an-email" />,
  },
}
