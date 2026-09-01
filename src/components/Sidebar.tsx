import {
  CalendarDays,
  Clock,
  GraduationCap,
  Languages,
  ListTodo,
  Moon,
  NotebookPen,
  Settings as SettingsIcon,
  Sun,
} from "lucide-react";
import type { Dict } from "../i18n";
import type { Lang, Page, Theme } from "../types";

interface SidebarProps {
  page: Page;
  onNavigate: (page: Page) => void;
  t: Dict;
  lang: Lang;
  onToggleLang: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const ITEMS: { id: Page; icon: typeof ListTodo }[] = [
  { id: "today", icon: ListTodo },
  { id: "week", icon: CalendarDays },
  { id: "notes", icon: NotebookPen },
  { id: "work", icon: Clock },
  { id: "study", icon: GraduationCap },
  { id: "settings", icon: SettingsIcon },
];

export default function Sidebar({
  page,
  onNavigate,
  t,
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
}: SidebarProps) {
  return (
    <>
      <aside className="hidden md:flex w-56 shrink-0 flex-col gap-6 border-r border-line bg-surface p-5">
        <h1 className="text-xl font-bold">{t.appName}</h1>

        <nav className="flex-1 space-y-1">
          {ITEMS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              aria-current={page === id ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm transition hover:bg-surface-2 ${
                page === id ? "bg-surface-2 font-semibold" : ""
              }`}
            >
              <Icon size={18} />
              {t.nav[id]}
            </button>
          ))}
        </nav>

        <div className="space-y-1 border-t border-line pt-3">
          <button
            onClick={onToggleLang}
            className="flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm hover:bg-surface-2"
          >
            <Languages size={18} />
            {lang === "de" ? "English" : "Deutsch"}
          </button>
          <button
            onClick={onToggleTheme}
            className="flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm hover:bg-surface-2"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {theme === "dark" ? t.settings.light : t.settings.dark}
          </button>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {ITEMS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            aria-current={page === id ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] ${
              page === id ? "text-blue-500" : "text-muted"
            }`}
          >
            <Icon size={20} />
            {t.nav[id]}
          </button>
        ))}
      </nav>
    </>
  );
}
