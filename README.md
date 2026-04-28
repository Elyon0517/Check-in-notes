# Check-in-notes

本地优先的「子弹」习惯 / 任务完成应用（Expo + React Native + TypeScript）。需求说明见仓库根目录的 `Discovery.md`。

## 运行

```bash
npm install
npm run start
```

然后按终端提示在 iOS 模拟器、Android 模拟器或 Expo Go 中打开。

- `npm run ios` — 打开 iOS
- `npm run android` — 打开 Android
- `npm run web` — Web（需已配置 `metro.config.js` 中的 `.wasm` 与 COOP/COEP；SQLite 在 Web 上为 alpha，仍以 iOS/Android 为主）

## 自动化测试（Jest）

```bash
npm test
```

监听文件改动反复跑：

```bash
npm run test:watch
```

首次若修改了组件快照，可执行：

```bash
npm test -- -u
```

## 技术栈

Expo Router、SQLite（`expo-sqlite`）、Zustand、`date-fns`、`expo-notifications`；数据层为 repository + service，便于后续接 Supabase。
