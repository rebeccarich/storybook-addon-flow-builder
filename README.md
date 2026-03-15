# Storybook Addon Flow Builder

AI-driven user flow creation for Storybook. Describe a user journey in plain English, and the addon reads your component library, applies UX reasoning, and produces an interactive annotated flow — rendered with your actual components.

## Installation

```sh
npm install --save-dev storybook-addon-flow-builder
```

Register in `.storybook/main.ts`:

```ts
const config = {
  addons: ['storybook-addon-flow-builder'],
};
export default config;
```

## Setup

Add your Anthropic API key in `.storybook/preview.ts`:

```ts
const preview = {
  parameters: {
    flowbuilder: {
      apiKey: import.meta.env.STORYBOOK_FLOWBUILDER_API_KEY,
    },
  },
};
export default preview;
```

Create a `.env` file (gitignored):

```
STORYBOOK_FLOWBUILDER_API_KEY=sk-ant-...
```

## Usage

1. Open Storybook and click the **Flow Builder** tab
2. Type a user flow description (e.g. "User signs up, completes onboarding, sees dashboard")
3. Click **Generate Flow**
4. The addon discovers your components, calls Claude to plan the flow, and renders each step with the actual component in the preview
5. Use **Prev/Next** to navigate steps — the preview shows the real component via iframe
6. Missing components are clearly marked with suggested names and props

### Saving flows

- **Save to Project** writes story files to `src/stories/flows/`
- **Download Zip** exports the files as a zip

Generated files include fixtures, MSW mock handlers, and flow stories that compose from your existing stories.

## Development

```sh
pnpm install
pnpm start        # build in watch mode + Storybook dev server
pnpm build        # production build
pnpm storybook    # Storybook only
```
