import { Image, Layout, Menu } from "antd";
import { Outlet } from "react-router-dom";
import ResizePane from "./components/resize-pane";
import Logo from "@/assets/react.svg";
import { IconUserCircle } from "@tabler/icons-react";

import "./App.css";

function App() {
  return (
    <Layout className="w-screen h-screen">
      <Layout.Header className="site-header h-14 p-0 pl-8 pr-2 flex items-center justify-between bg-white">
        <div
          className="w-44 h-full cursor-pointer flex items-center"
          onClick={() => {}}
        >
          <Image src={Logo} width="80" preview={false} />
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
  );
}

export default App;
