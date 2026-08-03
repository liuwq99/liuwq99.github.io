# 17天背完GRE - 双端学习工具 技术方案

## Context

用户希望基于《17天背完GRE》的艾宾浩斯遗忘曲线记忆法，开发一个双端学习工具：
- **PC 端**：通过 Claude Code 终端交互学习（Skill 方式），数据直接写入本地 JSON 文件
- **手机端**：通过 GitHub Pages 网页学习（Vue 应用），数据通过文件导入导出持久化

两端共享 `source/src/views/home/data/chengyu/` 目录下的数据文件。PC 端学习后数据直接持久化到文件，构建部署后手机端也能看到更新。

**用户确认的关键决策：**
- PC 端通过 Skill 实现（`.claude/skills/` 下的 Markdown 文件）
- 手机端通过 Vue + Vant Web 应用实现
- 数据持久化：PC 端直接写文件；手机端仅文件导入导出
- 学习卡片交互：手机端滑动判断（左滑=没记住，右滑=记住了）
- 实词模块：与成语模块完全对称

---

## 双端架构总览

```
                    ┌─────────────────────────────────────┐
                    │   chengyu/ (分片数据目录)              │
                    │   source/src/views/home/data/        │
                    │   ├── index.json (学习计划索引)        │
                    │   ├── group-1.json (第1组成语)         │
                    │   └── group-N.json ...                │
                    └──────────┬──────────┬────────────────┘
                               │          │
                    ┌──────────▼──┐  ┌────▼───────────┐
                    │  PC 端 Skill │  │  手机端 Vue App │
                    │  (终端交互)  │  │  (浏览器 UI)    │
                    │             │  │                 │
                    │ /learn-today│  │ 滑动卡片学习     │
                    │ Claude 引导 │  │ Vant 组件交互    │
                    │ Edit 写文件 │  │ 导入/导出 JSON   │
                    └─────────────┘  └─────────────────┘
```

---

## Part 1: PC 端 — Claude Code Skill

### Skill 文件

**位置**: `.claude/skills/learn-today/SKILL.md`

**功能**: 用户在终端输入 `/learn-today`，Claude Code 引导成语学习流程

**流程**:
1. 读取 `source/src/views/home/data/chengyu/index.json`，查 `plan[今天]` 获取今日学习计划
2. 按需读取涉及的 `group-N.json` 文件
3. 展示学习选项：今日新学 / 复习已学 / 查看错词
4. 根据选择进入对应模式：
   - **新学模式**：逐一展示成语完整信息（成语→拼音→释义→例句→记忆技巧），不出测试题
   - **复习模式**：只展示成语名+拼音，用户自评记住/没记住
   - **错词模式**：展示 wrongCount > 0 的成语，重新学习
5. 学习结束后，用 Edit 工具更新 `group-N.json` 中的 `wrongCount`（不需要 Edit index.json）
6. 输出学习统计

### 数据文件结构（分片版）

```
source/src/views/home/data/chengyu/
├── index.json          # 学习计划索引
├── group-1.json        # 第1组成语（20条）
├── group-2.json        # 第2组成语（20条）
└── ...
```

**index.json**（学习计划索引）：
```json
{
  "total": 100,
  "perGroup": 20,
  "plan": {
    "2026-07-27": {
      "learnPlan": [1],
      "reviewPlan": ["1T12h"]
    },
    "2026-07-28": {
      "learnPlan": [2],
      "reviewPlan": [1, "2T12h"]
    }
  }
}
```

**group-N.json**（成语数据）：
```json
{
  "group": 1,
  "datas": [
    {
      "word": "拔苗助长",
      "explain": "比喻违反事物发展的客观规律，急于求成，反而把事情弄糟。",
      "pinyin": "bá miáo zhù zhǎng",
      "origin": "《孟子·公孙丑上》",
      "sentence": ["他急于求成，反而拔苗助长。"],
      "easy": ["想象一个人把禾苗往上拔，想让它长高，结果苗反而枯死了"],
      "wrongCount": 0
    }
  ]
}
```

设计要点：
- **职责分离**：index.json 只管计划，group-N.json 只存数据
- **计划即进度**：不需要 learnedDate/toLearnDate，严格按 plan 执行
- **按需读写**：Skill 只读当天涉及的 group 文件，只 Edit 有 wrongCount 变化的文件
- **index.json 不需要更新**：plan 是预计算的静态计划

### Skill 交互示例

```
用户: /learn-idiom

Claude: 📚 成语学习助手
━━━━━━━━━━━━━━━━━━
当前进度：已学 5/100 个成语 | 今日待学：3 个新词 + 2 个复习

请选择：
1. 🆕 今日新学 (3个)
2. 🔄 复习已学 (2个)
3. ❌ 错词重学 (1个)
4. 📊 查看统计

用户: 1

Claude: 📖 第 1/3 个成语

【拔苗助长】bá miáo zhù zhǎng

释义：比喻违反事物发展的客观规律，急于求成，反而把事情弄糟。

记忆技巧：想象一个人把禾苗往上拔，想让它长高，结果苗反而枯死了

---
测试：以下哪个是"拔苗助长"的正确含义？
A. 帮助禾苗生长的好方法
B. 违反规律急于求成反而坏事
C. 形容农业技术先进

用户: B

Claude: ✅ 正确！
...继续下一个成语...
```

---

## Part 2: 手机端 — Vue + Vant Web 应用

### 技术栈

| 技术 | 用途 | 状态 |
|------|------|------|
| Vant 4 | 移动端 UI 组件库 | ✅ 已安装 |
| unplugin-auto-import | 自动导入 | ✅ 已安装 |
| postcss-px-to-viewport | px 转 vw 适配 | ✅ 已安装 |
| Pinia | 状态管理 | ❌ 待安装 |

### 目录结构

```
source/src/
├── main.ts                    # 应用入口（注册 Pinia + Router）
├── App.vue                    # 根组件（含底部 Tabbar）
├── router/
│   └── index.ts               # 嵌套路由配置
├── views/
│   ├── home/index.vue         # 首页（成语/实词入口卡片）
│   ├── home/data/             # 数据目录
│   │   ├── chengyu/           # 成语数据（分片）
│   │   │   ├── index.json     # 学习计划索引
│   │   │   └── group-N.json   # 各组成语数据
│   │   └── shici.json         # 实词数据
│   ├── idiom/                 # 成语模块
│   │   ├── index.vue          # 主页（Tab 切换：今日计划/列表/错词）
│   │   ├── TodayPlan.vue      # 今日计划执行页
│   │   ├── IdiomList.vue      # 全部成语列表
│   │   ├── StudyCard.vue      # 学习卡片页
│   │   └── WrongList.vue      # 错词集
│   ├── word/                  # 实词模块（结构同 idiom）
│   └── settings/index.vue     # 设置页（导入/导出/重置）
├── components/
│   ├── StudyCardItem.vue      # 通用学习卡片组件（含滑动交互）
│   └── PlanProgress.vue       # 计划进度条组件
├── stores/
│   ├── index.ts               # Pinia 实例
│   ├── idiomStore.ts          # 成语模块状态
│   └── wordStore.ts           # 实词模块状态
├── utils/
│   ├── ebbinghaus.ts          # 艾宾浩斯 17 天计划算法
│   ├── dataIO.ts              # JSON 文件导出/导入
│   └── date.ts                # 日期工具函数
└── types/
    └── index.ts               # 全局 TypeScript 类型定义
```

### 路由结构

```
/                   → 首页
/idiom              → 成语主页（默认显示今日计划）
  /idiom/list       → 成语列表
  /idiom/wrong      → 错词集
  /idiom/study/:id  → 学习卡片
/word               → 实词主页
  /word/list        → 实词列表
  /word/wrong       → 错词集
  /word/study/:id   → 学习卡片
/settings           → 设置页
```

### 学习卡片交互（手机端滑动判断）

- 卡片正面显示词语 + 拼音
- 点击卡片翻转显示背面（释义 + 例句）
- **右滑** = 记住了 → 标记完成，卡片飞出
- **左滑** = 没记住 → 加入错词集，卡片飞出

### 数据持久化方案（手机端）

**仅文件导入导出**，不使用 localStorage：
- 导出：`Blob` + `URL.createObjectURL` + `<a download>` 触发下载
- 导入：`<input type="file" accept=".json">` + `FileReader` 读取解析
- 应用内状态仅存在于内存中，关闭页面即丢失

---

## 数据模型（双端统一）

```typescript
// 学习计划索引（index.json）
interface LearnIndex {
  total: number;           // 成语总数
  perGroup: number;        // 每组条数
  plan: Record<string, {   // 键=日期 YYYY-MM-DD
    learnPlan: number[];   // 当天要新学的 group 编号
    reviewPlan: (number | string)[]; // 当天要复习的 group，T12h 用 "NT12h" 标记
  }>;
}

// 成语分组数据（group-N.json）
interface GroupData {
  group: number;           // 分组编号
  datas: IdiomItem[];      // 成语数据数组
}

// 成语条目
interface IdiomItem {
  word: string;            // 成语名称
  explain: string;         // 释义
  pinyin: string;          // 拼音
  origin?: string;         // 出处
  sentence: string[];      // 例句
  easy: string[];          // 记忆技巧
  wrongCount: number;      // 答错次数
}
```

---

## 艾宾浩斯遗忘曲线

6 个温习点：**12小时后、1天后、2天后、4天后、7天后、15天后**各温习一遍。

**温习间隔相对于上一次温习计算**，而非首次新学。例如 Group 1（07-27 新学）：
- 07-27 T12h（12h后）
- 07-28（上次温习后1d）
- 07-30（上次温习后2d）
- 08-03（上次温习后4d）
- 08-10（上次温习后7d）
- 08-25（上次温习后15d）

第 N 天学第 N 组，温习日期链式计算。

---

## 实施步骤

### Step 1: PC 端 Skill 开发（已完成 ✅）

1. **完善成语数据** — 100条成语，含拼音、出处、分组等字段 ✅
2. **创建 Skill 文件** `.claude/skills/learn-today/SKILL.md` ✅
3. **数据分片** — chengyu.json 拆分为 chengyu/ 目录（index.json + group-N.json）✅

### Step 2: 手机端基础设施

1. 安装 Pinia
2. 修改 `vite.config.ts` 添加 Vant 自动导入插件
3. 修改 `main.ts` 注册 Pinia
4. 新建 `types/index.ts` 类型定义
5. 新建 `utils/` 工具函数

### Step 3: 手机端数据层

1. 完善数据源
2. 新建 `stores/` Pinia 状态管理

### Step 4: 手机端 UI 开发

1. 重写路由和 App.vue
2. 页面开发
3. 通用组件

### Step 5: 清理 & 验证

1. 删除旧文件
2. 手机浏览器测试
3. `npm run build` 构建无报错

---

## 验证方式

### PC 端验证
1. 在终端输入 `/learn-today`，验证 Skill 正常加载
2. 验证只读取当天涉及的 group-N.json 文件
3. 完成学习后，检查 group-N.json 中 `wrongCount` 是否更新
4. 确认 index.json 不需要更新

### 手机端验证
1. `npm run dev` 启动开发服务器，手机浏览器访问
2. 验证底部 Tabbar 导航正常
3. 验证成语模块完整流程
4. 验证数据持久化：导出 → 关闭 → 导入 → 数据恢复
5. `npm run build` 构建无报错
