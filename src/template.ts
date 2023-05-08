import { Framework } from './type';
import { blue, cyan, green, yellow } from 'kolorist';

const FRAMEWORKS: Framework[] = [
	{
		name: 'desktop',
		display: 'Desktop',
		color: green,
		variants: [
			{
				name: 'react-desktop',
				display: 'React',
				color: yellow,
				repo: 'binghuis/template-react-desktop',
			},
			{
				name: 'vue-desktop',
				display: 'Vue',
				color: blue,
			},
		],
	},
	{
		name: 'mobile',
		display: 'Mobile',
		color: cyan,
		variants: [
			{
				name: 'react-mobile',
				display: 'React',
				color: yellow,
			},
			{
				name: 'vue-mobile',
				display: 'Vue',
				color: blue,
			},
		],
	},
	{
		name: 'docs',
		display: 'Docs',
		color: cyan,
		variants: [
			{
				name: 'astro-docs',
				display: 'Astro',
				color: yellow,
			},
		],
	},
];

export { FRAMEWORKS };
