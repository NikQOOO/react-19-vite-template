import { Button, Divider, Image, Space, Typography, Upload } from 'antd';
import { useState } from 'react';
// hooks
import useImageCompression from '@/common/hooks/useImageCompression';

const CompressionUpload = () => {
  const [imgList, setImgList] = useState<
    {
      src: string;
      size: number;
      originSize: number;
      timeTaken: number;
    }[]
  >([]);

  const { compressImage } = useImageCompression();

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
    <Space orientation="vertical" style={{ width: '100%' }}>
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
    </Space>
  );
};

export default CompressionUpload;
