import { useEffect, useState } from 'react';
import { getExportFormat, loadExportFormat, subscribeExportFormat } from '@/utils/appSettings';

export default function useExportFormat() {
  const [fmt, setFmt] = useState(getExportFormat());
  useEffect(() => {
    loadExportFormat();
    return subscribeExportFormat(setFmt);
  }, []);
  return fmt;
}
