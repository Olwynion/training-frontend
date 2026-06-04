import { createContext, useContext, type ReactNode } from 'react';
import ru from '../locales/ru';
import type { Locale } from '../locales/ru';

const t: Locale = ru;
const LocaleContext = createContext<Locale>(t);

export function LocaleProvider({ children }: { children: ReactNode }) {
  return <LocaleContext.Provider value={t}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
export default t;
