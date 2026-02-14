import localforage from 'localforage';

const DB_NAME = 'app-db';

export const draftStore = localforage.createInstance({
  name: DB_NAME,
  storeName: 'draft',
});

export const cacheStore = localforage.createInstance({
  name: DB_NAME,
  storeName: 'cache',
});

export const settingsStore = localforage.createInstance({
  name: DB_NAME,
  storeName: 'settings',
});
