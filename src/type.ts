export type ColorFunc = (str: string | number) => string;

export type Framework = {
  value: string;
  title: string;
  color: ColorFunc;
  disabled?: boolean;
  description?: string;
  variants: FrameworkVariant[];
};

export type FrameworkVariant = {
  repo?: string;
} & Omit<Framework, 'variants'>;
