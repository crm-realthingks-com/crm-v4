export const getExportFilename = (moduleName: string, type: 'all' | 'selected' | 'filtered'): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${moduleName}_${type}_${timestamp}.csv`;
};