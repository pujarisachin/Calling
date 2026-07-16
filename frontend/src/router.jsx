import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard/Dashboard';
import CallingPage from './pages/Calling/CallingPage';
import CarriersPage from './pages/Providers/CarriersPage';
import LLMProvidersPage from './pages/Providers/LLMProvidersPage';
import ConversationIntelligencePage from './pages/ConversationIntelligence/ConversationIntelligencePage';
import DocumentationPage from './pages/Documentation/DocumentationPage';
import SettingsPage from './pages/Settings/SettingsPage';
import NotFound from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/calling',
    element: <CallingPage />,
  },
  {
    path: '/calling/:testId',
    element: <CallingPage />,
  },
  {
    path: '/carriers',
    element: <CarriersPage />,
  },
  {
    path: '/llm-providers',
    element: <LLMProvidersPage />,
  },
  {
    path: '/intelligence',
    element: <ConversationIntelligencePage />,
  },
  {
    path: '/docs',
    element: <DocumentationPage />,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
