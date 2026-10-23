const config: any = {
  appId: 'mw.educate.app',
  appName: 'Educate MW',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#1e3a8a',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2200,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#1e3a8a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
