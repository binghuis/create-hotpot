import { ConfigProvider, Image, Layout, Menu, theme } from "antd";
import { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import "./App.css";
import ResizePane from "./components/resize-pane";
import ThemeToggle, { Theme } from "./components/theme-toggle";
import useMediaQuery from "./hooks/use-media-query";
import Logo from "@/assets/react.svg";
import { IconUserCircle } from "@tabler/icons-react";

const { darkAlgorithm, compactAlgorithm, defaultAlgorithm } = theme;

type ColorAlgorithmType = typeof darkAlgorithm | typeof defaultAlgorithm;

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

const { useToken } = theme;

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

  const { token } = useToken();
  console.log(token);

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
      <Layout className="w-screen h-screen">
        <Layout.Header className="site-header h-14 p-0 pl-8 pr-2 flex items-center justify-between bg-transparent">
          <div
            className="w-44 h-full cursor-pointer flex items-center"
            onClick={() => {}}
          >
            <Image src={Logo} width="80" preview={false} />
          </div>
          <div>
            <ThemeToggle onChange={setColorScheme} />
          </div>
        </Layout.Header>
        <Layout>
          <ResizePane
            leftPane={
              <Layout.Sider width={"100%"}>
                <Menu
                  mode="inline"
                  className="h-[calc(100vh-theme(space.14))] border-r-0 pt-1"
                  items={[
                    {
                      label: "Dashboard",
                      icon: <IconUserCircle size={16} />,
                      key: "dashboard",
                    },
                  ]}
                />
              </Layout.Sider>
            }
            leftPaneClassName=""
            rightPane={
              <Layout className="ml-3 mr-3 mt-2 mb-1">
                <Layout.Content className="overflow-y-auto p-2 rounded-sm min-h-min">
                  <Outlet />
                </Layout.Content>
                <footer className="text-center text-gray-300 text-xs p-1">
                  Footer
                </footer>
              </Layout>
            }
            rightPaneClassName="flex flex-col justify-between"
          />
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
