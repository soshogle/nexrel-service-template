/**
 * Patched version of @radix-ui/react-compose-refs that fixes the React 19
 * infinite re-render loop (radix-ui/primitives#3799).
 *
 * React 19 re-invokes ref callbacks whenever the callback identity changes.
 * The original useComposedRefs passes `refs` (a new array every render) as
 * the useCallback deps, so the composed callback is never stable, which
 * causes setRef → re-render → new callback → setRef → ∞.
 *
 * Fix: use useRef to store the latest refs and return a single stable callback.
 */
import { useRef, useCallback } from "react";

type PossibleRef<T> = React.Ref<T> | undefined;

function setRef<T>(ref: PossibleRef<T>, value: T) {
  if (typeof ref === "function") {
    return ref(value);
  } else if (ref !== null && ref !== undefined) {
    (ref as React.MutableRefObject<T>).current = value;
  }
}

function composeRefs<T>(...refs: PossibleRef<T>[]) {
  return (node: T) => {
    let hasCleanup = false;
    const cleanups = refs.map((ref) => {
      const cleanup = setRef(ref, node);
      if (!hasCleanup && typeof cleanup === "function") {
        hasCleanup = true;
      }
      return cleanup;
    });
    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i];
          if (typeof cleanup === "function") {
            (cleanup as () => void)();
          } else {
            setRef(refs[i], null as unknown as T);
          }
        }
      };
    }
  };
}

function useComposedRefs<T>(...refs: PossibleRef<T>[]) {
  const refsRef = useRef(refs);
  refsRef.current = refs;
  return useCallback(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (node: T) => composeRefs(...refsRef.current)(node),
    []
  );
}

export { composeRefs, useComposedRefs };
