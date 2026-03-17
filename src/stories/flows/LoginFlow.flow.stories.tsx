// LoginFlow — Flow Stories
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { handlers } from './LoginFlow.mocks';

import { Card } from '../Card';
import { FormField } from '../FormField';
import { TextInput } from '../TextInput';
import { Button } from '../Button';
import { Alert } from '../Alert';
import { Avatar } from '../Avatar';

const meta: Meta = {
  title: 'Flows/LoginFlow',
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const LoginForm: StoryObj = {
  render: () => (
    <div style={{"padding":48,"maxWidth":400,"margin":"0 auto","minHeight":"100vh","display":"flex","flexDirection":"column","justifyContent":"center"}}>
      <Card >
        <div style={{"padding":32}}>
          <h2 style={{"marginBottom":24,"textAlign":"center","fontSize":28,"fontWeight":600}}>Sign In</h2>
          <p style={{"marginBottom":32,"textAlign":"center","color":"#666"}}>Welcome back! Please sign in to your account.</p>
          <form style={{"display":"flex","flexDirection":"column","gap":20}}>
            <FormField label="Email Address">
              <TextInput type="email" placeholder="Enter your email" />
            </FormField>
            <FormField label="Password">
              <TextInput type="password" placeholder="Enter your password" />
            </FormField>
            <div style={{"marginTop":8}}>
              <Button variant="Primary" label="Sign In" style={{"width":"100%"}} />
            </div>
          </form>
        </div>
      </Card>
    </div>
  ),
  parameters: {
    msw: { handlers: handlers.success },
    flowbuilder: { rationale: "Reduce Cognitive Load — the login form is contained within a clean card layout with only essential fields (email and password), eliminating distractions and focusing the user on the single task of authentication." },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // TODO: fills in email and password, clicks 'Sign In'
  },
};

export const LoginErrorState: StoryObj = {
  render: () => (
    <div style={{"padding":48,"maxWidth":400,"margin":"0 auto","minHeight":"100vh","display":"flex","flexDirection":"column","justifyContent":"center"}}>
      <Card >
        <div style={{"padding":32}}>
          <h2 style={{"marginBottom":24,"textAlign":"center","fontSize":28,"fontWeight":600}}>Sign In</h2>
          <p style={{"marginBottom":24,"textAlign":"center","color":"#666"}}>Welcome back! Please sign in to your account.</p>
          <Alert variant="Error" style={{"marginBottom":24}}>Invalid email or password. Please try again.</Alert>
          <form style={{"display":"flex","flexDirection":"column","gap":20}}>
            <FormField label="Email Address">
              <TextInput type="email" placeholder="Enter your email" />
            </FormField>
            <FormField label="Password">
              <TextInput type="password" placeholder="Enter your password" />
            </FormField>
            <div style={{"marginTop":8}}>
              <Button variant="Primary" label="Sign In" style={{"width":"100%"}} />
            </div>
          </form>
        </div>
      </Card>
    </div>
  ),
  parameters: {
    flowbuilder: { rationale: "Error Prevention — the error alert appears prominently at the top of the form, providing clear feedback about what went wrong while preserving the user's context and allowing them to immediately correct their credentials without losing their place." },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // TODO: corrects email or password, clicks 'Sign In' again
  },
};

export const WelcomeDashboard: StoryObj = {
  render: () => (
    <div style={{"padding":48,"maxWidth":800,"margin":"0 auto","minHeight":"100vh"}}>
      <Card >
        <div style={{"padding":48,"textAlign":"center"}}>
          <div style={{"marginBottom":24}}>
            <Avatar name="Alex Smith" src="https://i.pravatar.cc/150?u=alex" variant="Large" />
          </div>
          <h1 style={{"marginBottom":16,"fontSize":32,"fontWeight":600}}>Welcome back, Alex!</h1>
          <p style={{"marginBottom":32,"fontSize":18,"color":"#666"}}>You've successfully signed in to your account.</p>
          <div style={{"display":"flex","gap":16,"justifyContent":"center","flexWrap":"wrap"}}>
            <Button variant="Primary" label="Go to Dashboard" />
            <Button variant="Secondary" label="View Profile" />
          </div>
        </div>
      </Card>
    </div>
  ),
  parameters: {
    flowbuilder: { rationale: "Recognition Over Recall — the welcome page displays the user's avatar and greets them by name, providing visual confirmation that they've logged into the correct account and establishing a personal connection with the interface." },
  },
};
