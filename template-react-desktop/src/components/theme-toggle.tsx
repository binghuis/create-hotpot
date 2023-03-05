import { Button, Dropdown } from "antd";
import { useState } from "react";
import { IconSun, IconMoon, IconBrightnessHalf } from "@tabler/icons-react";

export enum Theme {
  Auto = "auto",
  Dark = "dark",
  Light = "light",
}

const renderIcon = (theme: Theme) => {
  switch (theme) {
    case Theme.Dark:
      return <IconMoon size="20" />;
    case Theme.Light:
      return <IconSun size="20" />;
    default:
      return <IconBrightnessHalf size="20" />;
  }
};

const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>(Theme.Auto);

  return (
    <Dropdown
      menu={{
        onSelect: (e) => {
          setTheme(e.key as Theme);
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
      <Button className="flex justify-center items-center w-auto h-auto p-1" icon={renderIcon(theme)} />
    </Dropdown>
  );
};

export default ThemeToggle;
