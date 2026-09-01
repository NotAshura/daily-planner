import {
  Briefcase,
  CalendarDays,
  Clock,
  GraduationCap,
  House,
  Languages,
  ListTodo,
  Moon,
  NotebookPen,
  Settings as SettingsIcon,
  Sun,
} from "lucide-react";
import type { Dict } from "../i18n";
import type { Lang, Page, Theme, Workspace } from "../types";

interface SidebarProps {
  page: Page;
  onNavigate: (page: Page) => void;
  t: Dict;
  workspace: Workspace;
  onToggleWorkspace: () => void;
  lang: Lang;
  onToggleLang: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

/** `only` limits an entry to one workspace; the rest show up in both. */
const ITEMS: { id: Page; icon: typeof ListTodo; only?: Workspace }[] = [
  { id: "today", icon: ListTodo },
  { id: "week", icon: CalendarDays },
  { id: "notes", icon: NotebookPen },
  { id: "work", icon: Clock, only: "work" },
  { id: "study", icon: GraduationCap, only: "private" },
  { id: "settings", icon: SettingsIcon },
];

export default function Sidebar({
  page,
  onNavigate,
  t,
  workspace,
  onToggleWorkspace,
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
}: SidebarProps) {
  const items = ITEMS.filter((item) => !item.only || item.only === workspace);
  const WorkspaceIcon = workspace === "work" ? Briefcase : House;

  return (
    <>
      <aside className="hidden md:flex w-56 shrink-0 flex-col gap-6 border-r border-line bg-surface p-5">
        <h1 className="text-xl font-bold">{t.appName}</h1>

        <button
          onClick={onToggleWorkspace}
          title={t.workspace.switch}
          className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 p-3 text-left text-sm hover:border-blue-500"
        >
          <WorkspaceIcon size={18} />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{t.workspace[workspace]}</span>
            <span className="block text-xs text-muted">{t.workspace.switch}</span>
          </span>
        </button>

        <nav className="flex-1 space-y-1">
          {items.map(({ id, icon: Icon }) => (
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
        <button
          onClick={onToggleWorkspace}
          aria-label={t.workspace.switch}
          className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] text-muted"
        >
          <WorkspaceIcon size={20} />
          {t.workspace[workspace]}
        </button>
        {items.map(({ id, icon: Icon }) => (
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
