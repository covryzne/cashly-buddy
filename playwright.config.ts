import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  use: {
    launchOptions: {
      args: [
        "--enable-unsafe-swiftshader",
        "--use-fake-device-for-media-stream",
      ],
    },
    baseURL: "http://127.0.0.1:3127",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3127",
    url: "http://127.0.0.1:3127",
    reuseExistingServer: false,
  },
});
