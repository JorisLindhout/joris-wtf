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
			validation: (rule) => rule.required(),
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
