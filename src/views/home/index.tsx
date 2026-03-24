import { Button, Card, Divider, Form, Space, Tag, Typography } from 'antd';
import { useCallback } from 'react';
import { useIdle, useNetworkState } from 'react-use';
// components
import SplitText from '@/components/ui/SplitText';
import CompressionUpload from './CompressionUpload';
import type { IEnterSearchOption } from './components/EnterSearchBox';
import EnterSearchBox from './components/EnterSearchBox';

interface IProduct {
  id: number;
  name: string;
}

interface IOrderForm {
  productName: string;
  remark: string;
}

const HomePage = () => {
  // --- hooks -----------------------
  const isIdle = useIdle(5000, false);
  const { online } = useNetworkState();

  const [form] = Form.useForm<IOrderForm>();

  const handleAnimationComplete = async () => {
    console.log('All letters have animated!');
  };

  /** 模拟异步搜索，每页 6 条，最多 3 页 */
  const handleSearch = useCallback(async (keyword: string, page: number) => {
    await new Promise<void>((resolve) => setTimeout(resolve, 800));
    const offset = (page - 1) * 6;
    return {
      list: Array.from<undefined, IEnterSearchOption<IProduct>>({ length: 6 }, (_, i) => ({
        label: `${keyword} 商品 ${offset + i + 1}`,
        content: (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{`${keyword} 商品 ${offset + i + 1}`}</span>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ¥{((offset + i + 1) * 10).toFixed(2)}
            </Typography.Text>
          </div>
        ),
        value: { id: offset + i + 1, name: `${keyword} 商品 ${offset + i + 1}` },
      })),
      hasMore: page < 3,
    };
  }, []);

  const handleFinish = (values: IOrderForm) => {
    console.log('提交表单：', values);
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
        <Typography.Title level={5} style={{ marginBottom: 16 }}>
          EnterSearchBox — antd Form 集成示例
        </Typography.Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ productName: '', remark: '' }}
          style={{ maxWidth: 480 }}
        >
          <Form.Item
            name="productName"
            label="商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            {/* Form.Item 会自动注入 value / onChange / id / status，
                EnterSearchBox 完整透传这些 props，无需手动绑定 */}
            <EnterSearchBox<IProduct>
              placeholder="输入关键词搜索商品"
              onSearch={handleSearch}
              onSelect={(item) => {
                // 选中时可同步填充其他字段
                form.setFieldValue('remark', `已选商品 ID: ${item.value.id}`);
              }}
            />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <EnterSearchBox placeholder="选择商品后自动填充，也可手动输入" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={() => form.resetFields()}>重置</Button>
              <Button
                onClick={() =>
                  form.setFieldsValue({
                    productName: '程序设置的值',
                    remark: '来自 setFieldsValue',
                  })
                }
              >
                程序赋值
              </Button>
            </Space>
          </Form.Item>
        </Form>
        <EnterSearchBox placeholder="123" />

        <Divider />
        <Typography.Title level={3}>Image Compression</Typography.Title>
        <CompressionUpload />
      </Card>
    </div>
  );
};

export default HomePage;
