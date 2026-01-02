export const omitUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  const result: Partial<T> = {};

  Object.keys(obj).forEach((key) => {
    const typedKey = key as keyof T;
    const value = obj[typedKey];
    if (value !== undefined) {
      result[typedKey] = value;
    }
  });

  return result;
};
