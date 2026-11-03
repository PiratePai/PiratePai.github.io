# PiratePai's Blog

大模型效率技术知识全景 —— 16 篇技术综述，在线阅读：[piratepai.github.io](https://piratepai.github.io)。

首页按概念依赖组织为模型基础、推理优化、系统执行、性能验证与研究延伸五部分，目录编号为1–16；页边区分通用推理主线与按需选读支线。顶部搜索覆盖 16 篇文章的标题、章节与正文，支持中英文关键词、高亮摘要和章节直达。搜索在浏览器中运行，首次聚焦搜索框时加载静态索引，不依赖外部搜索服务。

按 `/` 或 `Ctrl` / `⌘` + `K` 聚焦搜索，`Esc` 清空；搜索词保留在 URL 的 `q` 参数中。索引加载失败时仍可搜索首页标题与摘要，并提供重试。关闭 JavaScript 时保留完整目录与阅读指引。

2026-11-01 根据全站审阅报告修订机制、性能口径与引文，增加每篇的阅读路径、手算例子和研究取舍；发布快讯按需展开。修订范围与证据边界见 [修订说明](docs/research-quality-review.md)。

2026-11-03 覆盖 16 个专题增补 13 个官方项目与 14 篇论文，修订 AIConfigurator 归属、Dynamo 版本、Hy-Nomas 发布日期与交互机制；增加两张授权论文原图和通信重叠 SVG 演示，现有动画改为默认静止、离屏停止和限帧播放。来源与验证范围见 [本轮修订说明](docs/research-refresh-20261103.md)。

## 知识结构与阅读顺序

| 部分 | 顺序 | 专题 |
|---|---|---|
| 模型与计算基础 | 1–2 | 注意力结构 → MoE（专家支线基础） |
| 缓存、压缩与解码 | 3–6 | KV Cache → 模型量化 → 投机解码 → 草稿后训练 |
| 并行、服务与部署 | 7–10 | 并行与通信 → 推理服务 → 定制推理引擎 → CPU-GPU 混合推理（部署支线） |
| 性能验证与自动调优 | 11–12 | 性能仿真 → 免训练优化与自动调优 |
| 架构与任务延伸 | 13–16 | Loop Transformer / ViT 稀疏化 / 实时世界模型 / Agent 与强化学习 |

通用主线：注意力 → KV Cache → 量化 → 投机解码 → 并行 → 服务 → 引擎集成 → 仿真 → 调优。MoE、草稿后训练、异构部署和研究延伸可按问题补读；编号用于目录定位，不意味着每一篇都是下一篇的严格先修。重排依据与支线关系见 [知识结构说明](docs/knowledge-structure.md)。

文章源文件在 `posts/` 目录，均为自包含 HTML（默认冷白阅读手册、可切深色、移动端适配）。

阅读器统一采用可收起的左侧目录，手机端使用抽屉。短章节整章阅读，长章节按完整内容块分成少量连续阅读段，合并过短尾页；单页章节直接点击，多页章节展开选择。工具栏与页尾可翻页，支持直接链接、浏览器前进后退及全文切换。论文配图默认展示，可从侧栏配图目录直达。

文章统一为较窄正文行宽、17px 桌面／16px 手机正文与舒展行距，与首页共享冷白、蓝灰与深青配色及标题字体；工具栏可切换深色，并跨文章记住主动选择。标题、引文、公式、代码、表格和提示框采用统一层级，图表和交互演示保留独立绘图背景。调整依据与分页数量对照见 [阅读体验修订](docs/reading-comfort-review.md)。

主题源文件为 `assets/reading-theme.css`，阅读器源文件位于 `scripts/chapter-reader.js` 和 `scripts/chapter-reader.css`；修改后执行 `python scripts/build-reader.py`，将主题、现有授权字体及阅读器内嵌进全部文章。首页与文章风格统一的实现与验证见 [阅读手册统一说明](docs/reader-handbook-review.md)。分页在单个 HTML 内完成，初次下载仍包含全文；关闭 JavaScript 时保留全文和原有目录。设计边界、配图审计与验证记录见 [阅读器修订说明](docs/chapter-reader-review.md)。

本地检查（Python 标准库；站点检查另需 Node.js）：

```text
python scripts/verify-mechanisms.py
python scripts/build-animations.py --check
python scripts/build-reader.py --check
python scripts/check-site.py
python scripts/build-search-index.py --check
node --test scripts/test-site-search.cjs
python -m http.server 8000
```

数值示例只核对文中明确的机制与教学账本，不复现论文训练和 GPU 性能。

修改文章后执行 `python scripts/build-search-index.py` 更新 `search-index.json`；该索引仅从已有文章提取文本与有效章节锚点，`--check` 检查索引是否过期。它按需加载，不阻塞首页阅读。首页样式与搜索逻辑分别位于 `assets/site.css` 和 `scripts/site-search.js`。

修改动画调度器后执行 `python scripts/build-animations.py` 将脚本内嵌到相关文章，再重建搜索索引。浏览器行为回归可运行 `node scripts/check-animations.cjs <本地预览地址>`（需要 Playwright 与已安装的 Edge）。
