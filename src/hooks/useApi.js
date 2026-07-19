import { useCallback, useEffect, useRef, useState } from 'react';

export default function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, page: null, loading: true, error: null });
  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetcherRef.current();
      const envelope = res || {};
      if (mounted.current) {
        setState({
          data: envelope.data !== undefined ? envelope.data : envelope,
          meta: envelope.meta || null,
          page: envelope.page || null,
          loading: false,
          error: null,
        });
      }
    } catch (err) {
      if (mounted.current) setState({ data: null, meta: null, page: null, loading: false, error: err });
    }
  }, deps);

  useEffect(() => {
    mounted.current = true;
    run();
    return () => { mounted.current = false; };
  }, [run]);

  return { ...state, reload: run };
}
