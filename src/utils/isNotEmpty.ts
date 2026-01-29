/**
 * 判断值不为空
 * @param value 任意值
 */
const isNotEmpty = (value: unknown) => {
  if (typeof value === 'function') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).length > 0;
  }
  if (typeof value === 'string') {
    return value.length > 0;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value > -1;
  }
  return value !== undefined && value !== null;
};

export default isNotEmpty;
