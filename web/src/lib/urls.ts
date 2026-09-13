import { projectPath } from './slugs';

/** Replace the current history entry with a project document URL. Never pushState. */
export function replaceProjectPath(slug: string): void {
	if (typeof history === 'undefined' || typeof location === 'undefined') return;
	const next = projectPath(slug);
	if (location.pathname === next && !location.hash && !location.search) return;
	history.replaceState(history.state, '', next);
}
