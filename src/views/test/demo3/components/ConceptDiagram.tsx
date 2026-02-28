import { Card, Space, Typography } from 'antd';
import type { CSSProperties } from 'react';

const { Text } = Typography;

// ─── 样式常量 ──────────────────────────────────────────────────────────────────

const memBlock = (color: string, dashed = false): CSSProperties => ({
  border: `2px ${dashed ? 'dashed' : 'solid'} ${color}`,
  borderRadius: 8,
  padding: '10px 16px',
  textAlign: 'center',
  minWidth: 100,
  background: `${color}18`,
});

const arrowBox: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 4px',
  gap: 2,
};

const rowCenter: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  padding: '12px 0',
};

const label: CSSProperties = { fontSize: 11, opacity: 0.65 };

// ─── 组件 ──────────────────────────────────────────────────────────────────────

/**
 * 传输模式原理图
 *
 * 用带颜色的方块 + 箭头直观展示 Structured Clone 和 Transferable 的内存行为差异。
 */
export const ConceptDiagram = () => {
  return (
    <Space style={{ width: '100%' }} size="middle" align="start">
      {/* ── Structured Clone ── */}
      <Card
        size="small"
        style={{ flex: 1, borderColor: '#52c41a' }}
        styles={{ header: { background: '#f6ffed' } }}
        title={
          <Text strong style={{ color: '#52c41a' }}>
            Structured Clone（默认）
          </Text>
        }
      >
        <Text code style={{ fontSize: 13 }}>
          postMessage(msg)
        </Text>

        <div style={rowCenter}>
          {/* 主线程 buffer */}
          <div>
            <div style={label}>主线程</div>
            <div style={memBlock('#52c41a')}>
              <Text strong style={{ color: '#52c41a', fontSize: 15 }}>
                Buffer A
              </Text>
              <br />
              <Text style={{ fontSize: 12 }}>10 MB</Text>
            </div>
            <div style={{ marginTop: 4, textAlign: 'center' }}>
              <Text style={{ color: '#52c41a', fontSize: 12, fontWeight: 600 }}>✓ 仍可用</Text>
            </div>
          </div>

          {/* 箭头 */}
          <div style={arrowBox}>
            <Text style={{ fontSize: 11, color: '#faad14' }}>序列化</Text>
            <Text style={{ fontSize: 22, lineHeight: 1 }}>⟹</Text>
            <Text style={{ fontSize: 11, color: '#faad14' }}>复制</Text>
          </div>

          {/* Worker buffer */}
          <div>
            <div style={label}>Worker</div>
            <div style={memBlock('#52c41a')}>
              <Text strong style={{ color: '#52c41a', fontSize: 15 }}>
                Buffer A′
              </Text>
              <br />
              <Text style={{ fontSize: 12 }}>10 MB</Text>
            </div>
            <div style={{ marginTop: 4, textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                新副本
              </Text>
            </div>
          </div>
        </div>

        {/* 内存总览 */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            borderRadius: 6,
            padding: '6px 10px',
            background: '#f6ffed',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#52c41a' }} />
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#95de64' }} />
          <Text strong style={{ fontSize: 12, marginLeft: 8, whiteSpace: 'nowrap' }}>
            内存 ×2（20 MB）
          </Text>
        </div>

        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
          数据越大，序列化 + 复制的耗时越高，传输开销与数据量成 <Text strong>O(n)</Text> 线性关系。
        </Text>
      </Card>

      {/* ── Transferable ── */}
      <Card
        size="small"
        style={{ flex: 1, borderColor: '#1677ff' }}
        styles={{ header: { background: '#e6f4ff' } }}
        title={
          <Text strong style={{ color: '#1677ff' }}>
            Transferable（零拷贝）
          </Text>
        }
      >
        <Text code style={{ fontSize: 13 }}>
          postMessage(msg, [buffer])
        </Text>

        <div style={rowCenter}>
          {/* 主线程 buffer — detached */}
          <div>
            <div style={label}>主线程</div>
            <div style={memBlock('#ff4d4f', true)}>
              <Text delete style={{ color: '#ff4d4f', fontSize: 15 }}>
                Buffer A
              </Text>
              <br />
              <Text style={{ fontSize: 12, color: '#ff4d4f' }}>0 bytes</Text>
            </div>
            <div style={{ marginTop: 4, textAlign: 'center' }}>
              <Text style={{ color: '#ff4d4f', fontSize: 12, fontWeight: 600 }}>✗ detached</Text>
            </div>
          </div>

          {/* 箭头 */}
          <div style={arrowBox}>
            <Text style={{ fontSize: 11, color: '#1677ff' }}>转移所有权</Text>
            <Text style={{ fontSize: 22, lineHeight: 1 }}>⟹</Text>
            <Text style={{ fontSize: 11, color: '#1677ff' }}>≈ O(1)</Text>
          </div>

          {/* Worker buffer — 获得所有权 */}
          <div>
            <div style={label}>Worker</div>
            <div style={memBlock('#1677ff')}>
              <Text strong style={{ color: '#1677ff', fontSize: 15 }}>
                Buffer A
              </Text>
              <br />
              <Text style={{ fontSize: 12 }}>10 MB</Text>
            </div>
            <div style={{ marginTop: 4, textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                同一块内存
              </Text>
            </div>
          </div>
        </div>

        {/* 内存总览 */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            borderRadius: 6,
            padding: '6px 10px',
            background: '#e6f4ff',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#1677ff' }} />
          <div
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              background: 'transparent',
              border: '1px dashed #bbb',
            }}
          />
          <Text strong style={{ fontSize: 12, marginLeft: 8, whiteSpace: 'nowrap' }}>
            内存 ×1（10 MB）
          </Text>
        </div>

        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
          不复制数据，只转移指针。传输开销与数据量几乎无关，近乎 <Text strong>O(1)</Text> 常数时间。
        </Text>
      </Card>
    </Space>
  );
};
