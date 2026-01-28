import { useEffect } from 'react';

const useClickOutside = (ref: React.RefObject<HTMLElement>, callback: (event: MouseEvent) => void) => {
  useEffect(() => {
    const handler = (evt: MouseEvent) => {
      if (!ref.current || ref.current.contains(evt.target as HTMLElement)) {
        return;
      }
      callback(evt);
    };
    document.addEventListener('click', handler);
    return () => {
      document.removeEventListener('click', handler);
    };
  }, [callback, ref]);
};

export default useClickOutside;
