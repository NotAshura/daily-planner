/// <reference types="vite/client" />

/** Injected from package.json by vite.config.ts. */
declare const __APP_VERSION__: string;

type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "latest"
  | "downloading"
  | "downloaded"
  | "installing"
  | "error"
  | "unsupported";

interface UpdateStatus {
  state: UpdateState;
  version?: string;
  percent?: number;
  message?: string;
}

/** Exposed by electron/preload.cjs – absent in the browser and PWA build. */
interface PlannerUpdater {
  check: () => Promise<UpdateStatus>;
  download: () => Promise<UpdateStatus>;
  install: () => Promise<UpdateStatus>;
  onStatus: (callback: (status: UpdateStatus) => void) => () => void;
}

interface Window {
  plannerUpdater?: PlannerUpdater;
}
