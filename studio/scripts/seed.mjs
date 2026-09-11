import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@sanity/client';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'elkf1eqd';
const dataset = process.env.SANITY_STUDIO_DATASET || 'production';
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!token) {
	console.error('Need SANITY_API_WRITE_TOKEN in studio/.env');
	process.exit(1);
}

const client = createClient({
	projectId,
	dataset,
	apiVersion: '2026-09-11',
	token,
	useCdn: false,
	timeout: 300_000,
});

const root = path.resolve(import.meta.dirname, '../..');

const projects = [
	{
		title: 'Autobahn',
		slug: 'autobahn',
		url: 'https://example.com/autobahn',
		description: 'A fast, linear experiment in motion and type.',
	},
	{
		title: 'DR-101',
		slug: 'dr-101',
		url: 'https://example.com/dr-101',
		description: 'Drum machine as a small world you can drift through.',
	},
	{
		title: 'Juno',
		slug: 'juno',
		url: 'https://example.com/juno',
		description: 'Soft analog surfaces, held just above silence.',
	},
	{
		title: 'Kijkdoos',
		slug: 'kijkdoos',
		url: 'https://example.com/kijkdoos',
		description: 'A peep-box: look in, not around.',
	},
	{
		title: 'Mobey Run',
		slug: 'mobey-run',
		url: 'https://example.com/mobey-run',
		description: 'A runner that would rather wander.',
	},
	{
		title: 'Phantasm',
		slug: 'phantasm',
		url: 'https://example.com/phantasm',
		description: 'The quiet field this site takes its cue from.',
	},
	{
		title: 'LinkedIn',
		slug: 'linkedin',
		url: 'https://www.linkedin.com/',
	},
	{
		title: 'Ell Creative',
		slug: 'ell-creative',
		url: 'https://ellcreative.com/',
		description: 'Studio site, treated as one more tile.',
	},
];

async function uploadImage(filePath, filename) {
	const asset = await client.assets.upload('image', createReadStream(filePath), { filename });
	return {
		_type: 'image',
		asset: { _type: 'reference', _ref: asset._id },
	};
}

async function requireImage({ existing, filePath, filename, label }) {
	if (existing) return existing;
	if (filePath && existsSync(filePath)) return uploadImage(filePath, filename);
	console.error(`${label} needs an image in Studio before it can be seeded.`);
	process.exit(1);
}

const existingSettings = await client.fetch(`*[_id == "siteSettings"][0]{ ogImage }`);
const ogFile = path.join(root, 'web/public/images/og.png');
const ogImage = await requireImage({
	existing: existingSettings?.ogImage,
	filePath: ogFile,
	filename: 'og.png',
	label: 'siteSettings.ogImage',
});

await client.createOrReplace({
	_id: 'siteSettings',
	_type: 'siteSettings',
	title: 'joris.wtf',
	description: 'An infinite field of projects.',
	siteName: 'joris.wtf',
	ogTitle: 'joris.wtf',
	ogDescription: 'An infinite field of projects.',
	ogImage,
	ogImageAlt: 'joris.wtf — an infinite field of projects',
	twitterCard: 'summary_large_image',
	locale: 'en',
});
console.log('Wrote siteSettings');

for (const project of projects) {
	const existing = await client.fetch(
		`*[_type == "project" && slug.current == $slug][0]{ _id, thumbnail, thumbnailAlt }`,
		{ slug: project.slug },
	);
	const thumbnail = await requireImage({
		existing: existing?.thumbnail,
		label: `project "${project.slug}" thumbnail`,
	});
	const doc = {
		_type: 'project',
		title: project.title,
		slug: { _type: 'slug', current: project.slug },
		url: project.url,
		openInNewTab: true,
		thumbnail,
		thumbnailAlt: existing?.thumbnailAlt || project.title,
		description: project.description,
	};
	if (existing?._id) {
		await client.patch(existing._id).set(doc).commit();
		console.log('Updated project', project.slug);
	} else {
		await client.create(doc);
		console.log('Created project', project.slug);
	}
}
