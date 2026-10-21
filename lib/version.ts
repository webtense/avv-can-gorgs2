export interface VersionInfo {
  version: string;
  buildId: string;
  buildTime: string;
}

export function getVersion(): VersionInfo {
  const version = '0.2.0'; // lee de package.json en build
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID || 'dev-local';
  const buildTime = process.env.BUILD_TIME || new Date().toISOString();
  return { version, buildId, buildTime };
}
