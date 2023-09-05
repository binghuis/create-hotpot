import { OverrideProperties } from 'type-fest';

export type Framework = {
  value: string;
  label: string;
  disabled?: boolean;
  hint?: string;
  variants: FrameworkVariant[];
};

export type FrameworkVariant = {
  repo?: string;
} & Omit<Framework, 'variants'>;

export type ValidFramework = OverrideProperties<Framework, { disabled?: false; variants: ValidFrameworkVariant[] }>;
export type ValidFrameworkVariant = OverrideProperties<FrameworkVariant, { disabled?: false; repo: string }>;
