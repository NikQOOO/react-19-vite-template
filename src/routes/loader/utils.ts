import { useUserStore } from '@/store/system';

export const isAuthenticated = () => {
  return useUserStore.getState().token !== '';
};
