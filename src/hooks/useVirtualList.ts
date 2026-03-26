import { useState, useCallback, useEffect, useRef } from 'react';

interface UseVirtualListOptions<T> {
	items: T[];
	itemHeight: number;
	containerHeight: number;
	overscan?: number;
	enabled?: boolean;
}

interface UseVirtualListReturn<T> {
	visibleItems: T[];
	totalHeight: number;
	offsetY: number;
	handleScroll: (event: React.UIEvent<HTMLElement>) => void;
	scrollToIndex: (index: number) => void;
	scrollToTop: () => void;
}

/**
 * Custom hook for implementing virtual scrolling.
 * Only renders visible items to improve performance with large lists.
 */
export function useVirtualList<T extends { id: string }>(
	options: UseVirtualListOptions<T>
): UseVirtualListReturn<T> {
	const {
		items,
		itemHeight,
		containerHeight,
		overscan = 3,
		enabled = true
	} = options;

	const [scrollTop, setScrollTop] = useState(0);
	const scrollElementRef = useRef<HTMLElement | null>(null);

	// Calculate which items are visible
	const startIndex = enabled
		? Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
		: 0;

	const endIndex = enabled
		? Math.min(
			items.length - 1,
			Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
		)
		: items.length - 1;

	const visibleItems = enabled
		? items.slice(startIndex, endIndex + 1)
		: items;

	const totalHeight = items.length * itemHeight;
	const offsetY = startIndex * itemHeight;

	// Handle scroll events
	const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
		if (!enabled) return;

		const element = event.currentTarget;
		scrollElementRef.current = element;
		setScrollTop(element.scrollTop);
	}, [enabled]);

	// Scroll to specific index
	const scrollToIndex = useCallback((index: number) => {
		if (!scrollElementRef.current || !enabled) return;

		const targetScrollTop = index * itemHeight;
		scrollElementRef.current.scrollTop = targetScrollTop;
		setScrollTop(targetScrollTop);
	}, [itemHeight, enabled]);

	// Scroll to top
	const scrollToTop = useCallback(() => {
		if (!scrollElementRef.current) return;

		scrollElementRef.current.scrollTop = 0;
		setScrollTop(0);
	}, []);

	// Update scroll position when items change
	useEffect(() => {
		if (!enabled) return;

		// Ensure scroll position is valid after items change
		if (scrollTop > totalHeight - containerHeight) {
			const newScrollTop = Math.max(0, totalHeight - containerHeight);
			if (scrollElementRef.current) {
				scrollElementRef.current.scrollTop = newScrollTop;
			}
			setScrollTop(newScrollTop);
		}
	}, [items.length, totalHeight, containerHeight, scrollTop, enabled]);

	return {
		visibleItems,
		totalHeight,
		offsetY,
		handleScroll,
		scrollToIndex,
		scrollToTop
	};
}

/**
 * Hook for dynamic item heights in virtual lists.
 * Useful when notification items have variable heights.
 */
export function useVirtualListDynamic<T extends { id: string }>(
	items: T[],
	estimatedItemHeight: number,
	containerHeight: number,
	enabled: boolean = true
) {
	const [itemHeights, setItemHeights] = useState<Map<string, number>>(new Map());
	const [scrollTop, setScrollTop] = useState(0);

	// Calculate positions based on measured heights
	const positions = useRef<Map<string, { top: number; height: number }>>(new Map());

	const calculatePositions = useCallback(() => {
		let top = 0;
		const newPositions = new Map<string, { top: number; height: number }>();

		items.forEach(item => {
			const height = itemHeights.get(item.id) || estimatedItemHeight;
			newPositions.set(item.id, { top, height });
			top += height;
		});

		positions.current = newPositions;
	}, [items, itemHeights, estimatedItemHeight]);

	// Recalculate when heights change
	useEffect(() => {
		calculatePositions();
	}, [calculatePositions]);

	// Measure item height
	const measureItem = useCallback((id: string, element: HTMLElement | null) => {
		if (!element || !enabled) return;

		const height = element.getBoundingClientRect().height;
		setItemHeights(prev => {
			const newHeights = new Map(prev);
			if (newHeights.get(id) !== height) {
				newHeights.set(id, height);
				return newHeights;
			}
			return prev;
		});
	}, [enabled]);

	// Calculate visible items
	const visibleItems = enabled ? items.filter(item => {
		const position = positions.current.get(item.id);
		if (!position) return false;

		const { top, height } = position;
		const bottom = top + height;

		return bottom >= scrollTop && top <= scrollTop + containerHeight;
	}) : items;

	const totalHeight = Array.from(positions.current.values())
		.reduce((sum, pos) => sum + pos.height, 0);

	return {
		visibleItems,
		totalHeight,
		measureItem,
		handleScroll: (event: React.UIEvent<HTMLElement>) => {
			if (enabled) {
				setScrollTop(event.currentTarget.scrollTop);
			}
		},
		getItemStyle: (id: string) => {
			const position = positions.current.get(id);
			if (!position || !enabled) return {};

			return {
				position: 'absolute' as const,
				top: position.top,
				height: position.height
			};
		}
	};
}
