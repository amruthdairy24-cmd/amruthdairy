'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportsClient } from './ReportsClient';

// We create a query client specifically for this page if one doesn't exist globally
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function ReportsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReportsClient />
    </QueryClientProvider>
  );
}
