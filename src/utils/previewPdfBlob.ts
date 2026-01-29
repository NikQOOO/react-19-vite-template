/**
 * res: Blob对象

 */
const previewPdfBlob = (res: Blob) => {
  const file = new Blob([res], { type: 'application/pdf' });
  const fileURL = URL.createObjectURL(file);
  window.open(fileURL);

  setTimeout(() => {
    // For Firefox it is necessary to delay revoking the ObjectURL
    window.URL.revokeObjectURL(fileURL);
  }, 100);
};

export default previewPdfBlob;
