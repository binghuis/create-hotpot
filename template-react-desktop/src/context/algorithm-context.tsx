import { ConfigProvider, theme } from "antd";
import { createContext, PropsWithChildren, useState } from "react";

const AlgorithmContext: React.FC<PropsWithChildren> = ({ children }) => {
  const { darkAlgorithm, compactAlgorithm, defaultAlgorithm } = theme;
  type ColorAlgorithmType = typeof darkAlgorithm | typeof defaultAlgorithm;

  const [colorAlgorithm, setColorAlgorithm] =
    useState<ColorAlgorithmType>(defaultAlgorithm);

  const AlgorithmContext = createContext<{
    colorAlgorithm: ColorAlgorithmType;
    setColorAlgorithm: (params: ColorAlgorithmType) => void;
  } | null>(null);

  const toggleTheme = () => {};

  return (
    <ConfigProvider
      theme={{
        algorithm: [compactAlgorithm, colorAlgorithm],
        token: {},
        components: {
          Button: {},
        },
      }}
    >
      <AlgorithmContext.Provider value={{ colorAlgorithm, setColorAlgorithm }}>
        {children}
      </AlgorithmContext.Provider>
    </ConfigProvider>
  );
};

export default AlgorithmContext;
