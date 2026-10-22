import { useCallback, useState } from "react";

// Tracks whether a page's main request is loading or failed.
// Wrap the request promise: `track(api.get(...).then(...))`.
export function useLoadState() {
  const [state, setState] = useState({ loading: true, error: false });

  const track = useCallback((promise) => {
    setState((s) => ({ loading: s.loading, error: false }));
    return promise
      .then(() => setState({ loading: false, error: false }))
      .catch(() => setState({ loading: false, error: true }));
  }, []);

  return [state, track];
}
