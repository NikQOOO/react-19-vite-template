const b64toBlob = (data: string, mimeType: string) => {
  const byteString = atob(data.split(',')[1]);
  const Buffer = new ArrayBuffer(byteString.length);
  const IntArr = new Uint8Array(Buffer);

  for (let i = 0; i < byteString.length; i += 1) {
    IntArr[i] = byteString.charCodeAt(i);
  }

  return new Blob([Buffer], { type: mimeType });
};

export default b64toBlob;
