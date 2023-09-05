import { Framework, ValidFramework, ValidFrameworkVariant } from './type';

const _FRAMEWORKS: Framework[] = [
  {
    label: 'React',
    value: 'react',
    variants: [
      {
        label: 'Admin Dashboard System',
        hint: '管理后台',
        value: 'react-admin',
        repo: 'binghuis/template-react-desktop',
      },
    ],
  },
  {
    label: 'NextJs',
    value: 'nextjs',
    variants: [
      {
        label: 'Web App (SSR)',
        value: 'nextjs-app',
        repo: 'binghuis/template-nextjs',
      },
    ],
  },
  {
    label: 'Vue',
    value: 'vue',
    variants: [
      {
        label: 'Big Screen (Echarts)',
        value: 'vue-big-screen',
        disabled: true,
      },
    ],
  },
];

const FRAMEWORKS = _FRAMEWORKS.filter(
  (framework) => !framework.disabled && framework.variants.some((v) => !v.disabled && v.repo),
) as ValidFramework[];

const FRAMEWORK_TEMPLATE = FRAMEWORKS.reduce((acc, cur) => {
  acc[cur.value] = cur.variants;
  return acc;
}, {} as Record<string, ValidFrameworkVariant[]>);

const TEMPLATES = Object.values(FRAMEWORK_TEMPLATE).reduce((acc, cur) => acc.concat(cur), []);
const TEMPLATE_NAMES = TEMPLATES.map((t) => t.value);

export { FRAMEWORKS, TEMPLATES, TEMPLATE_NAMES, FRAMEWORK_TEMPLATE };
