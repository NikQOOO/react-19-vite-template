import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import StoreConstants from '../constants';

const platformInitialState: SystemStore.IPlatformState = {
  lang: 'en-US',
  collapse: false,
  breadcrumbList: [],
  isShowHeader: true,
  isShowHeaderLine: true,
};

const usePlatformStore = create(
  immer<SystemStore.IPlatformState & SystemStore.IPlatformActions>((set) => ({
    ...platformInitialState,
    setIsShowHeader: (isShowHeader) =>
      set((state) => {
        state.isShowHeader = isShowHeader;
      }),
    setLang: (lang) =>
      set((state) => {
        state.lang = lang;
      }),
    setBreadcrumb: (breadcrumbList, isShowHeaderLine) =>
      set((state) => {
        state.breadcrumbList = breadcrumbList;
        if (isShowHeaderLine === undefined || isShowHeaderLine) {
          state.isShowHeaderLine = true;
        } else {
          state.isShowHeaderLine = false;
        }
      }),
    setCollapse: (collapse) =>
      set((state) => {
        state.collapse = collapse;
      }),
    reset: () => {
      set(platformInitialState);
    },
  })),
);

const userInitialState: SystemStore.IUserState = {
  isLogin: false,
  token: undefined,
  user: undefined,
  company: '',
  companyId: '',
  auth: {},
};

const useUserStore = create(
  persist(
    immer<SystemStore.IUserState & SystemStore.IUserActions>((set) => ({
      ...userInitialState,
      setIsLogin: (isLogin) =>
        set((state) => {
          state.isLogin = isLogin;
        }),
      setToken: (token) =>
        set((state) => {
          state.token = token;
        }),
      setUser: (user) =>
        set((state) => {
          state.user = user;
        }),
      setCompany: (company) =>
        set((state) => {
          state.company = company;
        }),
      setCompanyId: (companyId) =>
        set((state) => {
          state.companyId = companyId;
        }),
      setAuth: (auth) =>
        set((state) => {
          state.auth = auth;
        }),
      reset: () => {
        set(userInitialState);
      },
    })),
    {
      name: StoreConstants.USER_STORE,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export { usePlatformStore, useUserStore };
