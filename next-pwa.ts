declare module 'next-pwa' {
  import type { NextConfig } from 'next';

  type PWAOptions = {
    dest: string;
    name: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    scope?: string;
    
   sw?: string;
    runtimeCaching?: any[];
    buildExcludes?: string[];
    [key: string]: any;
  };

  const withPWA: (options: PWAOptions) => (nextConfig: NextConfig) => NextConfig;

  export default withPWA;
}
