import { onMount, createSignal, createEffect } from "solid-js";

export function createDebouncedAsync<T, V>(
  initialValue: T,
  fn: (params: V) => Promise<T>,
  getParams: () => V,
  opts?: { delay?: number }
) {
  let timeoutId: number | undefined;
  const [isWaiting, setIsWaiting] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);
  const [getData, setData] = createSignal<T>(initialValue);
  const [cache, setCache] = createSignal<Map<string, T>>(new Map());

  // Helper function to get data from cache or call the async function
  function getOrFetch(params: V): Promise<T> {
    const key = JSON.stringify(params);
    const cached = cache().get(key);
    if (cached) {
      return Promise.resolve(cached);
    }
    return fn(params).then((result) => {
      const newCache = new Map(cache());
      newCache.set(key, result);
      
      // Keep only the 10 most recent entries
      if (newCache.size > 10) {
        const firstKey = newCache.keys().next().value;
        if (firstKey) newCache.delete(firstKey);
      }
      
      setCache(newCache);
      return result;
    });
  }

  // On initial mount, call the function with initial params
  onMount(() => {
    const params = getParams();
    // console.log("Mount with params:", params);
    getOrFetch(params).then(setData);
  });

  // Update data when params change, but debounce the call to fn
  createEffect(() => {
    const params = getParams();
    setIsWaiting(true);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      setIsWaiting(false);
      setIsLoading(true);
      // console.log("Calling function with params:", params);
      getOrFetch(params).then((result) => {
        setData(() => result);
        setIsLoading(false);
      });
      timeoutId = undefined;
    }, opts?.delay ?? 300);
  });

  return [getData, {
    isWaiting,
    isLoading,
  }] as const;
}
