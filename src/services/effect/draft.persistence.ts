import { getWithMeta, setWithMeta } from '@/storage/cache';
import { draftStore } from '@/storage/instance';
import useDraftStore from '@/store/draft/index.store';

const KEY = (userId: string) => `xxxModule:draft:${userId}`;
const VERSION = 1;
const TTL = 6 * 60 * 60 * 1000; // 6 hours

/**
 * 从持久化存储中恢复草稿数据
 * @param userId - 用户 ID
 */
export async function hydrateDraft(userId: string) {
  const data = await getWithMeta<Pick<DraftStore.IDraftState, 'form' | 'step'>>(
    draftStore,
    KEY(userId),
    {
      version: VERSION,
    },
  );

  if (data) {
    useDraftStore.getState().hydrate(data);
  }
}

let timer: number | null = null;

/**
 * 调度草稿数据保存到持久化存储
 * @param userId - 用户 ID
 */
export function scheduleDraftSave(userId: string) {
  if (timer) {
    clearTimeout(timer);
  }

  // 延迟 500ms 保存，避免频繁写入
  timer = window.setTimeout(async () => {
    const { form, step, dirty } = useDraftStore.getState();

    // 未修改则不保存
    if (!dirty) {
      return;
    }

    // 保存草稿数据
    await setWithMeta(draftStore, KEY(userId), { form, step }, { version: VERSION, ttlMs: TTL });

    // 标记已保存
    useDraftStore.getState().markSaved();
  }, 500);
}

/**
 * 强制落盘
 * @param userId - 用户 ID
 */
export async function flushDraft(userId: string) {
  const { form, step, dirty } = useDraftStore.getState();

  // 未修改则不保存
  if (!dirty) {
    return;
  }

  await setWithMeta(draftStore, KEY(userId), { form, step }, { version: VERSION });

  // 标记已保存
  useDraftStore.getState().markSaved();
}

/**
 * 清除草稿数据
 * 提交成功 / 退出清理
 * @param userId - 用户 ID
 */
export async function clearDraft(userId: string) {
  await draftStore.removeItem(KEY(userId));
  useDraftStore.getState().reset();
}
