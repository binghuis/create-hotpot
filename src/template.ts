import { Framework } from './type';
import { blue, cyan, green, magenta, yellow } from 'kleur/colors';


const FRAMEWORKS: Framework[] = [
  {
    name: 'desktop',
    display: 'Desktop Site',
    color: cyan,
    variants: [
      {
        name: 'react-desktop',
        display: 'React',
        color: blue,
        repo: 'binghuis/template-react-desktop',
      },
      {
        name: 'vue-desktop',
        display: 'Vue',
        color: yellow,
      },
    ],
  },
  {
    name: 'mobile',
    display: 'Mobile Site',
    color: green,
    variants: [
      {
        name: 'react-mobile',
        display: 'React',
        color: blue,
      },
      {
        name: 'vue-mobile',
        display: 'Vue',
        color: yellow,
      },
    ],
  },
  {
    name: 'docs',
    display: 'Docs',
    color: magenta,
    variants: [
      {
        name: 'astro-docs',
        display: 'Astro',
        color: blue,
      },
    ],
  },
];

export { FRAMEWORKS };
