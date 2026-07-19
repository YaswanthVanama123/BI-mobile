import DocumentPicker, { types } from 'react-native-document-picker';

export async function pickCsvFile() {
  try {
    const res = await DocumentPicker.pickSingle({
      type: [types.csv, types.plainText, 'text/comma-separated-values', 'application/vnd.ms-excel'],
      copyTo: 'cachesDirectory',
    });
    return {
      uri: res.fileCopyUri || res.uri,
      name: res.name || 'payroll.csv',
      type: res.type || 'text/csv',
      size: res.size,
    };
  } catch (err) {
    if (DocumentPicker.isCancel(err)) return null;
    throw err;
  }
}
