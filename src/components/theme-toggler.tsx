
"use client";

import * as React from "react";
import { useTheme } from "next-themes";

interface CustomSwitchProps {
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function CustomSwitch({ checked, onChange }: CustomSwitchProps) {
  return (
    <label className="ui-switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <div className="slider">
        <div className="circle"></div>
      </div>
    </label>
  );
}


export function ThemeToggler() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDarkMode = theme === "dark";

  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTheme(event.target.checked ? "dark" : "light");
  };

  return (
    <CustomSwitch 
      checked={isDarkMode}
      onChange={handleThemeChange}
    />
  );
}
