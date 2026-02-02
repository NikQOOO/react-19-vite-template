import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

/** 草稿状态初始值 */
const draftStoreInitialState: DraftStore.IDraftState = {
  form: {},
  step: 0,
  dirty: false,
};

/** 草稿 Store - 用于管理多步骤表单的草稿数据 */
const useDraftStore = create(
  immer<DraftStore.IDraftState & DraftStore.IDraftActions>((set) => ({
    ...draftStoreInitialState,
    patchForm: (payload) =>
      set((state) => {
        Object.assign(state.form, payload);
        state.dirty = true;
      }),
    setStep: (step) =>
      set((state) => {
        state.step = Math.max(0, step);
        state.dirty = true;
      }),
    hydrate: ({ form, step }) =>
      set((state) => {
        state.form = form ?? {};
        state.step = Number.isFinite(step) ? step : 0;
        state.dirty = false;
      }),
    markSaved: () =>
      set((state) => {
        state.dirty = false;
      }),
    reset: () => {
      set((state) => {
        Object.assign(state, draftStoreInitialState);
      });
    },
  })),
);

export default useDraftStore;
