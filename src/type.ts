export type ColorFunc = (str: string | number) => string;

export type Framework = {
  value: string;
  label: string;
  color: ColorFunc;
  disabled?: boolean;
  hint?: string;
  variants: FrameworkVariant[];
};

export type FrameworkVariant = {
  repo?: string;
} & Omit<Framework, 'variants'>;
