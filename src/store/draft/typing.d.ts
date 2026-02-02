/**
 * 草稿 Store 类型定义
 * 用于多步骤表单的草稿数据管理
 */
declare namespace DraftStore {
  /**
   * 草稿状态接口
   */
  interface IDraftState {
    /** 表单数据，键值对格式存储各字段值 */
    form: Record<string, unknown>;
    /** 当前步骤索引，从 0 开始 */
    step: number;
    /** 脏数据标记，表示是否有未保存的更改 */
    dirty: boolean;
  }

  /**
   * 草稿操作方法接口
   */
  interface IDraftActions {
    /** 更新表单数据（部分更新，会与现有数据合并） */
    patchForm: (payload: Record<string, unknown>) => void;
    /** 设置当前步骤 */
    setStep: (step: number) => void;
    /** 从持久化存储中恢复状态
     * - 仅用于初始化恢复
     * - 不应触发持久化
     */
    hydrate: (state: Pick<IDraftState, 'form' | 'step'>) => void;
    /** 标记当前状态已保存（重置 dirty 标记） */
    markSaved: () => void;
    /** 重置到初始状态（清空所有数据） */
    reset: () => void;
  }
}
