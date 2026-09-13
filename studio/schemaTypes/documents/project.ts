import { defineField, defineType } from 'sanity';
import { ImagesIcon } from '@sanity/icons/Images';

export const project = defineType({
	name: 'project',
	title: 'Project',
	type: 'document',
	icon: ImagesIcon,
	fields: [
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: { source: 'title', maxLength: 96 },
			validation: (rule) =>
				rule.required().custom((value) => {
					const current = value?.current;
					if (!current) return true;
					const reserved = new Set([
						'404',
						'_astro',
						'favicon',
						'favicon.ico',
						'llms.txt',
						'robots.txt',
						'site.webmanifest',
						'sitemap-0',
						'sitemap-0.xml',
						'sitemap-index',
						'sitemap-index.xml',
					]);
					return reserved.has(current) ? 'This slug is reserved for the site.' : true;
				}),
		}),
		defineField({
			name: 'url',
			title: 'URL',
			type: 'url',
			validation: (rule) => rule.required().uri({ scheme: ['http', 'https'] }),
		}),
		defineField({
			name: 'openInNewTab',
			title: 'Open in new tab',
			type: 'boolean',
			initialValue: true,
		}),
		defineField({
			name: 'thumbnail',
			title: 'Thumbnail',
			type: 'image',
			options: { hotspot: true },
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'thumbnailAlt',
			title: 'Thumbnail alt text',
			type: 'string',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'description',
			title: 'Description',
			type: 'text',
			rows: 2,
			description: 'Optional. One sentence, shown on hover/focus.',
		}),
		defineField({
			name: 'fieldPresence',
			title: 'Field presence',
			type: 'string',
			description:
				'How often this project appears when you pan beyond the first board. The first board and the project list still show every project once.',
			options: {
				list: [
					{ title: 'First board only', value: 'firstBoardOnly' },
					{ title: 'Rare', value: 'rare' },
					{ title: 'Normal', value: 'normal' },
					{ title: 'Often', value: 'often' },
				],
				layout: 'dropdown',
			},
			initialValue: 'normal',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'sortOrder',
			title: 'Sort order',
			type: 'number',
			description: 'Reserved. v1 UI still sorts by title.',
		}),
	],
	preview: {
		select: { title: 'title', media: 'thumbnail', subtitle: 'url' },
	},
});
