import type { IEnterSearchOption } from './types';

export type DropState<T> = {
  open: boolean;
  options: IEnterSearchOption<T>[];
  hasMore: boolean;
  page: number;
  loading: boolean; // 首屏/关键词刷新
  moreLoading: boolean; // 翻页追加
};

export type DropAction<T> =
  | { type: 'search_start' }
  | { type: 'more_start' }
  | {
      type: 'fetch_done';
      replace: boolean;
      list: IEnterSearchOption<T>[];
      hasMore: boolean;
      page: number;
    }
  | { type: 'fetch_error'; replace: boolean }
  | { type: 'open' | 'close' | 'reset' };

export function dropReducer<T>(state: DropState<T>, action: DropAction<T>): DropState<T> {
  switch (action.type) {
    case 'search_start':
      return { ...state, open: true, options: [], loading: true };
    case 'more_start':
      return { ...state, moreLoading: true };
    case 'fetch_done':
      return action.replace
        ? {
            ...state,
            loading: false,
            options: action.list,
            hasMore: action.hasMore,
            page: action.page,
            open: action.list.length > 0,
          }
        : {
            ...state,
            moreLoading: false,
            options: [...state.options, ...action.list],
            hasMore: action.hasMore,
            page: action.page,
          };
    case 'fetch_error':
      return action.replace ? { ...state, loading: false } : { ...state, moreLoading: false };
    case 'open':
      return { ...state, open: true };
    case 'close':
      return { ...state, open: false };
    case 'reset':
      return {
        open: false,
        options: [],
        hasMore: false,
        page: 1,
        loading: false,
        moreLoading: false,
      };
  }
}

export const DROP_INIT: DropState<unknown> = {
  open: false,
  options: [],
  hasMore: false,
  page: 1,
  loading: false,
  moreLoading: false,
};
