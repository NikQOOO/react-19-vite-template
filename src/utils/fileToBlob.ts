export default function (payload: unknown) {
  const file = payload as File & { originFileObj: File };
  return new Blob([file.originFileObj], { type: file.type });
}
