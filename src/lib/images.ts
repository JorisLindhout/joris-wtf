import type { Project } from './types';

export const IMAGE_WIDTHS = [320, 480, 640, 960] as const;

export function placeholderSrc(imageId: string, width: (typeof IMAGE_WIDTHS)[number]): string {
	return `/images/placeholders/${imageId}-${width}.webp`;
}

export function srcFor(project: Project): string {
	return placeholderSrc(project.imageId, 640);
}

export function srcsetFor(project: Project): string {
	return IMAGE_WIDTHS.map((width) => `${placeholderSrc(project.imageId, width)} ${width}w`).join(
		', ',
	);
}

export function sizesFor(tileWidthPx: number): string {
	return `${Math.round(tileWidthPx)}px`;
}
