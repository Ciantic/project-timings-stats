
export function debounce<T>(fn: (arg: T) => void, delay: number): (arg: T) => void {
    let timeoutId: number | undefined;
    return (arg: T) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn(arg);
            timeoutId = undefined;
        }, delay);
    };
}
