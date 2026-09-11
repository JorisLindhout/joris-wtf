import type { Project } from './types';

export const IMAGE_WIDTHS = [320, 480, 640, 960] as const;

export function srcFor(project: Project): string {
	return project.src;
}

export function srcsetFor(project: Project): string {
	return project.srcset;
}

export function sizesFor(tileWidthPx: number): string {
	return `${Math.round(tileWidthPx)}px`;
}
