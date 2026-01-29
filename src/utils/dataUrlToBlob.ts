/*
 * @Author: Jim
 * @Date: 2021-12-31 01:36:52
 * @LastEditors: Jim
 * @LastEditTime: 2021-12-31 01:40:00
 * @Description: dataURL to blob
 */

export function dataURLtoBlob(dataURL: string) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
