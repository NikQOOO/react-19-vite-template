export interface IEnterSearchOption<T = unknown> {
  /** 选中后回填到输入框的文本 */
  label: string;
  /** 下拉列表展示内容，支持字符串或自定义 ReactNode */
  content: string | React.ReactNode;
  /** 完整业务数据，通过 onSelect 回传 */
  value: T;
}

export interface ISearchResult<T> {
  list: IEnterSearchOption<T>[];
  hasMore: boolean;
}

export interface IProps<T = unknown> {
  /** 受控模式值，配合 onChange 使用；不传则组件内部自维护（非受控模式） */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSelect?: (item: IEnterSearchOption<T>) => void;
  onSearch?: (keyword: string, page: number) => Promise<ISearchResult<T>>;
  placeholder?: string;
  /** 防抖延迟 ms，默认 1000 */
  debounceDelay?: number;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** antd Form.Item 自动注入，用于关联 label for 属性 */
  id?: string;
  /** antd Form.Item 自动注入，控制校验边框颜色 */
  status?: '' | 'error' | 'warning';
}
