import kleur from 'kleur';
import { Framework, FrameworkVariant } from './type';

const _FRAMEWORKS: Framework[] = [
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

const FRAMEWORKS = _FRAMEWORKS.filter((framework) => !framework.disabled && framework.variants.length > 0);

const FRAMEWORK_TEMPLATE = FRAMEWORKS.reduce((acc, cur) => {
  const _cur = cur.variants.filter((v) => !v.disabled && v.repo);
  if (_cur.length) {
    acc[cur.value] = _cur;
  }
  return acc;
}, {} as Record<string, FrameworkVariant[]>);

const TEMPLATES = Object.values(FRAMEWORK_TEMPLATE).reduce((acc, cur) => acc.concat(cur), []);
const TEMPLATE_NAMES = TEMPLATES.map((t) => t.value);

export { FRAMEWORKS, TEMPLATES, TEMPLATE_NAMES, FRAMEWORK_TEMPLATE };
