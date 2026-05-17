import { useEffect, type DependencyList } from "react";

/**
 * Run an effect after the dependencies have stayed unchanged for `delay` ms.
 * The cleanup returned by `effect` runs both when deps change and on unmount.
 */
export function useDebouncedEffect(
  effect: () => void | (() => void),
  delay: number,
  deps: DependencyList,
): void {
  useEffect(() => {
    let cleanup: void | (() => void);
    const timer = setTimeout(() => {
      cleanup = effect();
    }, delay);

    return () => {
      clearTimeout(timer);
      if (typeof cleanup === "function") cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
