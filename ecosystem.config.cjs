module.exports = {
  apps: [
    {
      name: "lecture-lens",
      script: "./node_modules/tsx/dist/cli.mjs",
      args: "server.ts",
      cwd: "D:/LectureLens",
      watch: false,
      windowsHide: true,
      interpreter: "node",
      env: {
        NODE_ENV: "development",
      }
    }
  ]
};
