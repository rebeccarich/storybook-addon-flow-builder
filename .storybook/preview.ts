/// <reference types="vite/client" />
import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    },
    flowbuilder: {
      apiKey: import.meta.env.STORYBOOK_FLOWBUILDER_API_KEY
    }
  },
  initialGlobals: {
    background: { value: 'light' }
  }
}

export default preview
