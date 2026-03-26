import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing state persistence in localStorage
 * with SSR safety and automatic JSON serialization.
 * 
 * @param key - The localStorage key
 * @param defaultValue - The default value if no stored value exists
 * @returns A stateful value and a setter function
 */
export function useLocalStorage<T>(
	key: string,
	defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
	// Initialize state with a function to avoid localStorage access during SSR
	const [storedValue, setStoredValue] = useState<T>(() => {
		if (typeof window === 'undefined') {
			return defaultValue;
		}

		try {
			const item = window.localStorage.getItem(key);
			return item ? JSON.parse(item) : defaultValue;
		} catch (error) {
			console.error(`Error reading localStorage key "${key}":`, error);
			return defaultValue;
		}
	});

	// Update localStorage when state changes
	const setValue = useCallback((value: T | ((prev: T) => T)) => {
		try {
			// Allow value to be a function so we have the same API as useState
			const valueToStore = value instanceof Function ? value(storedValue) : value;

			setStoredValue(valueToStore);

			if (typeof window !== 'undefined') {
				window.localStorage.setItem(key, JSON.stringify(valueToStore));

				// Dispatch storage event for cross-tab synchronization
				window.dispatchEvent(new StorageEvent('storage', {
					key,
					newValue: JSON.stringify(valueToStore),
					url: window.location.href,
					storageArea: window.localStorage
				}));
			}
		} catch (error) {
			console.error(`Error saving to localStorage key "${key}":`, error);
		}
	}, [key, storedValue]);

	// Listen for changes in other tabs/windows
	useEffect(() => {
		if (typeof window === 'undefined') return;

		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === key && e.newValue !== null) {
				try {
					setStoredValue(JSON.parse(e.newValue));
				} catch (error) {
					console.error(`Error parsing localStorage change for key "${key}":`, error);
				}
			}
		};

		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, [key]);

	return [storedValue, setValue];
}

// Utility function to clear a specific localStorage key
export function clearLocalStorageItem(key: string): void {
	if (typeof window !== 'undefined') {
		try {
			window.localStorage.removeItem(key);
		} catch (error) {
			console.error(`Error removing localStorage key "${key}":`, error);
		}
	}
}

// Utility function to clear all localStorage items with a specific prefix
export function clearLocalStoragePrefix(prefix: string): void {
	if (typeof window !== 'undefined') {
		try {
			const keys = Object.keys(window.localStorage).filter(key => key.startsWith(prefix));
			keys.forEach(key => window.localStorage.removeItem(key));
		} catch (error) {
			console.error(`Error clearing localStorage prefix "${prefix}":`, error);
		}
	}
}
