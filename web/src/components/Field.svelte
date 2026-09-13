<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { Spring } from 'svelte/motion';
	import { MediaQuery } from 'svelte/reactivity';
	import Tile from './Tile.svelte';
	import type { Project } from '../lib/types';
	import {
		cameraForCenteredCell,
		cellFullyInViewport,
		clearlyCenteredCell,
		computeLayout,
		initialCamera,
		presenceWeightsFor,
		primaryCellForIndex,
		projectIndexForCell,
		TITLE_BLOCK,
		visibleCells,
		type Cell,
		type Layout,
	} from '../lib/world';
	import { replaceProjectPath } from '../lib/urls';

	let { projects, focusSlug }: { projects: Project[]; focusSlug?: string } = $props();

	let root: HTMLElement | undefined;
	let width = $state(0);
	let height = $state(0);
	let panX = $state(0);
	let panY = $state(0);
	let focusX = $state(0);
	let focusY = $state(0);
	let dragging = $state(false);
	let warpX = $state(0);
	let warpY = $state(0);
	let grabX = $state(0);
	let grabY = $state(0);
	let sim = $state(0);

	const PARALLAX = [
		{ name: 'haze', depth: 0.08 },
		{ name: 'far', depth: 0.2 },
		{ name: 'mid', depth: 0.36 },
		{ name: 'near', depth: 0.55 },
	] as const;

	type Particle = { x: number; y: number; vx: number; vy: number; cx: number; cy: number };

	const particles = new Map<string, Particle>();
	let grabbing = false;
	let pointerActive = false;
	let ignoreFocusPan = false;
	let particleId = 0;
	let didLand = false;
	let lastUrlCell: Cell | null = null;
	let settleTimer = 0;
	let throwing = false;
	const SETTLE_MS = 300;

	const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');
	const coarsePointer = new MediaQuery('(pointer: coarse)');
	const TILT_MAX = 7;
	const TILT_GAIN = 0.04;
	const WARP_SOFT = 280;
	const tilt = new Spring({ x: 0, y: 0 }, { stiffness: 0.16, damping: 0.58, precision: 0.02 });

	function soften(n: number, limit: number) {
		return limit * Math.tanh(n / limit);
	}

	function tileFromTarget(target: EventTarget | null) {
		if (!(target instanceof Element)) return null;
		return target.closest('.tile');
	}

	function tiltFromDrag(wx: number, wy: number) {
		return {
			x: soften(-wy * TILT_GAIN, TILT_MAX),
			y: soften(-wx * TILT_GAIN, TILT_MAX),
		};
	}

	const layout = $derived(
		width > 0 && projects.length > 0 ? computeLayout(width, projects.length, TITLE_BLOCK) : null,
	);
	const fieldReady = $derived(layout != null);
	const origin = $derived(
		layout && width > 0 && height > 0 ? initialCamera(layout, width, height) : { x: 0, y: 0 },
	);
	const camX = $derived(origin.x + panX);
	const camY = $derived(origin.y + panY);
	const cells = $derived(layout ? visibleCells(camX, camY, width, height, layout, 1) : []);
	const overflowWeights = $derived(presenceWeightsFor(projects));

	function isTabStop(x: number, y: number, current: Layout) {
		return cellFullyInViewport(x, y, camX, camY, width, height, current);
	}

	onMount(() => {
		const apply = () => {
			width = window.innerWidth;
			height = window.innerHeight;
		};
		apply();
		window.addEventListener('resize', apply);

		let landFrame = 0;
		const tryLand = () => {
			if (didLand || !focusSlug) return;
			if (!layout || width <= 0 || height <= 0) {
				landFrame = requestAnimationFrame(tryLand);
				return;
			}
			const index = projects.findIndex((project) => project.slug === focusSlug);
			if (index < 0) return;
			const cell = primaryCellForIndex(index, layout.cols);
			const cam = cameraForCenteredCell(cell.x, cell.y, layout, width, height);
			didLand = true;
			lastUrlCell = cell;
			focusX = cell.x;
			focusY = cell.y;
			panX = cam.x - origin.x;
			panY = cam.y - origin.y;
			const slug = focusSlug;
			void tick().then(() => {
				const el = root?.querySelector<HTMLElement>(
					`[data-slug="${CSS.escape(slug)}"][data-cell="${cell.x},${cell.y}"] a`,
				);
				el?.focus({ preventScroll: true, focusVisible: true });
			});
		};
		landFrame = requestAnimationFrame(tryLand);

		return () => {
			window.removeEventListener('resize', apply);
			if (landFrame) cancelAnimationFrame(landFrame);
		};
	});

	$effect(() => {
		if (!fieldReady) return;

		document.documentElement.dataset.field = 'ready';
		const list = document.getElementById('projects');
		list?.setAttribute('aria-hidden', 'true');
		if (list instanceof HTMLElement) list.inert = true;

		const skip = document.querySelector('.skip-link');
		const skipHref = skip instanceof HTMLAnchorElement ? skip.href : null;
		const skipLabel = skip instanceof HTMLAnchorElement ? skip.textContent : null;
		if (skip instanceof HTMLAnchorElement) {
			if (skip.dataset.fieldHref) skip.href = skip.dataset.fieldHref;
			if (skip.dataset.fieldLabel) skip.textContent = skip.dataset.fieldLabel;
		}

		return () => {
			delete document.documentElement.dataset.field;
			list?.removeAttribute('aria-hidden');
			if (list instanceof HTMLElement) list.inert = false;
			if (skip instanceof HTMLAnchorElement) {
				if (skipHref !== null) skip.href = skipHref;
				if (skipLabel !== null) skip.textContent = skipLabel;
			}
		};
	});

	function grain(x: number, y: number) {
		const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
		return n - Math.floor(n);
	}

	function tileShift(x: number, y: number) {
		void sim;
		if (!layout) return { x: 0, y: 0 };
		const p = particles.get(`${x}:${y}`);
		return p ? { x: p.x, y: p.y } : { x: 0, y: 0 };
	}

	function stopParticles() {
		if (particleId) cancelAnimationFrame(particleId);
		particleId = 0;
	}

	function clearParticles() {
		particles.clear();
		sim += 1;
	}

	function stepParticles() {
		if (!layout) return false;
		const radius = Math.max(layout.cellW, layout.cellH) * 2.8;
		const grabWX = camX + grabX;
		const grabWY = camY + grabY;
		const visible = new Set<string>();
		for (const cell of cells) {
			const key = `${cell.x}:${cell.y}`;
			visible.add(key);
			if (!particles.has(key)) {
				particles.set(key, { x: 0, y: 0, vx: 0, vy: 0, cx: cell.x, cy: cell.y });
			}
		}

		const wx = soften(warpX, WARP_SOFT);
		const wy = soften(warpY, WARP_SOFT);
		let alive = grabbing;
		for (const [key, p] of particles) {
			const cx = p.cx * layout.cellW + layout.tileW * 0.5;
			const cy = p.cy * layout.cellH + layout.tileH * 0.5;
			const dist = Math.hypot(cx - grabWX, cy - grabWY);
			const proximity = Math.exp(-dist / radius);
			const jitter = 0.55 + grain(p.cx, p.cy) * 0.85;
			const follow = 0.72 + proximity * 0.42;
			const tx = grabbing ? -wx * (follow - 1) : 0;
			const ty = grabbing ? -wy * (follow - 1) : 0;
			const stiff = (0.032 + proximity * 0.13) * jitter;
			const damp = 0.82 + proximity * 0.08;
			p.vx += (tx - p.x) * stiff;
			p.vy += (ty - p.y) * stiff;
			p.vx *= damp;
			p.vy *= damp;
			p.x += p.vx;
			p.y += p.vy;
			const moving = Math.hypot(p.x, p.y) > 0.12 || Math.hypot(p.vx, p.vy) > 0.08;
			if (!moving && !grabbing) {
				if (!visible.has(key)) particles.delete(key);
				else {
					p.x = 0;
					p.y = 0;
					p.vx = 0;
					p.vy = 0;
				}
			} else {
				alive = true;
			}
		}
		sim += 1;
		return alive;
	}

	function kickParticles() {
		if (reducedMotion.current || particleId) return;
		const step = () => {
			particleId = stepParticles() ? requestAnimationFrame(step) : 0;
		};
		particleId = requestAnimationFrame(step);
	}

	function projectAt(x: number, y: number, current: Layout): Project {
		const index = projectIndexForCell(
			x,
			y,
			current.cols,
			current.rows,
			projects.length,
			overflowWeights,
		);
		return projects[index] ?? projects[0];
	}

	function syncUrlFromCell(x: number, y: number, current: Layout) {
		const project = projectAt(x, y, current);
		if (!project) return;
		lastUrlCell = { x, y };
		replaceProjectPath(project.slug);
	}

	function scheduleUrlSettle() {
		if (settleTimer) clearTimeout(settleTimer);
		settleTimer = window.setTimeout(() => {
			settleTimer = 0;
			if (pointerActive || throwing) {
				scheduleUrlSettle();
				return;
			}
			if (!layout) return;
			const cell = clearlyCenteredCell(camX, camY, width, height, layout, lastUrlCell);
			if (!cell) return;
			syncUrlFromCell(cell.x, cell.y, layout);
		}, SETTLE_MS);
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
		const el = root?.querySelector<HTMLElement>(`[data-cell="${focusX},${focusY}"] a`);
		el?.focus({ preventScroll: true });
		syncUrlFromCell(focusX, focusY, layout);
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
		const node = event.currentTarget;
		if (node instanceof HTMLElement) {
			node.scrollTop = 0;
			node.scrollLeft = 0;
		}
		const target = event.target;
		if (!(target instanceof Element)) return;
		const cell = target.closest('[data-cell]');
		if (!cell) {
			if (node instanceof HTMLElement) {
				node.querySelector<HTMLElement>('a[tabindex="0"]')?.focus({ preventScroll: true });
			}
			return;
		}
		const [x, y] = (cell.getAttribute('data-cell') ?? '0,0').split(',').map(Number);
		focusX = x;
		focusY = y;
		if (layout && !pointerActive && !ignoreFocusPan) ensureVisible(x, y, layout);
		if (layout && !pointerActive) syncUrlFromCell(x, y, layout);
	}

	function fieldSurface(node: HTMLElement) {
		return untrack(() => attachField(node));
	}

	function attachField(node: HTMLElement) {
		root = node;

		const skip = document.querySelector('.skip-link');

		const focusFirstTile = () => {
			node.querySelector<HTMLElement>('a[tabindex="0"]')?.focus({ preventScroll: true });
		};

		const onSkipClick = () => {
			requestAnimationFrame(focusFirstTile);
		};
		if (skip instanceof HTMLAnchorElement) skip.addEventListener('click', onSkipClick);

		let pointerId: number | null = null;
		let lastX = 0;
		let lastY = 0;
		let lastT = 0;
		let vx = 0;
		let vy = 0;
		let moved = false;
		let inertiaId = 0;
		let startPanX = 0;
		let startPanY = 0;
		let pressTile: Element | null = null;
		let clickTile: Element | null = null;
		let suppressClickUntil = 0;

		const THROW_SCALE = 19;
		const STOP_SPEED = 0.15;
		const RELEASE_BOOST = 1.05;
		const FINE_SLOP = 5;
		const COARSE_SLOP = 12;
		const CLICK_SUPPRESS_MS = 450;
		let originX = 0;
		let originY = 0;

		const stopInertia = () => {
			if (inertiaId) cancelAnimationFrame(inertiaId);
			inertiaId = 0;
			throwing = false;
		};

		const localPoint = (event: PointerEvent) => {
			const rect = node.getBoundingClientRect();
			return { x: event.clientX - rect.left, y: event.clientY - rect.top };
		};

		const onPointerDown = (event: PointerEvent) => {
			if (event.button !== 0) return;
			stopInertia();
			ignoreFocusPan = false;
			pointerActive = true;
			pointerId = event.pointerId;
			lastX = event.clientX;
			lastY = event.clientY;
			originX = event.clientX;
			originY = event.clientY;
			lastT = event.timeStamp;
			vx = 0;
			vy = 0;
			moved = false;
			pressTile = tileFromTarget(event.target);
			startPanX = panX;
			startPanY = panY;
			const local = localPoint(event);
			grabX = local.x;
			grabY = local.y;
			warpX = 0;
			warpY = 0;
		};

		const capturePointer = (id: number) => {
			try {
				node.setPointerCapture(id);
			} catch {
				// Pointer already released before capture could be set.
			}
		};

		const onPointerMove = (event: PointerEvent) => {
			if (pointerId !== event.pointerId) return;
			if (event.pointerType === 'mouse' && event.buttons !== 1) return;
			if (!moved) {
				const slop = coarsePointer.current ? COARSE_SLOP : FINE_SLOP;
				if (Math.hypot(event.clientX - originX, event.clientY - originY) <= slop) return;
				moved = true;
				grabbing = true;
				dragging = true;
				capturePointer(event.pointerId);
				kickParticles();
			}
			const dx = event.clientX - lastX;
			const dy = event.clientY - lastY;
			const dt = Math.max(8, event.timeStamp - lastT);
			const sampleVx = (dx / dt) * THROW_SCALE;
			const sampleVy = (dy / dt) * THROW_SCALE;
			vx = vx * 0.25 + sampleVx * 0.75;
			vy = vy * 0.25 + sampleVy * 0.75;
			panX = startPanX - (event.clientX - originX);
			panY = startPanY - (event.clientY - originY);
			const local = localPoint(event);
			grabX += (local.x - grabX) * 0.55;
			grabY += (local.y - grabY) * 0.55;
			if (!reducedMotion.current) {
				warpX = panX - startPanX;
				warpY = panY - startPanY;
				tilt.target = tiltFromDrag(warpX, warpY);
				stepParticles();
				kickParticles();
			}
			lastX = event.clientX;
			lastY = event.clientY;
			lastT = event.timeStamp;
			event.preventDefault();
		};

		const startInertia = () => {
			if (reducedMotion.current) return;
			vx *= RELEASE_BOOST;
			vy *= RELEASE_BOOST;
			const speed = Math.hypot(vx, vy);
			if (speed < STOP_SPEED) return;

			const startX = panX;
			const startY = panY;
			const duration = Math.min(600, Math.max(280, 170 + speed * 19));
			const distance = speed * 13;
			const dx = (vx / speed) * distance;
			const dy = (vy / speed) * distance;
			const from = performance.now();

			const step = (now: number) => {
				const t = Math.min(1, (now - from) / duration);
				const k = cubicOut(t);
				panX = startX - dx * k;
				panY = startY - dy * k;
				if (t < 1) {
					inertiaId = requestAnimationFrame(step);
				} else {
					inertiaId = 0;
					throwing = false;
					scheduleUrlSettle();
				}
			};
			throwing = true;
			inertiaId = requestAnimationFrame(step);
		};

		const finishPointer = (event: PointerEvent, cancelled: boolean) => {
			if (pointerId !== event.pointerId) return;
			if (node.hasPointerCapture(event.pointerId)) {
				node.releasePointerCapture(event.pointerId);
			}
			const tappedTile = !cancelled && !moved && pressTile != null ? pressTile : null;
			pointerId = null;
			dragging = false;
			grabbing = false;
			warpX = 0;
			warpY = 0;
			if (!reducedMotion.current) {
				void tilt.set({ x: 0, y: 0 }, { preserveMomentum: 180 });
			}
			kickParticles();
			if (moved) {
				suppressClickUntil = performance.now() + CLICK_SUPPRESS_MS;
				startInertia();
				scheduleUrlSettle();
			}
			clickTile = tappedTile;
			if (tappedTile) ignoreFocusPan = true;
			pointerActive = false;
			pressTile = null;
		};

		const onPointerUp = (event: PointerEvent) => finishPointer(event, false);
		const onPointerCancel = (event: PointerEvent) => finishPointer(event, true);

		const onWheel = (event: WheelEvent) => {
			event.preventDefault();
			stopInertia();
			stopParticles();
			grabbing = false;
			warpX = 0;
			warpY = 0;
			void tilt.set({ x: 0, y: 0 }, { instant: true });
			clearParticles();
			panX += event.deltaX;
			panY += event.deltaY;
			scheduleUrlSettle();
		};

		const onClick = (event: MouseEvent) => {
			const tile = tileFromTarget(event.target) ?? clickTile;
			clickTile = null;
			if (moved || performance.now() < suppressClickUntil) {
				event.preventDefault();
				event.stopPropagation();
				return;
			}
			if (!tile) return;
			if (event.target instanceof Element && event.target.closest('a.meta')) return;
			const link = tile.querySelector('a.meta');
			if (!(link instanceof HTMLAnchorElement)) return;
			event.preventDefault();
			event.stopPropagation();
			link.click();
			if (coarsePointer.current) link.blur();
		};

		const onNodeKeydown = (event: KeyboardEvent) => {
			ignoreFocusPan = false;
			if (!node.contains(event.target as Node | null)) return;
			onKeydown(event);
		};

		const onNodeFocus = (event: FocusEvent) => {
			if (event.target !== node) return;
			focusFirstTile();
		};

		const onScroll = () => {
			node.scrollTop = 0;
			node.scrollLeft = 0;
		};

		node.addEventListener('pointerdown', onPointerDown);
		node.addEventListener('pointermove', onPointerMove, { passive: false });
		node.addEventListener('pointerup', onPointerUp);
		node.addEventListener('pointercancel', onPointerCancel);
		node.addEventListener('wheel', onWheel, { passive: false });
		node.addEventListener('click', onClick, true);
		node.addEventListener('keydown', onNodeKeydown);
		node.addEventListener('focusin', onFocusIn);
		node.addEventListener('focus', onNodeFocus);
		node.addEventListener('scroll', onScroll);

		return () => {
			stopInertia();
			stopParticles();
			if (settleTimer) clearTimeout(settleTimer);
			settleTimer = 0;
			pointerActive = false;
			void tilt.set({ x: 0, y: 0 }, { instant: true });
			root = undefined;
			if (skip instanceof HTMLAnchorElement) {
				skip.removeEventListener('click', onSkipClick);
			}
			node.removeEventListener('pointerdown', onPointerDown);
			node.removeEventListener('pointermove', onPointerMove);
			node.removeEventListener('pointerup', onPointerUp);
			node.removeEventListener('pointercancel', onPointerCancel);
			node.removeEventListener('wheel', onWheel);
			node.removeEventListener('click', onClick, true);
			node.removeEventListener('keydown', onNodeKeydown);
			node.removeEventListener('focusin', onFocusIn);
			node.removeEventListener('focus', onNodeFocus);
			node.removeEventListener('scroll', onScroll);
		};
	}
</script>

<div
	class="field"
	id="field"
	tabindex="-1"
	class:dragging
	class:ready={fieldReady}
	role="region"
	aria-label="Project field. Tab through visible projects, arrow keys move to adjacent tiles."
	bind:clientWidth={width}
	bind:clientHeight={height}
	style:--title-block="{TITLE_BLOCK}px"
	{@attach fieldSurface}
>
	{#if layout}
		<div class="void" aria-hidden="true">
			{#each PARALLAX as layer (layer.name)}
				<div
					class={['wash', layer.name]}
					data-depth={layer.depth}
					style:background-position={`${-camX * layer.depth}px ${-camY * layer.depth}px`}
				></div>
			{/each}
		</div>
		<div class="lens">
			<div
				class="stage"
				style:transform={reducedMotion.current
					? undefined
					: `perspective(1400px) rotateX(${tilt.current.x}deg) rotateY(${tilt.current.y}deg)`}
			>
				<div class="world" style:transform="translate3d({-camX}px, {-camY}px, 0)">
					{#each cells as cell (`${cell.x}:${cell.y}`)}
						{@const shift = tileShift(cell.x, cell.y)}
						<div
							class="cell"
							data-stretch="{shift.x.toFixed(1)},{shift.y.toFixed(1)}"
							style:transform="translate3d({cell.x * layout.cellW + shift.x}px, {cell.y * layout.cellH + shift.y}px, 0)"
						>
							<Tile
								project={projectAt(cell.x, cell.y, layout)}
								cellX={cell.x}
								cellY={cell.y}
								width={layout.tileW}
								height={layout.tileH}
								tabIndex={layout && (isTabStop(cell.x, cell.y, layout) || (cell.x === focusX && cell.y === focusY)) ? 0 : -1}
								loading="eager"
								fetchpriority={(focusSlug ? cell.x === focusX && cell.y === focusY : cell.x === 0 && cell.y === 0)
									? 'high'
									: 'auto'}
							/>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.field {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
		overflow: hidden;
		overflow: clip;
		overflow-anchor: none;
		overscroll-behavior: none;
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
		cursor: grab;
		background: transparent;
		pointer-events: none;
	}

	.lens {
		position: absolute;
		inset: 0;
		z-index: 1;
	}

	.stage {
		position: absolute;
		inset: 0;
		transform-origin: 50% 50%;
	}

	.field.dragging .stage {
		will-change: transform;
	}

	.field.dragging :global(.tile) {
		cursor: grabbing;
	}

	.field.ready {
		background: var(--bg);
		pointer-events: auto;
	}

	.field:focus {
		outline: none;
	}

	.field.dragging {
		cursor: grabbing;
	}

	.void {
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
		background-color: var(--bg);
		background-image: radial-gradient(
			ellipse 90% 80% at 50% 42%,
			transparent 52%,
			rgba(7, 7, 8, 0.42) 100%
		);
	}

	.wash {
		position: absolute;
		inset: 0;
		background-repeat: repeat;
	}

	.wash.haze {
		background-image: radial-gradient(
			ellipse 1200px 900px,
			rgba(72, 62, 96, 0.62) 0%,
			transparent 72%
		);
		background-size: 1600px 1300px;
	}

	.wash.far {
		background-image:
			radial-gradient(ellipse 980px 720px, rgba(92, 74, 126, 0.62) 0%, transparent 68%),
			radial-gradient(ellipse 820px 900px, rgba(38, 78, 102, 0.38) 0%, transparent 66%);
		background-size:
			1400px 1100px,
			1600px 1300px;
	}

	.wash.mid {
		background-image:
			radial-gradient(ellipse 860px 980px, rgba(38, 78, 102, 0.5) 0%, transparent 64%),
			radial-gradient(ellipse 920px 640px, rgba(110, 52, 58, 0.4) 0%, transparent 66%);
		background-size:
			1200px 1400px,
			1500px 1100px;
	}

	.wash.near {
		background-image:
			radial-gradient(ellipse 640px 520px, rgba(118, 108, 88, 0.22) 0%, transparent 62%),
			radial-gradient(ellipse 700px 580px, rgba(34, 58, 92, 0.42) 0%, transparent 64%);
		background-size:
			1000px 900px,
			1200px 1000px;
	}

	.world {
		position: absolute;
		inset: 0;
		z-index: 1;
		will-change: transform;
	}

	.cell {
		position: absolute;
		left: 0;
		top: 0;
		will-change: transform;
		touch-action: none;
	}

	.cell:has(:global(:focus-visible)) {
		z-index: 2;
		outline: 3px solid var(--focus);
		outline-offset: 4px;
	}
</style>
