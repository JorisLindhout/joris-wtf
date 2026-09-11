import { projects } from '../data/projects';
import { sortProjects } from './sort';
import type { Project } from './types';

/**
 * Single content gateway. Phase 1 reads local mock data.
 * Phase 2 replaces this implementation with Sanity; callers stay the same.
 */
export async function getProjects(): Promise<Project[]> {
	return sortProjects(projects);
}
