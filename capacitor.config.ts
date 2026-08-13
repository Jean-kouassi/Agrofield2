import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "bf.agrosphere.app",
  appName: "AgroSphere",
  webDir: ".output/public",
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#2f6b3a",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    CapacitorHttp: { enabled: true },
    Camera: {
      permissions: ["camera", "photos"],
    },
    Geolocation: {
      permissions: ["location"],
    },
  },
};

export default config;
