import { ConfigProvider, theme } from "antd";

const { darkAlgorithm, compactAlgorithm, defaultAlgorithm } = theme;
import "./App.css";
import DemoPage from "./pages/demo-page";

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: [compactAlgorithm, darkAlgorithm],
        token: {},
        components: {
          Button: {},
        },
      }}
    >
      <DemoPage />
    </ConfigProvider>
  );
}

export default App;
