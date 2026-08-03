# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 Vue 3 + TypeScript + Vite 的单页面应用，使用 Vue Router 进行路由管理。项目源码位于 `source/` 目录，构建输出直接生成到根目录。

## 常用命令

所有命令需要在 `source/` 目录下执行：

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目架构

### 目录结构

```
source/
├── src/
│   ├── main.ts          # 应用入口，创建 Vue 实例并挂载路由
│   ├── App.vue          # 根组件，包含 router-view
│   ├── router/          # 路由配置
│   │   └── index.ts     # 使用 Hash 模式的路由定义
│   ├── views/           # 页面组件
│   │   ├── home/        # 首页模块
│   │   └── user/        # 用户页面模块
│   └── components/      # 可复用组件
├── vite.config.ts       # Vite 配置，包含路径别名设置
└── tsconfig.json        # TypeScript 配置
```

### 关键技术细节

1. **路径别名**: `@` 映射到 `src/` 目录，在 `vite.config.ts` 和 `tsconfig.json` 中配置

2. **路由模式**: 使用 `createWebHashHistory()` (Hash 模式)，适合 GitHub Pages 部署

3. **构建输出**: `vite.config.ts` 中 `outDir: "../"` 将构建产物输出到项目根目录

4. **样式支持**: 项目已配置 Sass，可在 Vue SFC 中使用 `<style scoped lang="scss">`

5. **类型检查**: 使用 `vue-tsc` 进行 Vue 组件的类型检查

### 开发规范

- 组件使用 `<script setup lang="ts">` 语法
- 页面组件按功能模块组织在 `views/` 目录下
- 路由采用懒加载 (`() => import(...)`) 优化性能
