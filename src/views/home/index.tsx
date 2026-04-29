import { Card, Divider, Space, Tag, Typography } from 'antd';
import { useIdle, useNetworkState } from 'react-use';
// components
import SplitText from '@/components/ui/SplitText';
import CompressionUpload from './CompressionUpload';
import EnterBoxModule from './EnterBoxModule';
import NewFeature from './newFeature';

const HomePage = () => {
  // --- hooks -----------------------
  const isIdle = useIdle(5000, false);
  const { online } = useNetworkState();

  const handleAnimationComplete = async () => {
    console.log('All letters have animated!');
  };

  return (
    <div>
      <Card
        title={
          <SplitText
            text="This is a Text page"
            className="text-center text-2xl font-semibold"
            delay={50}
            duration={1}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
            onLetterAnimationComplete={handleAnimationComplete}
          />
        }
        extra={
          <Space>
            <Typography.Text type="secondary">
              {isIdle ? 'User is idle' : 'User is active'}
            </Typography.Text>
            <Tag color="cyan">{online ? 'Online' : 'Offline'}</Tag>
          </Space>
        }
      >
        <NewFeature />
        <Divider />
        <EnterBoxModule />
        <Divider />
        <Typography.Title level={3}>Image Compression</Typography.Title>
        <CompressionUpload />
      </Card>
    </div>
  );
};

export default HomePage;
