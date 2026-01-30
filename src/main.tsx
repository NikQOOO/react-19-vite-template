// import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import localforage from 'localforage';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';

import 'normalize.css';

import App from './App.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 6, // 6 hours
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: localforage,
  // storage: AsyncStorage,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
      }}
    >
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  </StrictMode>,
);
