# 2026-11-04 重复更新入口与站点交互修复

## 问题与修改

- 首页“最近更新”原先逐条展开变更记录，同一文章同一天出现多个完整标题。现在按日期和文章归组，标题只出现一次，下面保留每条变更的类别、说明与章节链接。11 月 4 日的 16 条记录归为 12 篇，与折叠标题的篇数一致；历史日期仍各自保留。
- 搜索后点击站内目录，旧代码先覆盖当前历史记录，导致返回时查询丢失。现在单独写入目录导航记录，并在前进、后退时从 URL 恢复输入框、结果和目录状态；快速输入后立即导航也保存最后一次编辑。
- 目录高亮原先只响应点击，首次打开带锚点地址、前进和后退会显示错误阶段。现在根据地址同步 `aria-current`。
- gzip 索引即使 JSON 格式合法，也可能包含错误版本、空文档或无效字段。现在在压缩通道内部完成数据校验，失败后回退到普通 JSON；普通索引仍保留校验、标题摘要降级与重试。
- Agent 在线推理系统文章的长页头标签在 320px 屏幕上撑宽页面。共享样式允许标签按可用宽度换行，无 JavaScript 时同样适用。

文章正文、来源和编辑日期保持不变。19 篇文章仅更新共享 CSS 的内容版本；搜索构建同步刷新文章源摘要和索引版本。

## 检查结果

- `python scripts/build-site.py --check`：生成文件一致。
- `python scripts/check-site.py`：20 页的本地链接、资源、唯一锚点及脚本语法通过。
- `python scripts/verify-mechanisms.py`：机制数值校验通过。
- `python -m unittest discover -s scripts -p 'test_*.py'`：16 项通过，增加按文章归组、篇数和变更链接完整性检查。
- `node --test scripts/test-site-search.cjs scripts/test-core-visuals.cjs`：15 项通过，增加合法 JSON / 无效索引的 gzip 回退检查。
- `node scripts/check-home.cjs URL`：1440px、375px 首页归组、修改章节直达、历史导航、目录高亮、索引回退与重试；无脚本更新列表和 320px 标签换行。
- `node scripts/check-reader.cjs URL`：19 篇文章在 1440px、375px 的分页、前进后退、全文阅读、旧锚点、图片解码、目录和无脚本正文。
- `node scripts/check-content-guides.cjs URL`：三篇新专题的章节、引用、全文、搜索和无脚本阅读。
- `node scripts/check-reading-comfort.cjs URL`：19 篇、两种宽度、深浅主题的对比度、正文宽度、工具栏和字号。
- `node scripts/check-core-visuals.cjs URL`：34 张 SVG 在 1440px、375px、320px 的标签与边界，四个核心图的步骤、主题、暂停、减少动态效果及无脚本内容。
- `node scripts/check-animations.cjs URL`：10 个演示、减少动态效果以及 16 篇实际具有本轮研究记录的章节锚点。该检查原先误把后来新增的三篇专题也视为包含 11 月 3 日研究锚点，现按元数据选择应检查的文章。

浏览器检查使用本地 Microsoft Edge 与 Playwright，外部计数器请求在测试中屏蔽。上述链接检查覆盖站内目标，不是对全文外部论文来源的逐条可用性复核。
