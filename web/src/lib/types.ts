export const FIELD_PRESENCE_VALUES = ['firstBoardOnly', 'rare', 'normal', 'often'] as const;
export type FieldPresence = (typeof FIELD_PRESENCE_VALUES)[number];
export const DEFAULT_FIELD_PRESENCE: FieldPresence = 'normal';

export function isFieldPresence(value: unknown): value is FieldPresence {
	return (FIELD_PRESENCE_VALUES as readonly unknown[]).includes(value);
}

export type Project = {
	title: string;
	slug: string;
	url: string;
	openInNewTab: boolean;
	thumbnailAlt: string;
	description?: string;
	/** Overflow frequency. Missing CMS values map to Normal. */
	fieldPresence: FieldPresence;
	/** Reserved for later; unused in v1 UI sort. */
	sortOrder?: number;
	src: string;
	srcset: string;
	/** 1200×630 crop of the thumbnail for project-page share cards. */
	ogImage: string;
};

/** Apex site SEO. Maps to the Sanity `siteSettings` SEO fieldset. */
export type SiteSeo = {
	title: string;
	description: string;
	siteName: string;
	ogTitle: string;
	ogDescription: string;
	/** Absolute URL or site-relative path. */
	ogImage: string;
	ogImageAlt: string;
	ogImageWidth: number;
	ogImageHeight: number;
	twitterCard: 'summary' | 'summary_large_image';
	locale: string;
};
