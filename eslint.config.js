// eslint.config.js
import pluginVue from "eslint-plugin-vue";
import js from "@eslint/js";
import globals from "globals";
import autoImportGlobals from "./.eslintrc-auto-import.json" with { type: "json" };

import prettier from "eslint-config-prettier";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "*.min.js"],
  },

  // JavaScript 推荐规则（包含一些逻辑错误检查）
  js.configs.recommended,

  // Vue 3 推荐规则
  ...pluginVue.configs["flat/recommended"],

  // 全局配置
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.webextensions,
        ...autoImportGlobals.globals,
        chrome: "readonly",
      },
    },
    rules: {
      // Vue 相关规则
      "vue/multi-word-component-names": "off",
      "vue/no-v-html": "off",
      "vue/require-default-prop": "off",
      "vue/require-prop-types": "off",
      "vue/html-self-closing": "off",
      "vue/max-attributes-per-line": "off",
      "vue/singleline-html-element-content-newline": "off",

      // JavaScript 逻辑规则
      "no-console": "off",
      "no-debugger": "warn",
      "prefer-const": "warn",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  prettier,
];
