import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-3)',
            color: 'var(--text-1)',
            border: '1px solid var(--border-bright)',
            fontFamily: 'var(--font-ui)',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--bg-3)' } },
          error: { iconTheme: { primary: 'var(--red)', secondary: 'var(--bg-3)' } },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);