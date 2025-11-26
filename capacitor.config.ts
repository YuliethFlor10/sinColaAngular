import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sinCola.miapp',
  appName: 'sinCola',
  webDir: 'dist/sinColaAngular/browser',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#FF5722",
      sound: "beep.wav"
    }
  }
};

export default config;
