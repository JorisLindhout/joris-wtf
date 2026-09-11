import type { Project } from '../lib/types';

/**
 * Phase 1 mock content. Shape matches the planned Sanity `project` document.
 * Replace via `src/lib/content.ts` in Phase 2 — do not scatter Sanity fetches.
 */
export const projects: Project[] = [
	{
		title: 'Autobahn',
		slug: 'autobahn',
		url: 'https://example.com/autobahn',
		openInNewTab: true,
		thumbnailAlt: 'Placeholder thumbnail for Autobahn',
		description: 'A fast, linear experiment in motion and type.',
		imageId: 'autobahn',
	},
	{
		title: 'DR-101',
		slug: 'dr-101',
		url: 'https://example.com/dr-101',
		openInNewTab: true,
		thumbnailAlt: 'Placeholder thumbnail for DR-101',
		description: 'Drum machine as a small world you can drift through.',
		imageId: 'dr-101',
	},
	{
		title: 'Juno',
		slug: 'juno',
		url: 'https://example.com/juno',
		openInNewTab: true,
		thumbnailAlt: 'Placeholder thumbnail for Juno',
		description: 'Soft analog surfaces, held just above silence.',
		imageId: 'juno',
	},
	{
		title: 'Kijkdoos',
		slug: 'kijkdoos',
		url: 'https://example.com/kijkdoos',
		openInNewTab: true,
		thumbnailAlt: 'Placeholder thumbnail for Kijkdoos',
		description: 'A peep-box: look in, not around.',
		imageId: 'kijkdoos',
	},
	{
		title: 'Mobey Run',
		slug: 'mobey-run',
		url: 'https://example.com/mobey-run',
		openInNewTab: true,
		thumbnailAlt: 'Placeholder thumbnail for Mobey Run',
		description: 'A runner that would rather wander.',
		imageId: 'mobey-run',
	},
	{
		title: 'Phantasm',
		slug: 'phantasm',
		url: 'https://example.com/phantasm',
		openInNewTab: true,
		thumbnailAlt: 'Placeholder thumbnail for Phantasm',
		description: 'The quiet field this site takes its cue from.',
		imageId: 'phantasm',
	},
	{
		title: 'LinkedIn',
		slug: 'linkedin',
		url: 'https://www.linkedin.com/',
		openInNewTab: true,
		thumbnailAlt: 'Placeholder thumbnail for LinkedIn',
		imageId: 'linkedin',
	},
	{
		title: 'Ell Creative',
		slug: 'ell-creative',
		url: 'https://ellcreative.com/',
		openInNewTab: true,
		thumbnailAlt: 'Placeholder thumbnail for Ell Creative',
		description: 'Studio site, treated as one more tile.',
		imageId: 'ell-creative',
	},
];
