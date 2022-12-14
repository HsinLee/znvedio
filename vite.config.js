import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJSX from '@vitejs/plugin-vue-jsx';
import VueSetupExtend from 'vite-plugin-vue-setup-extend';
import { vitePluginCommonjs } from "vite-plugin-commonjs";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
  		vue(),
  		vueJSX(),
  		vitePluginCommonjs(),
        VueSetupExtend(), // 解决使用setup语法带来的第一个问题就是无法自定义name
  	]
})
