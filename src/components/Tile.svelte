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
	}: {
		project: Project;
		cellX: number;
		cellY: number;
		width: number;
		height: number;
		tabIndex?: number;
		loading?: 'lazy' | 'eager';
	} = $props();

	const rel = $derived(project.openInNewTab ? 'noopener noreferrer' : undefined);
	const target = $derived(project.openInNewTab ? '_blank' : undefined);
</script>

<a
	class="tile"
	href={project.url}
	{target}
	rel={rel}
	tabindex={tabIndex}
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
		alt={project.thumbnailAlt}
		{loading}
		decoding="async"
		draggable="false"
	/>
	<span class="meta">
		<span class="title">{project.title}</span>
		{#if project.description}
			<span class="desc">{project.description}</span>
		{/if}
	</span>
</a>

<style>
	.tile {
		display: flex;
		flex-direction: column;
		color: inherit;
		text-decoration: none;
		background: var(--tile);
		border: 1px solid var(--line);
		overflow: hidden;
		user-select: none;
	}

	.tile:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 3px;
	}

	img {
		display: block;
		width: 100%;
		flex: 1 1 auto;
		height: 0;
		object-fit: cover;
		pointer-events: none;
	}

	.meta {
		flex: 0 0 44px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 0 0.6rem;
		min-height: 44px;
	}

	.title {
		font-size: 0.86rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.desc {
		display: none;
		color: var(--fg-muted);
		font-size: 0.75rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tile:hover .desc,
	.tile:focus-visible .desc {
		display: block;
	}

	.tile:hover .title,
	.tile:focus-visible .title {
		white-space: nowrap;
	}
</style>
