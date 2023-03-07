import { ConfigProvider, theme } from "antd";
import { useMemo, useState } from "react";
import "./App.css";
import ThemeToggle, { Theme } from "./components/theme-toggle";
import useMediaQuery from "./hooks/use-media-query";
import DemoPage from "./pages/demo-page";

const { darkAlgorithm, compactAlgorithm, defaultAlgorithm } = theme;

type ColorAlgorithmType = typeof darkAlgorithm | typeof defaultAlgorithm;

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

function App() {
  const [colorScheme, setColorScheme] = useState<Theme>();
  const isDarkMode = useMediaQuery(COLOR_SCHEME_QUERY);

  const colorAlgorithm: ColorAlgorithmType = useMemo(() => {
    switch (colorScheme) {
      case Theme.Auto:
        return isDarkMode ? darkAlgorithm : defaultAlgorithm;
      case Theme.Dark:
        return darkAlgorithm;
      default:
        return defaultAlgorithm;
    }
  }, [colorScheme, isDarkMode]);

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
      <ThemeToggle onChange={setColorScheme} />
      <DemoPage />
    </ConfigProvider>
  );
}

export default App;
