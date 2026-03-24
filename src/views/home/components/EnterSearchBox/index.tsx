import { LoadingOutlined } from '@ant-design/icons';
import { Input, Spin } from 'antd';
import classNames from 'classnames';
import { memo, useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';

import useClickOutside from '@/common/hooks/useClickOutside';

import styles from './index.module.css';
import { DROP_INIT, type DropState, dropReducer } from './reducer';
import SkeletonList from './SkeletonList';
import type { IEnterSearchOption, IProps } from './types';

export type { IEnterSearchOption } from './types';

/* --- Component ------------------------------------------------------------ */

function EnterSearchBoxInner<T = unknown>(props: IProps<T>) {
  const {
    value,
    defaultValue = '',
    onChange,
    onSelect,
    onSearch,
    placeholder = '',
    debounceDelay = 1000,
    disabled = false,
    className,
    style,
    id,
    status,
  } = props;

  // useState 惰性初始化：仅首次渲染执行，与 antd 受控/非受控判断方式一致
  const [isControlled] = useState(() => 'value' in props);
  const [innerValue, setInnerValue] = useState(defaultValue);
  const mergedValue = isControlled ? (value ?? '') : innerValue;

  const [drop, dispatch] = useReducer(dropReducer<T>, DROP_INIT as DropState<T>);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const versionRef = useRef(0); // 请求版本，防异步竞态
  const keywordRef = useRef(''); // 当前搜索词，供翻页使用
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined); // 防抖

  useClickOutside(
    containerRef as React.RefObject<HTMLElement>,
    useCallback(() => dispatch({ type: 'close' }), []),
  );

  const updateValue = useCallback(
    (next: string) => {
      if (!isControlled) setInnerValue(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  const resetDropdown = useCallback(() => {
    clearTimeout(timerRef.current);
    ++versionRef.current;
    keywordRef.current = '';
    dispatch({ type: 'reset' });
  }, []);

  const fetchPage = useCallback(
    async (keyword: string, pageNum: number, replace: boolean) => {
      if (!onSearch) return;
      const version = ++versionRef.current;
      if (!replace) dispatch({ type: 'more_start' });
      try {
        const result = await onSearch(keyword, pageNum);
        if (version !== versionRef.current) return;
        dispatch({
          type: 'fetch_done',
          replace,
          list: result.list,
          hasMore: result.hasMore,
          page: pageNum,
        });
      } catch {
        if (version === versionRef.current) dispatch({ type: 'fetch_error', replace });
      }
    },
    [onSearch],
  );

  // 「事件处理器 ref」：useLayoutEffect 每次渲染后同步最新闭包，
  // 让 IntersectionObserver 回调始终读到最新状态，且符合 React Compiler 规范
  const loadMoreRef = useRef<() => void>(() => {});

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      updateValue(next);
      if (!next.trim()) {
        resetDropdown();
        return;
      }
      clearTimeout(timerRef.current);
      ++versionRef.current; // 打断进行中的搜索请求，防止旧响应回来覆盖骨架屏
      dispatch({ type: 'search_start' }); // 立即显示骨架屏，不等防抖
      timerRef.current = setTimeout(() => {
        keywordRef.current = next;
        void fetchPage(next, 1, true);
      }, debounceDelay);
    },
    [updateValue, resetDropdown, fetchPage, debounceDelay],
  );

  const handleFocus = useCallback(() => {
    if (mergedValue.trim() && (drop.options.length > 0 || drop.loading)) {
      dispatch({ type: 'open' });
    }
  }, [mergedValue, drop.options.length, drop.loading]);

  const handleSelect = useCallback(
    (item: IEnterSearchOption<T>) => {
      updateValue(item.label);
      onSelect?.(item);
      dispatch({ type: 'close' });
    },
    [updateValue, onSelect],
  );

  useLayoutEffect(() => {
    loadMoreRef.current = () => {
      if (drop.hasMore && !drop.moreLoading) {
        void fetchPage(keywordRef.current, drop.page + 1, false);
      }
    };
  });

  // 组件卸载时清理定时器，避免内存泄漏和 React 警告
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // IntersectionObserver 监听 sentinel，触底加载下一页
  useEffect(() => {
    if (!drop.open || !drop.hasMore) return;
    const sentinel = sentinelRef.current;
    const list = listRef.current;
    if (!sentinel || !list) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMoreRef.current();
      },
      { root: list, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [drop.open, drop.hasMore]);

  return (
    <div ref={containerRef} className={classNames(styles.container, className)} style={style}>
      <Input
        id={id}
        status={status}
        value={mergedValue}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleChange}
        onFocus={handleFocus}
        autoComplete="off"
        suffix={
          onSearch ? (
            <span className={styles.suffixSpin} aria-hidden={!drop.loading}>
              <Spin
                indicator={<LoadingOutlined spin />}
                size="small"
                style={{ opacity: drop.loading ? 1 : 0, transition: 'opacity 0.2s' }}
              />
            </span>
          ) : undefined
        }
      />
      {drop.open && onSearch && (
        <div className={styles.dropdown}>
          <div ref={listRef} className={styles.list}>
            {drop.loading ? (
              <SkeletonList />
            ) : (
              <>
                {drop.options.map((item, i) => (
                  <div
                    key={i}
                    className={styles.option}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(item)}
                  >
                    {typeof item.content === 'string' ? <span>{item.content}</span> : item.content}
                  </div>
                ))}
                <div ref={sentinelRef} className={styles.sentinel} />
                {drop.moreLoading && (
                  <div className={styles.moreLoading}>
                    <Spin indicator={<LoadingOutlined spin />} size="small" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
const EnterSearchBox = memo(EnterSearchBoxInner) as typeof EnterSearchBoxInner;

export default EnterSearchBox;
