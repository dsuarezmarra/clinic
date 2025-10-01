import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clinica.masaje',
  appName: 'Clínica Masaje Corporal Deportivo',
  webDir: 'dist/clinic-frontend/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;
