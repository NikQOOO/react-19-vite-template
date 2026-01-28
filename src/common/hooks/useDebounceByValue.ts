import { useEffect, useState } from 'react';

/**减少工程搜索请求频率 */
function useDebounceByValue<T>(value: T, delay = 300) {
  const [debounceValue, setDebounceValue] = useState(value);
  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebounceValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debounceValue;
}

export default useDebounceByValue;
