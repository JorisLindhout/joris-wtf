export type Project = {
	title: string;
	slug: string;
	url: string;
	openInNewTab: boolean;
	thumbnailAlt: string;
	description?: string;
	/** Reserved for later; unused in v1 UI sort. */
	sortOrder?: number;
	/** Local placeholder id (filename stem) until Sanity images land. */
	imageId: string;
};
