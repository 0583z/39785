# 高校竞赛中心 (College Competition Hub) - 微信小程序版

## 🚀 项目简介
本项目是专门为大学生打造的竞赛信息聚合平台，旨在通过极致的可视化和硬件级交互（如翻转专注模式）解决备赛期间的“内卷”与“诱惑”痛点。

## 📁 目录结构说明
- `/miniprogram`: 小程序核心代码根目录
  - `/pages`: 页面文件
  - `/components`: 组件库
  - `/utils`: 工具类函数
  - `/data`: Mock 数据中心
  - `/assets`: 静态资源

## 🛠️ 开发指南 (针对团队成员)
1. **环境准备**：下载并安装最新版 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
2. **导入项目**：打开工具，选择“导入项目”，目录指向本项目根目录（包含 `project.config.json` 的目录）。
3. **AppID 说明**：测试阶段请使用“测试号”或个人 AppID。
4. **规范要求**：
   - 严禁使用任何 `div`/`span` 等 Web 标签，必须使用 `view`/`text`。
   - 所有样式优先使用 `rpx` 作为单位。
   - 提交代码前确保没有 WXML 编译错误。

## 📅 版本记录
- v1.0.0 基础框架搭建，Profile 页面原生化迁移完成。
