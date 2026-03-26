import { useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook that returns a throttled version of the provided callback function.
 * The throttled function will only execute at most once per specified delay period.
 * 
 * @param callback - The function to throttle
 * @param delay - The minimum delay between function calls in milliseconds
 * @returns A throttled version of the callback
 */
export function useThrottle<T extends (...args: any[]) => any>(
	callback: T,
	delay: number
): (...args: Parameters<T>) => void {
	const lastRunRef = useRef<number>(0);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const callbackRef = useRef(callback);

	// Update callback ref on each render to avoid stale closures
	callbackRef.current = callback;

	const throttledCallback = useCallback(
		(...args: Parameters<T>) => {
			const now = Date.now();
			const timeSinceLastRun = now - lastRunRef.current;

			const executeCallback = () => {
				lastRunRef.current = Date.now();
				callbackRef.current(...args);
			};

			if (timeSinceLastRun >= delay) {
				// If enough time has passed, execute immediately
				executeCallback();
			} else {
				// Otherwise, schedule execution for the remaining delay
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}

				const remainingDelay = delay - timeSinceLastRun;
				timeoutRef.current = setTimeout(executeCallback, remainingDelay);
			}
		},
		[delay]
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return throttledCallback;
}

/**
 * Custom hook for throttling a value update.
 * Useful for throttling state updates from rapid events.
 * 
 * @param value - The value to throttle
 * @param delay - The throttle delay in milliseconds
 * @returns The throttled value
 */
export function useThrottledValue<T>(value: T, delay: number): T {
	const [throttledValue, setThrottledValue] = useState<T>(value);
	const lastUpdateRef = useRef<number>(0);
	const timeoutRef2 = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const now = Date.now();
		const timeSinceLastUpdate = now - lastUpdateRef.current;

		if (timeSinceLastUpdate >= delay) {
			// Update immediately if enough time has passed
			lastUpdateRef.current = now;
			setThrottledValue(value);
		} else {
			// Schedule update for later
			if (timeoutRef2.current) {
				clearTimeout(timeoutRef2.current);
			}

			const remainingDelay = delay - timeSinceLastUpdate;
			timeoutRef2.current = setTimeout(() => {
				lastUpdateRef.current = Date.now();
				setThrottledValue(value);
			}, remainingDelay);
		}

		return () => {
			if (timeoutRef2.current) {
				clearTimeout(timeoutRef2.current);
			}
		};
	}, [value, delay]);

	return throttledValue;
}

import { useState } from 'react';
