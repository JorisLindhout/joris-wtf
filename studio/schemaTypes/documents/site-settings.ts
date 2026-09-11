import { defineField, defineType } from 'sanity';
import { CogIcon } from '@sanity/icons/Cog';

export const siteSettings = defineType({
	name: 'siteSettings',
	title: 'Site settings',
	type: 'document',
	icon: CogIcon,
	fieldsets: [{ name: 'seo', title: 'SEO' }],
	fields: [
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			fieldset: 'seo',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'description',
			title: 'Description',
			type: 'text',
			rows: 2,
			fieldset: 'seo',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'siteName',
			title: 'Site name',
			type: 'string',
			fieldset: 'seo',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'ogTitle',
			title: 'Open Graph title',
			type: 'string',
			fieldset: 'seo',
			description: 'Defaults to Title if empty.',
		}),
		defineField({
			name: 'ogDescription',
			title: 'Open Graph description',
			type: 'text',
			rows: 2,
			fieldset: 'seo',
			description: 'Defaults to Description if empty.',
		}),
		defineField({
			name: 'ogImage',
			title: 'Open Graph image',
			type: 'image',
			options: { hotspot: true },
			fieldset: 'seo',
			validation: (rule) => rule.required(),
			description: 'About 1200×630. Used for sharing cards.',
		}),
		defineField({
			name: 'ogImageAlt',
			title: 'Open Graph image alt',
			type: 'string',
			fieldset: 'seo',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'twitterCard',
			title: 'Twitter card',
			type: 'string',
			fieldset: 'seo',
			options: {
				list: [
					{ title: 'Summary', value: 'summary' },
					{ title: 'Summary large image', value: 'summary_large_image' },
				],
				layout: 'radio',
			},
			initialValue: 'summary_large_image',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'locale',
			title: 'Locale',
			type: 'string',
			fieldset: 'seo',
			initialValue: 'en',
			validation: (rule) => rule.required(),
		}),
	],
	preview: {
		prepare: () => ({ title: 'Site settings' }),
	},
});
