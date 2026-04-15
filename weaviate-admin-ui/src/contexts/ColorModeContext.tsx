import React, { createContext, useContext, useMemo, useState } from 'react';

interface ColorModeContextType {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
}

export const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

export const ColorModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stored = (localStorage.getItem('weaviate_color_mode') as 'light' | 'dark') || 'light';
  const [mode, setMode] = useState<'light' | 'dark'>(stored);

  const value = useMemo(
    () => ({
      mode,
      toggleColorMode: () =>
        setMode((prev) => {
          const next = prev === 'light' ? 'dark' : 'light';
          localStorage.setItem('weaviate_color_mode', next);
          return next;
        }),
    }),
    [mode],
  );

  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>;
};
