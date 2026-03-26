import { useState, useEffect } from 'react';

/**
 * Custom hook that tracks if a media query matches the current viewport.
 * Updates automatically when the viewport changes.
 * 
 * @param query - The media query string to match
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
	// Initialize with undefined to trigger proper hydration in SSR
	const [matches, setMatches] = useState<boolean>(() => {
		// Avoid hydration mismatch by checking if window is defined
		if (typeof window !== 'undefined') {
			return window.matchMedia(query).matches;
		}
		return false;
	});

	useEffect(() => {
		// Create media query list
		const mediaQuery = window.matchMedia(query);

		// Update state with current value
		setMatches(mediaQuery.matches);

		// Define event handler
		const handleChange = (event: MediaQueryListEvent) => {
			setMatches(event.matches);
		};

		// Add event listener
		// Use addEventListener for better browser compatibility
		if (mediaQuery.addEventListener) {
			mediaQuery.addEventListener('change', handleChange);
		} else {
			// Fallback for older browsers
			mediaQuery.addListener(handleChange);
		}

		// Cleanup
		return () => {
			if (mediaQuery.removeEventListener) {
				mediaQuery.removeEventListener('change', handleChange);
			} else {
				// Fallback for older browsers
				mediaQuery.removeListener(handleChange);
			}
		};
	}, [query]);

	return matches;
}

// Preset media queries for common breakpoints
export const mediaQueries = {
	mobile: '(max-width: 640px)',
	tablet: '(min-width: 641px) and (max-width: 1024px)',
	desktop: '(min-width: 1025px)',
	fold: '(max-width: 523px)', // Pixel 9 Pro Fold folded
	unfold: '(min-width: 524px) and (max-width: 945px)', // Pixel 9 Pro Fold unfolded
	prefersReducedMotion: '(prefers-reduced-motion: reduce)',
	prefersDark: '(prefers-color-scheme: dark)',
	prefersLight: '(prefers-color-scheme: light)',
	landscape: '(orientation: landscape)',
	portrait: '(orientation: portrait)',
	retina: '(min-resolution: 2dppx)'
} as const;
