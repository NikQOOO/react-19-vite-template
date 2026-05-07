import type { CodeExample, DemoItem } from './types';

const TOPICS = [
  'React 并发',
  '输入搜索',
  '数据看板',
  '渲染预算',
  '筛选列表',
  '图表刷新',
  '协作编辑',
  '智能排序',
  '地图检索',
  '任务队列',
  '代码补全',
  '报表洞察',
];

const CITIES = ['上海', '深圳', '杭州', '北京', '成都', '广州', '南京', '武汉'];
const TAGS = ['state', 'render', 'input', 'list', 'chart', 'memo', 'route', 'worker'];
const DETAILS = [
  '用户正在连续输入，结果区需要做大量筛选与排序。',
  '这条记录模拟一个需要计算颜色、分数和摘要的复杂组件。',
  '在低优先级渲染期间，React 可以优先响应更紧急的交互。',
  '列表越长、单项越重，直接同步更新越容易让输入卡住。',
];
const ACCENTS = ['#14b8a6', '#f97316', '#3b82f6', '#ef4444', '#8b5cf6', '#22c55e'];

export const DATASET = Array.from({ length: 720 }, (_, index): DemoItem => {
  const topic = TOPICS[index % TOPICS.length];
  const city = CITIES[(index * 5) % CITIES.length];
  const tag = TAGS[(index * 7) % TAGS.length];

  return {
    id: index + 1,
    name: `${topic} #${String(index + 1).padStart(3, '0')}`,
    city,
    tag,
    detail: DETAILS[(index * 3) % DETAILS.length],
    score: 55 + ((index * 37) % 45),
    accent: ACCENTS[index % ACCENTS.length],
  };
});

export const PRESET_QUERIES = ['render', '上海', 'chart', 'React'];

export const CODE_EXAMPLES: CodeExample[] = [
  {
    key: 'direct',
    label: '直接更新',
    title: '一个 state 同时驱动输入和重列表',
    note: '简单，但输入和昂贵列表渲染会绑在同一次高优先级更新里。',
    code: `const [query, setQuery] = useState('');

<input value={query} onChange={(event) => setQuery(event.target.value)} />
<HeavyList query={query} />`,
  },
  {
    key: 'deferred',
    label: 'Deferred',
    title: '源状态即时更新，重列表读取延后值',
    note: '适合搜索框、过滤器这类“输入必须快，结果可以慢半拍”的场景。',
    code: `const [query, setQuery] = useState('');
const deferredQuery = useDeferredValue(query);

<input value={query} onChange={(event) => setQuery(event.target.value)} />
<HeavyList query={deferredQuery} />`,
  },
  {
    key: 'transition',
    label: 'Transition',
    title: '把重视图所需状态标记成低优先级',
    note: '适合主动把列表刷新、Tab 内容切换、复杂视图更新放进非紧急通道。',
    code: `const [text, setText] = useState('');
const [query, setQuery] = useState('');
const [isPending, startTransition] = useTransition();

function onChange(nextText: string) {
  setText(nextText);
  startTransition(() => setQuery(nextText));
}`,
  },
  {
    key: 'combined',
    label: '组合',
    title: '先降级状态更新，再延后重列表消费',
    note: '适合更重的列表或图表。transition 管状态更新优先级，deferredValue 管消费者跟进节奏。',
    code: `const [text, setText] = useState('');
const [query, setQuery] = useState('');
const [isPending, startTransition] = useTransition();
const deferredQuery = useDeferredValue(query);

function onChange(nextText: string) {
  setText(nextText);
  startTransition(() => setQuery(nextText));
}

<HeavyList query={deferredQuery} dimmed={isPending} />`,
  },
];
