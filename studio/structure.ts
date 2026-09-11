import type { StructureResolver } from 'sanity/structure';
import { CogIcon } from '@sanity/icons/Cog';
import { ImagesIcon } from '@sanity/icons/Images';

export const structure: StructureResolver = (S) =>
	S.list()
		.title('Content')
		.items([
			S.listItem()
				.title('Site settings')
				.id('siteSettings')
				.icon(CogIcon)
				.child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Site settings')),
			S.divider(),
			S.documentTypeListItem('project').title('Projects').icon(ImagesIcon),
		]);
