import { useState, useEffect } from 'react';

/**
 * Custom hook that returns a debounced value.
 * The returned value only updates after the specified delay has passed
 * without the input value changing.
 *
 * @param value - The value to debounce
 * @param delay - The number of milliseconds to delay (default: 300)
 * @returns The debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);

	return debouncedValue;
}
