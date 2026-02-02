/**
 * 缓存数据包装类型
 * 用于在 LocalForage 中存储带有元数据的缓存数据
 * @template T 缓存数据的类型
 */
type CacheEnvelope<T> = {
  /** schema version - 架构版本号，用于数据迁移和版本控制 */
  v: number;
  /** write time - 写入时间戳（performance.now()） */
  t: number;
  /** expireAt - 过期时间戳（performance.now()），可选 */
  e?: number;
  /** 实际缓存的数据 */
  data: T;
};

/**
 * 将数据带版本和过期时间存储到 LocalForage
 * @template T 数据类型
 * @param store LocalForage 实例
 * @param key 存储键名
 * @param data 要存储的数据
 * @param opts 配置选项
 * @param opts.version 数据版本号，用于版本校验
 * @param opts.ttlMs 可选的过期时间（毫秒），不传则永不过期
 */
export async function setWithMeta<T>(
  store: LocalForage,
  key: string,
  data: T,
  opts: { version: number; ttlMs?: number },
) {
  const now = performance.now();
  const payload: CacheEnvelope<T> = {
    v: opts.version,
    t: now,
    e: opts.ttlMs ? now + opts.ttlMs : undefined,
    data,
  };
  await store.setItem(key, payload);
}

/**
 * 从 LocalForage 读取带版本校验和过期检查的数据
 * @template T 数据类型
 * @param store LocalForage 实例
 * @param key 存储键名
 * @param opts 配置选项
 * @param opts.version 期望的数据版本号
 * @returns 返回缓存的数据，如果不存在、版本不匹配或已过期则返回 null
 */
export async function getWithMeta<T>(
  store: LocalForage,
  key: string,
  opts: { version: number },
): Promise<T | null> {
  const payload = await store.getItem<CacheEnvelope<T>>(key);

  // 缓存不存在
  if (!payload) return null;

  // 版本不匹配直接失效（或在这里做 migrate）
  if (payload.v !== opts.version) {
    await store.removeItem(key);
    return null;
  }

  // TTL 过期失效
  if (payload.e && performance.now() > payload.e) {
    await store.removeItem(key);
    return null;
  }

  return payload.data;
}
