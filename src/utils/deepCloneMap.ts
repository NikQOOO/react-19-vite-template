/*
 * @Author: Jim
 * @Date: 2023-07-12 11:11:00
 * @LastEditors: Jim
 * @LastEditTime: 2023-07-12 11:11:00
 * @Description: Map Deep Copy
 */
const deepCloneMap = <T, K>(originMap: Map<T, K>) => {
  const tempMap = new Map<T, K>();
  for (const [key, value] of originMap) {
    if (value instanceof Map) {
      tempMap.set(key, deepCloneMap(value as Map<T, K>) as unknown as K);
    } else {
      tempMap.set(key, value);
    }
  }
  return tempMap;
};

export default deepCloneMap;
