export type Layout = {
	cols: number;
	rows: number;
	tileW: number;
	tileH: number;
	gap: number;
	cellW: number;
	cellH: number;
};

export type Cell = { x: number; y: number };

const TILE_MIN = 160;
const TILE_MAX = 280;
const GAP = 12;
const IMAGE_ASPECT = 0.75;
export const TITLE_BLOCK = 44;
const OVERSCAN_FRACTION = 0.4;
const MIN_PEEK_FRACTION = 0.22;
const MAX_PEEK_FRACTION = 0.72;

export function computeLayout(
	viewportW: number,
	projectCount: number,
	titleBlock = TITLE_BLOCK,
): Layout {
	const width = Math.max(1, viewportW);
	const n = Math.max(1, projectCount);
	const tileW = Math.min(TILE_MAX, Math.max(TILE_MIN, width * 0.22));
	const cols = Math.max(1, Math.floor((width + GAP) / (tileW + GAP)));
	const tileH = tileW * IMAGE_ASPECT + titleBlock;
	const rows = Math.max(1, Math.ceil(n / cols));

	return {
		cols,
		rows,
		tileW,
		tileH,
		gap: GAP,
		cellW: tileW + GAP,
		cellH: tileH + GAP,
	};
}

function mod(n: number, m: number): number {
	return ((n % m) + m) % m;
}

/** Tile pixels showing after the near viewport edge cuts a cell. */
export function nearSliver(cam: number, cell: number, tile: number): number {
	const pos = mod(cam, cell);
	if (pos >= tile) return 0;
	return tile - pos;
}

/** Tile pixels showing before the far viewport edge cuts a cell. */
export function farSliver(cam: number, viewport: number, cell: number, tile: number): number {
	const pos = mod(cam + viewport, cell);
	if (pos <= 0 || pos >= tile) return 0;
	return pos;
}

export function axisCamera(viewport: number, cell: number, tile: number): number {
	const target = tile * OVERSCAN_FRACTION;
	const minPeek = tile * MIN_PEEK_FRACTION;
	const maxPeek = tile * MAX_PEEK_FRACTION;

	let best = -target;
	let bestScore = Number.NEGATIVE_INFINITY;

	const camStart = Math.floor(-(maxPeek + GAP));
	const camEnd = Math.ceil(-minPeek);

	for (let cam = camStart; cam <= camEnd; cam += 1) {
		const near = nearSliver(cam, cell, tile);
		const far = farSliver(cam, viewport, cell, tile);
		if (near < minPeek || near > maxPeek) continue;

		const both = far >= minPeek && far <= maxPeek;
		const score =
			(both ? 1000 : 0) - Math.abs(near - target) - Math.abs(far - target) - (far === 0 ? 500 : 0);
		if (score > bestScore) {
			bestScore = score;
			best = cam;
		}
		if (both && Math.abs(near - target) < 2 && Math.abs(far - target) < 2) return cam;
	}

	return best;
}

export function initialCamera(
	layout: Layout,
	viewportW: number,
	viewportH: number,
): { x: number; y: number } {
	return {
		x: axisCamera(viewportW, layout.cellW, layout.tileW),
		y: axisCamera(viewportH, layout.cellH, layout.tileH),
	};
}

export function cellSeed(x: number, y: number): number {
	const ux = x | 0;
	const uy = y | 0;
	let h = Math.imul(ux, 374761393) + Math.imul(uy, 668265263);
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return (h ^ (h >>> 16)) >>> 0;
}

export function isPrimaryCell(
	x: number,
	y: number,
	cols: number,
	rows: number,
	count: number,
): boolean {
	if (x < 0 || y < 0 || x >= cols || y >= rows) return false;
	return y * cols + x < count;
}

export function projectIndexForCell(
	x: number,
	y: number,
	cols: number,
	rows: number,
	count: number,
): number {
	if (count <= 0) return 0;
	if (isPrimaryCell(x, y, cols, rows, count)) return y * cols + x;
	return cellSeed(x, y) % count;
}

/** True when the whole tile is on-screen, so it is a sensible Tab stop. */
export function cellFullyInViewport(
	x: number,
	y: number,
	camX: number,
	camY: number,
	viewportW: number,
	viewportH: number,
	layout: Layout,
	slop = 2,
): boolean {
	const left = x * layout.cellW - camX;
	const top = y * layout.cellH - camY;
	return (
		left >= -slop &&
		top >= -slop &&
		left + layout.tileW <= viewportW + slop &&
		top + layout.tileH <= viewportH + slop
	);
}

export function visibleCells(
	camX: number,
	camY: number,
	viewportW: number,
	viewportH: number,
	layout: Layout,
	buffer = 1,
): Cell[] {
	const startX = Math.floor(camX / layout.cellW) - buffer;
	const endX = Math.ceil((camX + viewportW) / layout.cellW) + buffer;
	const startY = Math.floor(camY / layout.cellH) - buffer;
	const endY = Math.ceil((camY + viewportH) / layout.cellH) + buffer;

	const cells: Cell[] = [];
	for (let y = startY; y < endY; y += 1) {
		for (let x = startX; x < endX; x += 1) {
			cells.push({ x, y });
		}
	}
	return cells;
}
