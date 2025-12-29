/** @type {import("prettier").Config} */
module.exports = {
  // 一行最多 100 字符（可调）
  printWidth: 100,

  // 使用 2 个空格缩进
  tabWidth: 2,

  // 不使用 tab 缩进，而使用空格
  useTabs: false,

  // 语句末尾是否加分号
  semi: true,

  // 使用单引号
  singleQuote: true,

  // 对象、数组等是否在末尾添加逗号（推荐 'es5' 或 'all'）
  trailingComma: "es5",

  // 函数括号前是否加空格：`function ()` 而不是 `function()`
  spaceBeforeFunctionParen: true,

  // 箭头函数参数括号：单参数时省略 `(x) => {}` → `x => {}`
  arrowParens: "avoid",

  // HTML/Vue/JSX 等多行标签是否折行
  bracketSameLine: false,
  bracketSpacing: true,
};
