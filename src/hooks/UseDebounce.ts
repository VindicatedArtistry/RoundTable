import { useCallback, useRef } from 'react';

/**
 * Custom hook that returns a debounced version of the provided callback function.
 * The debounced function delays invoking the callback until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param callback - The function to debounce
 * @param delay - The number of milliseconds to delay
 * @returns A debounced version of the callback
 */
export function useDebounce<T extends (...args: any[]) => any>(
	callback: T,
	delay: number
): (...args: Parameters<T>) => void {
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const callbackRef = useRef(callback);

	// Update callback ref on each render to avoid stale closures
	callbackRef.current = callback;

	const debouncedCallback = useCallback(
		(...args: Parameters<T>) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				callbackRef.current(...args);
			}, delay);
		},
		[delay]
	);

	// Cleanup on unmount
	useCallback(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return debouncedCallback;
}