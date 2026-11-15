# 2048 · 数字花园

一个中文版 2048 游戏，使用原生 HTML、CSS 和 JavaScript 编写，无第三方运行依赖，无需构建。

[在线试玩（无需登录）](https://number-garden-2048-loyee.seederslab.chatgpt.site/)

## 玩法

- 使用键盘方向键或 WASD 移动方块，手机支持滑动和方向按钮。
- 相同数字碰撞后合并，每块方块每回合只能合并一次。
- 合成 2048 获胜后，可以继续挑战更大的数字。
- 支持撤销上一步、重新开始、最高分记录和自动续局。
- 分数和进度保存在当前浏览器的 localStorage 中。

## 本地运行

需要 Python 3.7 或更新版本。在项目根目录运行：

```bash
python3 -m http.server 4198 --bind 127.0.0.1 --directory dist
```

打开 http://127.0.0.1:4198/ 。请通过 HTTP 服务器访问，不要直接双击 HTML 文件。

如果已安装 Node.js 和 npm，也可以运行：

```bash
npm start
```

无需执行 npm install。

## 测试

需要 Node.js 20 或更新版本：

```bash
npm test
```

测试覆盖合并顺序、四个方向、无效移动、新方块生成、胜负判定、存档校验及随机棋盘的数值守恒。

## 文件结构

```text
dist/
  index.html        页面结构
  style.css         响应式样式与动画
  app.mjs           交互、存档和界面更新
  engine.mjs        2048 核心规则
tests/
  engine.test.mjs   规则测试
package.json       启动及测试命令
```

## 静态部署

将 dist/ 中的文件发布到任何支持静态网站的服务即可，网站根目录应指向 dist/。
本仓库不包含现有托管站点的专用配置，也不包含浏览器中的玩家存档。
