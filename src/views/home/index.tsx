import { Button, Card, Divider, Image, Space, Tag, Typography, Upload } from 'antd';
import { useState } from 'react';
import { useIdle, useNetworkState } from 'react-use';
// components
import SplitText from '@/components/ui/SplitText';
// hooks
import useImageCompression from '@/common/hooks/useImageCompression';

const HomePage = () => {
  // --- state -----------------------
  const [imgList, setImgList] = useState<
    {
      src: string;
      size: number;
      originSize: number;
      timeTaken: number;
    }[]
  >([]);

  // --- hooks -----------------------
  const isIdle = useIdle(5000, false);
  const { online } = useNetworkState();
  const { compressImage } = useImageCompression();

  const handleAnimationComplete = async () => {
    console.log('All letters have animated!');
  };

  const handleBeforeUpload = async (file: File, fileList: File[]) => {
    console.log('file', file);
    console.log('fileList', fileList);

    const compressedFile = await compressImage(file);
    if (compressedFile) {
      setImgList((prev) => [
        ...prev,
        {
          src: URL.createObjectURL(compressedFile.file),
          size: compressedFile.file.size,
          originSize: compressedFile.originalSize,
          timeTaken: compressedFile.timeTakenSec,
        },
      ]);
    }

    return false; // 阻止默认上传行为
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
        <Upload beforeUpload={handleBeforeUpload} multiple showUploadList={false}>
          <Button type="primary">Click to Upload</Button>
        </Upload>
        <Divider />
        <Space orientation="vertical">
          {imgList.map(({ src, size, originSize, timeTaken }) => (
            <Space key={src}>
              <Image src={src} width={300} alt="uploaded" />
              <Divider orientation="vertical" />
              <Typography.Text type="secondary">
                {`Size: ${(size / 1024 / 1024).toFixed(2)} MB`}
              </Typography.Text>
              <Divider orientation="vertical" />
              <Typography.Text type="secondary">
                {`Original Size: ${(originSize / 1024 / 1024).toFixed(2)} MB`}
              </Typography.Text>
              <Divider orientation="vertical" />
              <Typography.Text type="secondary">
                {`Time Taken: ${(timeTaken / 1000).toFixed(2)} sec`}
              </Typography.Text>
            </Space>
          ))}
        </Space>
      </Card>
    </div>
  );
};

export default HomePage;
