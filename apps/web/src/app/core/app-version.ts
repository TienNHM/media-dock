import pkg from '../../../package.json';

/** Display label for the web UI (footer). Source of truth: `apps/web/package.json` → `version`. */
export const appVersionLabel = pkg.version.startsWith('v') ? pkg.version : `v${pkg.version}`;
