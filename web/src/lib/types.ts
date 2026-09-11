export type Project = {
	title: string;
	slug: string;
	url: string;
	openInNewTab: boolean;
	thumbnailAlt: string;
	description?: string;
	/** Reserved for later; unused in v1 UI sort. */
	sortOrder?: number;
	src: string;
	srcset: string;
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
