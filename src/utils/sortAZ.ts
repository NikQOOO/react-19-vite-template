const sortAZ = (a?: string, b?: string): number => {
  if (!a || !b) {
    if (!a && b) {
      return -1;
    }
    if (a && !b) {
      return 1;
    }
    return 0;
  }

  if (a < b) {
    return -1;
  }

  if (a > b) {
    return 1;
  }

  return 0;
};

export default sortAZ;
