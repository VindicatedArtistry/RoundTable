import { useEffect, useRef, useCallback } from 'react';

type KeyboardShortcut = string;
type ShortcutHandler = (event: KeyboardEvent) => void;
type ShortcutMap = Record<KeyboardShortcut, ShortcutHandler>;

interface UseKeyboardShortcutsOptions {
	enableOnInputs?: boolean;
	preventDefault?: boolean;
	stopPropagation?: boolean;
}

/**
 * Normalizes keyboard shortcut strings for consistent handling.
 * Converts variations like 'cmd+k', 'ctrl+k', 'command+k' to a standard format.
 */
function normalizeShortcut(shortcut: string): string {
	return shortcut
		.toLowerCase()
		.replace(/\s+/g, '')
		.replace(/command/g, 'cmd')
		.replace(/control/g, 'ctrl')
		.replace(/option/g, 'alt')
		.replace(/delete/g, 'del')
		.split('+')
		.sort()
		.join('+');
}

/**
 * Checks if the current platform is macOS.
 */
function isMac(): boolean {
	return typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

/**
 * Converts a keyboard event to a normalized shortcut string.
 */
function eventToShortcut(event: KeyboardEvent): string {
	const parts: string[] = [];

	if (event.metaKey || (event.ctrlKey && !isMac())) parts.push('cmd');
	if (event.ctrlKey && isMac()) parts.push('ctrl');
	if (event.altKey) parts.push('alt');
	if (event.shiftKey) parts.push('shift');

	// Handle special keys
	const key = event.key.toLowerCase();
	if (key === ' ') {
		parts.push('space');
	} else if (key === 'escape') {
		parts.push('esc');
	} else if (key === 'arrowup') {
		parts.push('up');
	} else if (key === 'arrowdown') {
		parts.push('down');
	} else if (key === 'arrowleft') {
		parts.push('left');
	} else if (key === 'arrowright') {
		parts.push('right');
	} else if (key === 'enter') {
		parts.push('enter');
	} else if (key === 'backspace') {
		parts.push('backspace');
	} else if (key === 'delete') {
		parts.push('del');
	} else if (key === 'tab') {
		parts.push('tab');
	} else if (key.length === 1) {
		parts.push(key);
	}

	return parts.sort().join('+');
}

/**
 * Custom hook for managing keyboard shortcuts.
 * 
 * @param shortcuts - Object mapping shortcut strings to handler functions
 * @param options - Configuration options
 * 
 * @example
 * useKeyboardShortcuts({
 *   'cmd+k': () => openSearch(),
 *   'cmd+shift+p': () => openCommandPalette(),
 *   'esc': () => closeModal()
 * });
 */
export function useKeyboardShortcuts(
	shortcuts: ShortcutMap,
	options: UseKeyboardShortcutsOptions = {}
) {
	const {
		enableOnInputs = false,
		preventDefault = true,
		stopPropagation = false
	} = options;

	// Store shortcuts in a ref to avoid recreating the event handler
	const shortcutsRef = useRef<Map<string, ShortcutHandler>>(new Map());

	// Update shortcuts map when shortcuts change
	useEffect(() => {
		const normalizedShortcuts = new Map<string, ShortcutHandler>();

		Object.entries(shortcuts).forEach(([shortcut, handler]) => {
			const normalized = normalizeShortcut(shortcut);
			normalizedShortcuts.set(normalized, handler);
		});

		shortcutsRef.current = normalizedShortcuts;
	}, [shortcuts]);

	// Handle keyboard events
	const handleKeyDown = useCallback((event: KeyboardEvent) => {
		// Skip if target is an input element (unless enabled)
		if (!enableOnInputs) {
			const target = event.target as HTMLElement;
			const tagName = target.tagName.toLowerCase();

			if (
				tagName === 'input' ||
				tagName === 'textarea' ||
				tagName === 'select' ||
				target.contentEditable === 'true'
			) {
				return;
			}
		}

		const shortcut = eventToShortcut(event);
		const handler = shortcutsRef.current.get(shortcut);

		if (handler) {
			if (preventDefault) event.preventDefault();
			if (stopPropagation) event.stopPropagation();
			handler(event);
		}
	}, [enableOnInputs, preventDefault, stopPropagation]);

	// Add event listener
	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleKeyDown]);
}

/**
 * Hook for managing a single keyboard shortcut.
 * 
 * @example
 * useKeyboardShortcut('cmd+k', () => openSearch());
 */
export function useKeyboardShortcut(
	shortcut: string,
	handler: ShortcutHandler,
	options?: UseKeyboardShortcutsOptions
) {
	useKeyboardShortcuts({ [shortcut]: handler }, options);
}

/**
 * Returns a formatted string for displaying keyboard shortcuts.
 * Handles platform differences (e.g., ⌘ on Mac, Ctrl on Windows).
 */
export function formatShortcut(shortcut: string): string {
	const parts = normalizeShortcut(shortcut).split('+');
	const formatted = parts.map(part => {
		if (part === 'cmd') {
			return isMac() ? '⌘' : 'Ctrl';
		}
		if (part === 'alt') {
			return isMac() ? '⌥' : 'Alt';
		}
		if (part === 'shift') {
			return isMac() ? '⇧' : 'Shift';
		}
		if (part === 'ctrl') {
			return isMac() ? '⌃' : 'Ctrl';
		}
		if (part === 'enter') {
			return isMac() ? '⏎' : 'Enter';
		}
		if (part === 'del') {
			return isMac() ? '⌫' : 'Del';
		}
		if (part === 'esc') {
			return 'Esc';
		}
		if (part === 'space') {
			return 'Space';
		}
		if (part === 'tab') {
			return isMac() ? '⇥' : 'Tab';
		}
		if (part === 'up') {
			return '↑';
		}
		if (part === 'down') {
			return '↓';
		}
		if (part === 'left') {
			return '←';
		}
		if (part === 'right') {
			return '→';
		}

		return part.toUpperCase();
	});

	return formatted.join(isMac() ? '' : '+');
}
