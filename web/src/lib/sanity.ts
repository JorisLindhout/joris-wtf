import { createClient, type SanityClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import { IMAGE_WIDTHS } from './images';

type SanityImageSource = { asset?: { _ref?: string } };

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? '';
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production';
const apiVersion = '2026-09-11';

export function getSanityClient(): SanityClient {
	if (!projectId) {
		throw new Error(
			'PUBLIC_SANITY_PROJECT_ID is not set. Copy web/.env.example to web/.env.',
		);
	}
	return createClient({
		projectId,
		dataset,
		apiVersion,
		useCdn: false,
	});
}

function builder() {
	return createImageUrlBuilder({ projectId, dataset });
}

export function tileSrc(image: SanityImageSource, width = 640): string {
	return builder().image(image).width(width).format('webp').quality(75).fit('max').url();
}

export function tileSrcset(image: SanityImageSource): string {
	return IMAGE_WIDTHS.map((width) => `${tileSrc(image, width)} ${width}w`).join(', ');
}

export function shareImageSrc(image: SanityImageSource): string {
	return builder().image(image).width(1200).height(630).fit('crop').format('jpg').quality(80).url();
}
