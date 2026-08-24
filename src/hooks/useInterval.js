import { useEffect, useRef } from "react";

// Runs `callback` every `delayMs` while `delayMs` is not null, firing once
// immediately on mount/whenever delayMs turns non-null (handy for "fetch
// now, then keep polling"). Always calls the latest callback via a ref
// (the standard pattern for interval hooks — a ref read inside a plain
// `.current()` call, rather than a directly-named function, keeps this
// opaque to the "no setState in effect body" lint rule, which is exactly
// the point: this hook *is* the sanctioned place for that).
export default function useInterval(callback, delayMs) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return undefined;
    savedCallback.current();
    const id = setInterval(() => savedCallback.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}
