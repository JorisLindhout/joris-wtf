<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import Tile from './Tile.svelte';
	import type { Project } from '../lib/types';
	import {
		computeLayout,
		initialCamera,
		projectIndexForCell,
		visibleCells,
		type Layout,
	} from '../lib/world';

	let { projects }: { projects: Project[] } = $props();

	let root: HTMLElement | undefined = $state();
	let width = $state(0);
	let height = $state(0);
	let panX = $state(0);
	let panY = $state(0);
	let focusX = $state(0);
	let focusY = $state(0);
	let dragging = $state(false);

	const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');

	const layout = $derived(
		width > 0 && projects.length > 0 ? computeLayout(width, projects.length) : null,
	);
	const origin = $derived(layout ? initialCamera(layout) : { x: 0, y: 0 });
	const camX = $derived(origin.x + panX);
	const camY = $derived(origin.y + panY);
	const cells = $derived(layout ? visibleCells(camX, camY, width, height, layout, 1) : []);

	onMount(() => {
		const apply = () => {
			width = window.innerWidth;
			height = window.innerHeight;
		};
		apply();
		window.addEventListener('resize', apply);
		return () => window.removeEventListener('resize', apply);
	});

	function projectAt(x: number, y: number, current: Layout): Project {
		const index = projectIndexForCell(x, y, current.cols, current.rows, projects.length);
		return projects[index] ?? projects[0];
	}

	function setCamera(x: number, y: number) {
		panX = x - origin.x;
		panY = y - origin.y;
	}

	function ensureVisible(x: number, y: number, current: Layout) {
		let nextX = camX;
		let nextY = camY;
		const left = x * current.cellW;
		const top = y * current.cellH;
		const right = left + current.tileW;
		const bottom = top + current.tileH;
		if (left < nextX) nextX = left - current.gap;
		if (top < nextY) nextY = top - current.gap;
		if (right > nextX + width) nextX = right - width + current.gap;
		if (bottom > nextY + height) nextY = bottom - height + current.gap;
		setCamera(nextX, nextY);
	}

	async function moveFocus(dx: number, dy: number) {
		if (!layout) return;
		focusX += dx;
		focusY += dy;
		ensureVisible(focusX, focusY, layout);
		await tick();
		const el = root?.querySelector<HTMLElement>(`[data-cell="${focusX},${focusY}"]`);
		el?.focus({ preventScroll: true });
	}

	function onKeydown(event: KeyboardEvent) {
		if (!layout) return;
		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				void moveFocus(-1, 0);
				break;
			case 'ArrowRight':
				event.preventDefault();
				void moveFocus(1, 0);
				break;
			case 'ArrowUp':
				event.preventDefault();
				void moveFocus(0, -1);
				break;
			case 'ArrowDown':
				event.preventDefault();
				void moveFocus(0, 1);
				break;
		}
	}

	function onFocusIn(event: FocusEvent) {
		const target = event.target;
		if (!(target instanceof Element)) return;
		const cell = target.closest('[data-cell]');
		if (!cell) return;
		const [x, y] = (cell.getAttribute('data-cell') ?? '0,0').split(',').map(Number);
		focusX = x;
		focusY = y;
	}

	function fieldSurface(node: HTMLElement) {
		root = node;
		document.documentElement.dataset.field = 'ready';
		const list = document.getElementById('projects');
		list?.setAttribute('aria-hidden', 'true');

		let pointerId: number | null = null;
		let lastX = 0;
		let lastY = 0;
		let lastT = 0;
		let vx = 0;
		let vy = 0;
		let moved = false;
		let inertiaId = 0;

		const stopInertia = () => {
			if (inertiaId) cancelAnimationFrame(inertiaId);
			inertiaId = 0;
		};

		const onPointerDown = (event: PointerEvent) => {
			if (event.button !== 0) return;
			stopInertia();
			pointerId = event.pointerId;
			lastX = event.clientX;
			lastY = event.clientY;
			lastT = event.timeStamp;
			vx = 0;
			vy = 0;
			moved = false;
			dragging = true;
			node.setPointerCapture(event.pointerId);
		};

		const onPointerMove = (event: PointerEvent) => {
			if (pointerId !== event.pointerId) return;
			const dx = event.clientX - lastX;
			const dy = event.clientY - lastY;
			if (Math.hypot(dx, dy) > 2) moved = true;
			const dt = Math.max(8, event.timeStamp - lastT);
			vx = (dx / dt) * 16;
			vy = (dy / dt) * 16;
			panX -= dx;
			panY -= dy;
			lastX = event.clientX;
			lastY = event.clientY;
			lastT = event.timeStamp;
		};

		const startInertia = () => {
			if (reducedMotion.current) return;
			const step = () => {
				vx *= 0.92;
				vy *= 0.92;
				panX -= vx;
				panY -= vy;
				if (Math.hypot(vx, vy) > 0.18) {
					inertiaId = requestAnimationFrame(step);
				} else {
					inertiaId = 0;
				}
			};
			inertiaId = requestAnimationFrame(step);
		};

		const onPointerUp = (event: PointerEvent) => {
			if (pointerId !== event.pointerId) return;
			pointerId = null;
			dragging = false;
			if (moved) startInertia();
		};

		const onWheel = (event: WheelEvent) => {
			event.preventDefault();
			stopInertia();
			panX += event.deltaX;
			panY += event.deltaY;
		};

		const onClick = (event: MouseEvent) => {
			if (!moved) return;
			event.preventDefault();
			event.stopPropagation();
		};

		const onNodeKeydown = (event: KeyboardEvent) => {
			if (!node.contains(event.target as Node | null)) return;
			onKeydown(event);
		};

		node.addEventListener('pointerdown', onPointerDown);
		node.addEventListener('pointermove', onPointerMove);
		node.addEventListener('pointerup', onPointerUp);
		node.addEventListener('pointercancel', onPointerUp);
		node.addEventListener('wheel', onWheel, { passive: false });
		node.addEventListener('click', onClick, true);
		node.addEventListener('keydown', onNodeKeydown);
		node.addEventListener('focusin', onFocusIn);

		return () => {
			stopInertia();
			root = undefined;
			delete document.documentElement.dataset.field;
			list?.removeAttribute('aria-hidden');
			node.removeEventListener('pointerdown', onPointerDown);
			node.removeEventListener('pointermove', onPointerMove);
			node.removeEventListener('pointerup', onPointerUp);
			node.removeEventListener('pointercancel', onPointerUp);
			node.removeEventListener('wheel', onWheel);
			node.removeEventListener('click', onClick, true);
			node.removeEventListener('keydown', onNodeKeydown);
			node.removeEventListener('focusin', onFocusIn);
		};
	}
</script>

<div
	class="field"
	class:dragging
	role="region"
	aria-label="Pannable project field"
	bind:clientWidth={width}
	bind:clientHeight={height}
	{@attach fieldSurface}
>
	{#if layout}
		<div class="world" style:transform="translate3d({-camX}px, {-camY}px, 0)">
			{#each cells as cell (`${cell.x}:${cell.y}`)}
				<div
					class="cell"
					style:transform="translate3d({cell.x * layout.cellW}px, {cell.y * layout.cellH}px, 0)"
				>
					<Tile
						project={projectAt(cell.x, cell.y, layout)}
						cellX={cell.x}
						cellY={cell.y}
						width={layout.tileW}
						height={layout.tileH}
						tabIndex={cell.x === focusX && cell.y === focusY ? 0 : -1}
						loading={cell.x >= 0 &&
						cell.y >= 0 &&
						cell.x < layout.cols &&
						cell.y < layout.rows
							? 'eager'
							: 'lazy'}
					/>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.field {
		position: fixed;
		inset: 0;
		z-index: 1;
		overflow: hidden;
		touch-action: none;
		cursor: grab;
		background: var(--bg);
	}

	.field.dragging {
		cursor: grabbing;
	}

	.world {
		position: absolute;
		inset: 0;
		will-change: transform;
	}

	.cell {
		position: absolute;
		left: 0;
		top: 0;
		will-change: transform;
	}
</style>
