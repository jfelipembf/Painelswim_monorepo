const removeUndefinedDeep = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map((v) => removeUndefinedDeep(v));
  }

  if (value && typeof value === "object") {
    const result: Record<string, any> = {};
    Object.entries(value).forEach(([key, val]) => {
      if (val === undefined) return;
      result[key] = removeUndefinedDeep(val);
    });
    return result;
  }

  return value;
};

export { removeUndefinedDeep };
