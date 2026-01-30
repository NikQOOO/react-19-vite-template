import localforage from 'localforage';

export const draftStore = localforage.createInstance({
  name: 'app-db',
  storeName: 'draft',
});

export const cacheStore = localforage.createInstance({
  name: 'app-db',
  storeName: 'cache',
});
