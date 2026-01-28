import { useEffect } from 'react';

type ScreenSizeChangeListener = () => void;

/** 监听屏幕大小变化 */
const useWindowResize = (listener: ScreenSizeChangeListener) => {
  useEffect(() => {
    listener();
    window.addEventListener('resize', listener);
    return () => {
      window.removeEventListener('resize', listener);
    };
  }, [listener]);
};

export default useWindowResize;
