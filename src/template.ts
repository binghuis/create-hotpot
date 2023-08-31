import kleur from 'kleur';
import { Framework } from './type';

const FRAMEWORKS: Framework[] = [
  {
    label: 'React',
    value: 'react',
    color: kleur.blue,
    variants: [
      {
        label: 'Admin Dashboard System',
        hint: '管理后台',
        value: 'react-admin',
        color: kleur.cyan,
        repo: 'binghuis/template-react-desktop',
      },
    ],
  },
  {
    label: 'NextJs',
    value: 'nextjs',
    color: kleur.magenta,
    variants: [
      {
        label: 'Web App (SSR)',
        value: 'nextjs-app',
        color: kleur.cyan,
        repo: 'binghuis/template-nextjs',
      },
    ],
  },
  {
    label: 'Vue',
    value: 'vue',
    color: kleur.yellow,
    variants: [
      {
        label: 'Big Screen (Echarts)',
        value: 'vue-big-screen',
        color: kleur.cyan,
        disabled: true,
      },
    ],
  },
];

const TEMPLATES = FRAMEWORKS.map((framework) => framework.variants?.map((variant) => variant)).reduce(
  (cur, acc) => acc.concat(cur),
  [],
);

export { FRAMEWORKS, TEMPLATES };
