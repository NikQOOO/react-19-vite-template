import { useIdle, useNetworkState } from 'react-use';

import SplitText from '@/components/ui/SplitText';

const HomePage = () => {
  // =================== hooks ===================
  const isIdle = useIdle(5000, false);
  const { online } = useNetworkState();

  const handleAnimationComplete = () => {
    console.log('All letters have animated!');
  };
  return (
    <div>
      <div>
        <h3>{isIdle ? 'User is idle' : 'User is active'}</h3>
        <br />

        <p>{online ? 'Online' : 'Offline'}</p>

        <SplitText
          text="Hello, you!"
          className="text-center text-2xl font-semibold"
          delay={50}
          duration={1.25}
          ease="power3.out"
          splitType="chars"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
          textAlign="center"
          onLetterAnimationComplete={handleAnimationComplete}
        />
      </div>
    </div>
  );
};

export default HomePage;
