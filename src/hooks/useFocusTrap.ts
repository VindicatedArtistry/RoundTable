import { useEffect, RefObject } from 'react';

/**
 * Custom hook that traps focus within a container element.
 * Ensures keyboard navigation cycles through focusable elements within the container.
 * 
 * @param containerRef - Reference to the container element
 * @param isActive - Whether the focus trap is active
 * @param options - Additional options for focus trap behavior
 */
export function useFocusTrap(
	containerRef: RefObject<HTMLElement>,
	isActive: boolean = true,
	options: {
		initialFocus?: RefObject<HTMLElement>;
		returnFocus?: boolean;
		escapeDeactivates?: boolean;
		onDeactivate?: () => void;
	} = {}
) {
	const {
		initialFocus,
		returnFocus = true,
		escapeDeactivates = true,
		onDeactivate
	} = options;

	useEffect(() => {
		if (!isActive || !containerRef.current) return;

		const container = containerRef.current;
		const previouslyFocusedElement = document.activeElement as HTMLElement;

		// Get all focusable elements within the container
		const getFocusableElements = (): HTMLElement[] => {
			const focusableSelectors = [
				'a[href]:not([disabled])',
				'button:not([disabled])',
				'textarea:not([disabled])',
				'input:not([disabled])',
				'select:not([disabled])',
				'[tabindex]:not([tabindex="-1"]):not([disabled])',
				'[contenteditable]:not([disabled])'
			].join(', ');

			return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
				.filter(el => {
					// Filter out elements that are not visible
					const style = window.getComputedStyle(el);
					return style.display !== 'none' &&
						style.visibility !== 'hidden' &&
						style.opacity !== '0';
				});
		};

		// Set initial focus
		const setInitialFocus = () => {
			const focusableElements = getFocusableElements();

			if (initialFocus?.current) {
				initialFocus.current.focus();
			} else if (focusableElements.length > 0) {
				focusableElements[0].focus();
			} else {
				container.focus();
			}
		};

		// Handle tab key navigation
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && escapeDeactivates) {
				onDeactivate?.();
				return;
			}

			if (event.key !== 'Tab') return;

			const focusableElements = getFocusableElements();
			if (focusableElements.length === 0) return;

			const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
			const lastIndex = focusableElements.length - 1;

			if (event.shiftKey) {
				// Shift + Tab (backwards)
				if (currentIndex <= 0) {
					event.preventDefault();
					focusableElements[lastIndex].focus();
				}
			} else {
				// Tab (forwards)
				if (currentIndex === lastIndex || currentIndex === -1) {
					event.preventDefault();
					focusableElements[0].focus();
				}
			}
		};

		// Handle clicks outside the container
		const handleClickOutside = (event: MouseEvent) => {
			if (!container.contains(event.target as Node)) {
				event.preventDefault();
				event.stopPropagation();
				setInitialFocus();
			}
		};

		// Set up event listeners
		container.addEventListener('keydown', handleKeyDown);
		document.addEventListener('click', handleClickOutside, true);

		// Set initial focus
		setInitialFocus();

		// Make container focusable if it isn't already
		if (!container.hasAttribute('tabindex')) {
			container.setAttribute('tabindex', '-1');
		}

		// Cleanup
		return () => {
			container.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('click', handleClickOutside, true);

			// Return focus to previously focused element
			if (returnFocus && previouslyFocusedElement) {
				previouslyFocusedElement.focus();
			}
		};
	}, [isActive, containerRef, initialFocus, returnFocus, escapeDeactivates, onDeactivate]);
}
