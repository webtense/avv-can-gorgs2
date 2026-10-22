import packageJson from '../package.json';

export interface VersionInfo {
  version: string;
  buildId: string;
  buildTime: string;
}

export function getVersion(): VersionInfo {
  const version = packageJson.version;
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID || 'dev-local';
  const buildTime = process.env.BUILD_TIME || new Date().toISOString();
  return { version, buildId, buildTime };
}
