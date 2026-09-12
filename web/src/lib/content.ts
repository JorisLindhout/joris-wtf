import { defineQuery } from 'groq';
import type { PROJECTS_QUERY_RESULT, SITE_SETTINGS_QUERY_RESULT } from '../../sanity.types';
import { sortProjects } from './sort';
import { getSanityClient, shareImageSrc, tileSrc, tileSrcset } from './sanity';
import {
	DEFAULT_FIELD_PRESENCE,
	isFieldPresence,
	type Project,
	type SiteSeo,
} from './types';

const PROJECTS_QUERY = defineQuery(/* groq */ `*[_type == "project" && defined(slug.current) && defined(thumbnail)]{
  title,
  "slug": slug.current,
  url,
  openInNewTab,
  thumbnailAlt,
  description,
  fieldPresence,
  sortOrder,
  thumbnail
}`);

const SITE_SETTINGS_QUERY = defineQuery(/* groq */ `*[_id == "siteSettings"][0]{
  title,
  description,
  siteName,
  ogTitle,
  ogDescription,
  ogImage,
  ogImageAlt,
  twitterCard,
  locale
}`);

export class MissingContentError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'MissingContentError';
	}
}

function mapProject(doc: PROJECTS_QUERY_RESULT[number]): Project | null {
	if (!doc.title || !doc.slug || !doc.url || !doc.thumbnailAlt || !doc.thumbnail) return null;
	return {
		title: doc.title,
		slug: doc.slug,
		url: doc.url,
		openInNewTab: doc.openInNewTab ?? true,
		thumbnailAlt: doc.thumbnailAlt,
		description: doc.description || undefined,
		fieldPresence: isFieldPresence(doc.fieldPresence) ? doc.fieldPresence : DEFAULT_FIELD_PRESENCE,
		sortOrder: doc.sortOrder ?? undefined,
		src: tileSrc(doc.thumbnail),
		srcset: tileSrcset(doc.thumbnail),
	};
}

export function projectsFromDocs(docs: PROJECTS_QUERY_RESULT): Project[] {
	if (docs.length === 0) {
		throw new MissingContentError(
			'Sanity returned no published projects. Publish at least one project with a thumbnail.',
		);
	}
	const projects = sortProjects(
		docs.map(mapProject).filter((project): project is Project => project !== null),
	);
	if (projects.length === 0) {
		throw new MissingContentError(
			'Sanity projects are missing required fields (title, slug, url, thumbnail, thumbnailAlt).',
		);
	}
	return projects;
}

export function siteSeoFromDoc(doc: SITE_SETTINGS_QUERY_RESULT): SiteSeo {
	if (!doc?.title || !doc.description || !doc.siteName || !doc.ogImage || !doc.ogImageAlt) {
		throw new MissingContentError(
			'siteSettings is missing required SEO fields (title, description, siteName, ogImage, ogImageAlt).',
		);
	}
	return {
		title: doc.title,
		description: doc.description,
		siteName: doc.siteName,
		ogTitle: doc.ogTitle || doc.title,
		ogDescription: doc.ogDescription || doc.description,
		ogImage: shareImageSrc(doc.ogImage),
		ogImageAlt: doc.ogImageAlt,
		ogImageWidth: 1200,
		ogImageHeight: 630,
		twitterCard: doc.twitterCard ?? 'summary_large_image',
		locale: doc.locale || 'en',
	};
}

/** Single content gateway. Live Sanity only — missing content fails the build. */
export async function getProjects(): Promise<Project[]> {
	const docs = await getSanityClient().fetch(PROJECTS_QUERY);
	return projectsFromDocs(docs);
}

export async function getSiteSeo(): Promise<SiteSeo> {
	const doc = await getSanityClient().fetch(SITE_SETTINGS_QUERY);
	if (!doc) {
		throw new MissingContentError('Missing siteSettings document in Sanity (id: siteSettings).');
	}
	return siteSeoFromDoc(doc);
}
