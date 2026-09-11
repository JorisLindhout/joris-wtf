import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const outDir = path.resolve('public/images/placeholders');
const widths = [320, 480, 640, 960];

const placeholders = [
	{ id: 'autobahn', title: 'Autobahn', bg: '#1a1512', fg: '#8a7a70' },
	{ id: 'dr-101', title: 'DR-101', bg: '#12161a', fg: '#6e7a86' },
	{ id: 'juno', title: 'Juno', bg: '#161412', fg: '#8a8070' },
	{ id: 'kijkdoos', title: 'Kijkdoos', bg: '#14181a', fg: '#748086' },
	{ id: 'mobey-run', title: 'Mobey Run', bg: '#1a1216', fg: '#866e7a' },
	{ id: 'phantasm', title: 'Phantasm', bg: '#0e0e10', fg: '#6a6a70' },
	{ id: 'linkedin', title: 'LinkedIn', bg: '#12141a', fg: '#6e7486' },
	{ id: 'ell-creative', title: 'Ell Creative', bg: '#181614', fg: '#82786c' },
];

await mkdir(outDir, { recursive: true });

for (const item of placeholders) {
	for (const width of widths) {
		const height = Math.round(width * 0.75);
		const svg = `
			<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
				<rect width="100%" height="100%" fill="${item.bg}"/>
				<rect x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.1)}" width="${Math.round(width * 0.84)}" height="${Math.round(height * 0.8)}" fill="none" stroke="${item.fg}" stroke-width="${Math.max(1, Math.round(width / 320))}"/>
				<text x="50%" y="52%" text-anchor="middle" fill="${item.fg}" font-family="ui-sans-serif, Helvetica, sans-serif" font-size="${Math.round(width / 18)}">${item.title}</text>
			</svg>
		`;
		const file = path.join(outDir, `${item.id}-${width}.webp`);
		await sharp(Buffer.from(svg)).webp({ quality: 78 }).toFile(file);
		console.log(file);
	}
}
