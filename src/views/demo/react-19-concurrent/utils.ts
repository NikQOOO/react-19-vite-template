import { DATASET } from './constants';

export const burnCpu = (seed: number, workFactor: number) => {
  let value = seed + 1;
  for (let index = 0; index < workFactor; index += 1) {
    value = Math.imul(value ^ (value >>> 7), 1_103_515_245) + 12_345;
  }
  return Math.abs(value % 100);
};

export const formatQuery = (value: string) => {
  const next = value.trim();
  return next || '全部';
};

export const formatMs = (value: number | null) => {
  if (value === null) return '-';
  if (value < 1) return '<1ms';
  return `${Math.round(value)}ms`;
};

export const filterItems = (query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return DATASET;
  }

  return DATASET.filter((item) => {
    const searchText = `${item.name} ${item.city} ${item.tag} ${item.detail}`.toLowerCase();
    return searchText.includes(normalizedQuery);
  });
};
