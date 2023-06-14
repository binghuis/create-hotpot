import { Framework } from './type';
import { blue, cyan, green, magenta, yellow } from 'kleur/colors';

const FRAMEWORKS: Framework[] = [
  {
    title: 'Desktop Site',
    value: 'desktop',
    color: cyan,
    variants: [
      {
        title: 'React',
        value: 'react-desktop',
        color: blue,
        repo: 'binghuis/template-react-desktop',
      },
      {
        title: 'Vue',
        value: 'vue-desktop',
        color: yellow,
        disabled: true,
      },
    ],
  },
  {
    title: 'Mobile Site',
    value: 'mobile',
    color: green,
    disabled: true,
    variants: [
      {
        title: 'React',
        value: 'react-mobile',
        color: blue,
      },
      {
        title: 'Vue',
        value: 'vue-mobile',
        color: yellow,
      },
    ],
  },
  {
    title: 'Docs',
    value: 'docs',
    color: magenta,
    disabled: true,
    variants: [
      {
        value: 'astro-docs',
        title: 'Astro',
        color: blue,
      },
    ],
  },
];

export { FRAMEWORKS };
