import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import * as path from "path";
import autoprefixer from "autoprefixer";
import AutoImport from "unplugin-auto-import/vite";
import pxtovw from "postcss-px-to-viewport";

export default defineConfig({
  resolve: {
    // 设置别名
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  css: {
    postcss: {
      plugins: [
        autoprefixer({
          overrideBrowserslist: [
            "Android 4.1",
            "iOS 7.1",
            "Chrome > 31",
            "ff > 31",
            "ie >= 8",
            //'last 2 versions', // 所有主流浏览器最近2个版本
          ],
        }),
        pxtovw({
          unitToConvert: 'px', // 要转化的单位
            viewportWidth: 443, // UI设计稿的宽度
            // viewportHeight: 960, // UI设计稿的高度
            unitPrecision: 6, // 转换后的精度
            viewportUnit: 'vw', // 转换后的单位
            fontViewportUnit: 'vw', // 字体转换后的单位
            propList: ['*'], // 能转换的属性，*表示所有属性，!border表示border不转
            selectorBlackList: ['ignore-'], // 指定不转换为视窗单位的类名
            minPixelValue: 1, // 最小转换的值，小于等于1不转
            mediaQuery: false, // 是否在媒体查询的css代码中也进行转换，默认false
            replace: true, // 是否转换后直接更换属性值
            exclude: [/(node_modules)/], // 忽略某些文件夹下的文件或特定文件，例如 'node_modules' 下的文件
            landscape: false, // 是否处理横屏情况
        }),
      ],
    },
  },
  plugins: [
    vue(),
    AutoImport({
      imports: ["vue", "vue-router"],
      dts: true, // 生成auto-imports.d.ts需在tsconfig.js的include中引用
      eslintrc: {
        enabled: true, // 生成.eslintrc-auto-import.json需在.eslintrc.cjs的extends中引用
      },
    }),
  ],
  build: {
    outDir: "../",
  },
});
