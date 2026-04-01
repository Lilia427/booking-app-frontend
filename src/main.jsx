import * as Sentry from "@sentry/react";
import { RoomContext } from './context/RoomContext';
import ReactDOM from 'react-dom/client'
import React from 'react'
import App from './App'
import './style/index.css';

Sentry.init({
  dsn: "https://baeecf0bd9f921e18a19a2683db46b5a@o4511147327029248.ingest.de.sentry.io/4511147414454352",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/api\.runabooking\.me/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  sendDefaultPii: true,
  enableLogs: true,
});


ReactDOM
  .createRoot(document.getElementById('root'))
  .render(
    <RoomContext>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </RoomContext>,
  )