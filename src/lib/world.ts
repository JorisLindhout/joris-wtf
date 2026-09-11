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
const TITLE_BLOCK = 44;
const OVERSCAN_FRACTION = 0.4;

export function computeLayout(viewportW: number, projectCount: number): Layout {
	const width = Math.max(1, viewportW);
	const n = Math.max(1, projectCount);
	const tileW = Math.min(TILE_MAX, Math.max(TILE_MIN, width * 0.22));
	const cols = Math.max(1, Math.floor((width + GAP) / (tileW + GAP)));
	const tileH = tileW * IMAGE_ASPECT + TITLE_BLOCK;
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

export function initialCamera(layout: Layout): { x: number; y: number } {
	return {
		x: -layout.tileW * OVERSCAN_FRACTION,
		y: -layout.tileH * OVERSCAN_FRACTION,
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
