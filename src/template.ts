import { Framework, ValidFramework, ValidFrameworkVariant } from './type';

const _FRAMEWORKS: Framework[] = [
  {
    label: 'React',
    value: 'react',
    variants: [
      {
        label: 'React + Vite + AntD',
        hint: 'SPA Web',
        value: 'react-vite',
        repo: 'binghuis/tmpl-react-vite',
      },
    ],
  },
  {
    label: 'Next.js',
    value: 'nextjs',
    variants: [
      {
        label: 'Next.js + NextUI',
        hint: 'SSR Web',
        value: 'nextjs-nextui',
        repo: 'binghuis/tmpl-nextjs',
      },
    ],
  },
  {
    label: 'NestJS',
    value: 'nestjs',
    variants: [
      {
        label: 'Basic NestJS',
        value: 'nestjs-basic',
        hint: 'API Server',
        repo: 'binghuis/tmpl-nestjs',
      },
    ],
  },
];

const FRAMEWORKS = _FRAMEWORKS.filter(
  (framework) => !framework.disabled && framework.variants.some((v) => !v.disabled && v.repo),
) as ValidFramework[];

const FRAMEWORK_TEMPLATE = FRAMEWORKS.reduce(
  (acc, cur) => {
    acc[cur.value] = cur.variants;
    return acc;
  },
  {} as Record<string, ValidFrameworkVariant[]>,
);

const TEMPLATES = Object.values(FRAMEWORK_TEMPLATE).reduce((acc, cur) => acc.concat(cur), []);
const TEMPLATE_NAMES = TEMPLATES.map((t) => t.value);

export { FRAMEWORKS, FRAMEWORK_TEMPLATE, TEMPLATES, TEMPLATE_NAMES };
