import { useEffect, useRef, useState } from "react";
import { Download, Moon, RefreshCw, Sun, Trash2, Upload } from "lucide-react";
import type { Dict } from "../i18n";
import type { Lang, Settings, Theme } from "../types";

interface SettingsPageProps {
  settings: Settings;
  t: Dict;
  onChange: (patch: Partial<Settings>) => void;
  onResetToday: () => void;
  onClearAll: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onInstall: (() => void) | null;
}

export default function SettingsPage({
  settings,
  t,
  onChange,
  onResetToday,
  onClearAll,
  onExportData,
  onImportData,
  onInstall,
}: SettingsPageProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const updater = window.plannerUpdater;
  const [update, setUpdate] = useState<UpdateStatus>({ state: "idle" });

  useEffect(() => updater?.onStatus(setUpdate), [updater]);

  const updateMessage = (() => {
    switch (update.state) {
      case "checking":
        return t.settings.updateChecking;
      case "available":
        return t.settings.updateAvailable(update.version ?? "?");
      case "latest":
        return t.settings.updateLatest;
      case "downloading":
        return t.settings.updateDownloading(update.percent ?? 0);
      case "downloaded":
        return t.settings.updateDownloaded;
      case "installing":
        return t.settings.updateInstalling;
      case "error":
        return update.message ? `${t.settings.updateError} (${update.message})` : t.settings.updateError;
      case "unsupported":
        return t.settings.updateUnsupported;
      default:
        return null;
    }
  })();

  const busy = update.state === "checking" || update.state === "downloading";

  const themeButton = (value: Theme, label: string, Icon: typeof Sun) => (
    <button
      onClick={() => onChange({ theme: value })}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
        settings.theme === value ? "border-blue-500 bg-blue-500/10" : "border-line hover:bg-surface-2"
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  const langButton = (value: Lang, label: string) => (
    <button
      onClick={() => onChange({ lang: value })}
      className={`rounded-lg border px-3 py-2 text-sm ${
        settings.lang === value ? "border-blue-500 bg-blue-500/10" : "border-line hover:bg-surface-2"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">{t.settings.title}</h2>

      <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
        <h3 className="font-semibold">{t.settings.appearance}</h3>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm">{t.settings.language}</span>
          <div className="flex gap-2">
            {langButton("de", "Deutsch")}
            {langButton("en", "English")}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm">{t.settings.theme}</span>
          <div className="flex gap-2">
            {themeButton("dark", t.settings.dark, Moon)}
            {themeButton("light", t.settings.light, Sun)}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
        <h3 className="font-semibold">{t.workspace.switch}</h3>

        <div className="flex flex-wrap gap-2">
          {(["work", "private"] as const).map((value) => (
            <button
              key={value}
              onClick={() => onChange({ workspace: value })}
              className={`rounded-lg border px-3 py-2 text-sm ${
                (settings.workspace ?? "work") === value
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-line hover:bg-surface-2"
              }`}
            >
              {t.workspace[value]}
            </button>
          ))}
        </div>

        <p className="text-xs leading-relaxed text-muted">{t.workspace.hint}</p>
      </section>

      <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
        <h3 className="font-semibold">{t.settings.worktime}</h3>

        <label className="flex items-center justify-between gap-3 text-sm">
          {t.settings.autoBreak}
          <input
            type="checkbox"
            checked={settings.autoBreak}
            onChange={(e) => onChange({ autoBreak: e.target.checked })}
            className="h-4 w-4"
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-sm">
          {t.settings.autoBreakMin}
          <input
            type="number"
            min={0}
            step={5}
            value={settings.autoBreakMin}
            onChange={(e) => onChange({ autoBreakMin: Math.max(0, Number(e.target.value)) })}
            className="w-24 rounded border border-line bg-surface-2 p-2"
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-sm">
          {t.settings.autoBreakAfterHours}
          <input
            type="number"
            min={0}
            step={0.5}
            value={settings.autoBreakAfterHours}
            onChange={(e) => onChange({ autoBreakAfterHours: Math.max(0, Number(e.target.value)) })}
            className="w-24 rounded border border-line bg-surface-2 p-2"
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-sm">
          {t.settings.targetHours}
          <input
            type="number"
            min={0}
            max={24}
            step={0.25}
            value={settings.targetHoursPerDay}
            onChange={(e) => onChange({ targetHoursPerDay: Math.max(0, Number(e.target.value)) })}
            className="w-24 rounded border border-line bg-surface-2 p-2"
          />
        </label>
      </section>

      <section className="space-y-3 rounded-xl border border-line bg-surface p-5">
        <h3 className="font-semibold">{t.settings.data}</h3>

        <button
          onClick={onResetToday}
          className="w-full rounded-lg border border-line px-4 py-2 text-sm hover:bg-surface-2"
        >
          {t.settings.resetToday}
        </button>

        <button
          onClick={() => {
            if (window.confirm(t.settings.clearConfirm)) onClearAll();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10"
        >
          <Trash2 size={16} /> {t.settings.clearAll}
        </button>

        <p className="text-xs leading-relaxed text-muted">{t.settings.storageInfo}</p>
      </section>

      <section className="space-y-3 rounded-xl border border-line bg-surface p-5">
        <h3 className="font-semibold">{t.settings.backup}</h3>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onExportData}
            className="flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm hover:bg-surface-2"
          >
            <Download size={16} /> {t.settings.exportData}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm hover:bg-surface-2"
          >
            <Upload size={16} /> {t.settings.importData}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onImportData(file);
            }}
          />
        </div>

        <p className="text-xs leading-relaxed text-muted">{t.settings.backupHint}</p>
      </section>

      <section className="space-y-3 rounded-xl border border-line bg-surface p-5">
        <h3 className="font-semibold">PWA</h3>
        {onInstall ? (
          <button
            onClick={onInstall}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            <Download size={16} /> {t.settings.install}
          </button>
        ) : (
          <p className="text-xs text-muted">{t.settings.installHint}</p>
        )}
      </section>

      <section className="space-y-2 rounded-xl border border-line bg-surface p-5">
        <h3 className="font-semibold">{t.settings.about}</h3>
        <p className="text-sm">
          {t.settings.version} <span className="font-mono">{__APP_VERSION__}</span>
        </p>

        {updater && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => {
                setUpdate({ state: "checking" });
                void updater.check().then(setUpdate);
              }}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm hover:bg-surface-2 disabled:opacity-50"
            >
              <RefreshCw size={16} className={update.state === "checking" ? "animate-spin" : ""} />
              {t.settings.checkUpdate}
            </button>

            {update.state === "available" && (
              <button
                onClick={() => {
                  setUpdate({ state: "downloading", percent: 0 });
                  void updater.download().then(setUpdate);
                }}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                <Download size={16} /> {t.settings.downloadUpdate}
              </button>
            )}

            {update.state === "downloaded" && (
              <button
                onClick={() => {
                  setUpdate({ state: "installing" });
                  void updater.install();
                }}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
              >
                <RefreshCw size={16} /> {t.settings.installUpdate}
              </button>
            )}
          </div>
        )}

        {updateMessage && <p className="text-sm text-muted">{updateMessage}</p>}

        <p className="text-xs leading-relaxed text-muted">{t.settings.updateHint}</p>
      </section>
    </div>
  );
}
