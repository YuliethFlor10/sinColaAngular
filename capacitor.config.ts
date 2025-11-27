import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sinCola.miapp',
  appName: 'sinCola',
  webDir: 'dist/sinColaAngular/browser',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['*']
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#FF5722",
      sound: "beep.wav"
    },
    StatusBar: {
      style: 'light', // Texto oscuro para fondo blanco
      backgroundColor: '#ffffff', // Fondo blanco
      overlaysWebView: false // No superponer sobre el contenido
    }
  }
};

export default config;
