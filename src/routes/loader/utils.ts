import { useUserStore } from '@/store/system/index.store';

export const isAuthenticated = () => {
  return useUserStore.getState().token !== '';
};
