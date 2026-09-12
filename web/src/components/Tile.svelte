<script lang="ts">
	import { sizesFor, srcFor, srcsetFor } from '../lib/images';
	import type { Project } from '../lib/types';

	let {
		project,
		cellX,
		cellY,
		width,
		height,
		tabIndex = -1,
		loading = 'lazy',
		fetchpriority = 'auto',
	}: {
		project: Project;
		cellX: number;
		cellY: number;
		width: number;
		height: number;
		tabIndex?: number;
		loading?: 'lazy' | 'eager';
		fetchpriority?: 'high' | 'low' | 'auto';
	} = $props();

	const rel = $derived(project.openInNewTab ? 'noopener noreferrer' : undefined);
	const target = $derived(project.openInNewTab ? '_blank' : undefined);
	const src = $derived(srcFor(project));
	const shotW = $derived(Math.max(1, Math.round(width)));
	const shotH = $derived(Math.max(1, Math.round(width * 0.75)));

	function paintWhenReady(node: HTMLImageElement) {
		void src;
		node.classList.remove('painted');
		const paint = () => node.classList.add('painted');
		if (node.complete) {
			paint();
			return;
		}
		node.addEventListener('load', paint);
		node.addEventListener('error', paint);
		return () => {
			node.removeEventListener('load', paint);
			node.removeEventListener('error', paint);
		};
	}
</script>

<article
	class="tile"
	data-cell="{cellX},{cellY}"
	data-slug={project.slug}
	style:width="{width}px"
	style:height="{height}px"
>
	<div class="shot" aria-hidden="true">
		<img
			{src}
			srcset={srcsetFor(project)}
			sizes={sizesFor(width)}
			width={shotW}
			height={shotH}
			alt=""
			{loading}
			{fetchpriority}
			decoding="async"
			draggable="false"
			{@attach paintWhenReady}
		/>
	</div>
	<a class="meta" href={project.url} {target} rel={rel} tabindex={tabIndex} draggable="false">
		<span class="copy">
			<span class="title">{project.title}</span>
			{#if project.description}
				<span class="desc">{project.description}</span>
			{/if}
		</span>
	</a>
</article>

<style>
	.tile {
		display: flex;
		flex-direction: column;
		position: relative;
		background: var(--tile-wash);
		border: 1px solid var(--line);
		overflow: hidden;
		user-select: none;
		cursor: pointer;
		touch-action: none;
	}

	.shot {
		flex: 0 0 auto;
		width: 100%;
		aspect-ratio: 4 / 3;
		position: relative;
		background: var(--tile-wash);
	}

	img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		pointer-events: none;
		transition: opacity 180ms ease;
	}

	img:global(.painted) {
		opacity: 0.78;
	}

	.meta {
		flex: 1 1 auto;
		min-height: var(--title-block, 44px);
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		color: var(--fg);
		text-decoration: none;
		cursor: pointer;
		touch-action: none;
	}

	.meta:focus,
	.meta:focus-visible {
		outline: none;
	}

	.copy {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0;
		padding: 0 var(--space-sm);
		flex: 0 0 auto;
		min-height: var(--title-block, 44px);
		background: var(--tile);
		overflow: hidden;
	}

	.title {
		font-size: 0.86rem;
		line-height: 1.4;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.desc {
		display: block;
		max-height: 0;
		opacity: 0;
		overflow: hidden;
		color: var(--fg-muted);
		font-size: 0.75rem;
		line-height: 1.4;
		white-space: nowrap;
		text-overflow: ellipsis;
		transition:
			max-height 180ms ease,
			opacity 180ms ease;
	}

	.tile:hover .desc,
	.tile:focus-within .desc,
	.meta:focus-visible .desc {
		max-height: 1.4em;
		opacity: 1;
	}

	@media (hover: none) {
		.desc {
			max-height: 1.4em;
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		img {
			opacity: 0.78;
			transition: none;
		}

		.desc {
			transition: none;
		}
	}
</style>
