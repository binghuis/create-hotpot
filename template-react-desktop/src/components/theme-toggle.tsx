import { Button, Dropdown } from "antd";
import { useEffect, useState } from "react";
import { IconSun, IconMoon, IconBrightnessHalf } from "@tabler/icons-react";
import store from "store2";

export enum Theme {
  Auto = "auto",
  Dark = "dark",
  Light = "light",
}

const renderIcon = (theme: Theme) => {
  switch (theme) {
    case Theme.Auto:
      return <IconBrightnessHalf size="20" />;
    case Theme.Dark:
      return <IconMoon size="20" />;
    default:
      return <IconSun size="20" />;
  }
};

interface ThemeToggleProps {
  onChange: (theme: Theme) => void;
}

const ThemeToggle = (props: ThemeToggleProps) => {
  const [theme, setTheme] = useState<Theme>(store.get("theme") ?? Theme.Auto);

  useEffect(() => {
    props?.onChange(theme);
    store.set("theme", theme);
  }, [theme]);

  return (
    <Dropdown
      menu={{
        onSelect: (e) => {
          const theme = e.key as Theme;
          setTheme(theme);
        },
        items: [
          {
            key: Theme.Dark,
            label: "暗色主题",
            icon: renderIcon(Theme.Dark),
          },
          {
            key: Theme.Light,
            label: "亮色主题",
            icon: renderIcon(Theme.Light),
          },
          {
            key: Theme.Auto,
            label: "跟随系统",
            icon: renderIcon(Theme.Auto),
          },
        ],
        selectable: true,
        selectedKeys: [theme],
      }}
    >
      <Button
        className="flex justify-center items-center w-auto h-auto p-1"
        icon={renderIcon(theme)}
      />
    </Dropdown>
  );
};

export default ThemeToggle;
