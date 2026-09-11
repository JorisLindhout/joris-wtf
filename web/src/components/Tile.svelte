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
</script>

<article
	class="tile"
	data-cell="{cellX},{cellY}"
	data-slug={project.slug}
	style:width="{width}px"
	style:height="{height}px"
>
	<img
		src={srcFor(project)}
		srcset={srcsetFor(project)}
		sizes={sizesFor(width)}
		width="640"
		height="480"
		alt=""
		{loading}
		{fetchpriority}
		decoding="async"
		draggable="false"
	/>
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
		position: relative;
		background: var(--tile-wash);
		border: 1px solid var(--line);
		overflow: hidden;
		user-select: none;
	}

	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.78;
		pointer-events: none;
	}

	.meta {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		color: var(--fg);
		text-decoration: none;
		cursor: pointer;
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
		display: none;
		color: var(--fg-muted);
		font-size: 0.75rem;
		line-height: 1.4;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tile:hover .desc,
	.tile:focus-within .desc,
	.meta:focus-visible .desc {
		display: block;
	}

	@media (hover: none) {
		.desc {
			display: block;
		}
	}
</style>
