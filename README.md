# PiratePai's Blog

大模型效率技术知识全景 —— 20 篇技术综述，在线阅读：[piratepai.github.io](https://piratepai.github.io)。

首页提供从零学习、按问题查找、最近更新三个入口，并保留模型基础、推理优化、系统执行、性能验证与研究延伸五阶段路线及 1–20 篇完整目录。顶部搜索覆盖 20 篇文章的标题、章节与正文，支持中英文关键词、高亮摘要和章节直达。搜索在浏览器中运行，首次聚焦搜索框时加载静态索引，不依赖外部搜索服务。

按 `/` 或 `Ctrl` / `⌘` + `K` 聚焦搜索，`Esc` 清空；搜索词保留在 URL 的 `q` 参数中。索引加载失败时仍可搜索首页标题与摘要，并提供重试。关闭 JavaScript 时保留完整目录与阅读指引。

2026-11-01 根据全站审阅报告修订机制、性能口径与引文，增加每篇的阅读路径、手算例子和研究取舍；发布快讯按需展开。修订范围与证据边界见 [修订说明](docs/research-quality-review.md)。

2026-11-03 覆盖 16 个专题增补 13 个官方项目与 14 篇论文，修订 AIConfigurator 归属、Dynamo 版本、Hy-Nomas 发布日期与交互机制；增加两张授权论文原图和通信重叠 SVG 演示，现有动画改为默认静止、离屏停止和限帧播放。来源与验证范围见 [本轮修订说明](docs/research-refresh-20261103.md)。

2026-11-04 重绘 ZeRO / MoE 核心图，增加 KV 写时复制与投机拒绝采样的低频逐步演示；统一手绘 SVG 的深浅主题，修订相交、裁切和字号问题。设计、来源与检查见 [图解重绘说明](docs/core-visuals-redesign-20261104.md)。

## 知识结构与阅读顺序

| 部分 | 顺序 | 专题 |
|---|---|---|
| 模型与计算基础 | 1–2 | 注意力结构 → MoE（专家支线基础） |
| 缓存、压缩与解码 | 3–6 | KV Cache → 模型量化 → 投机解码 → 草稿后训练 |
| 并行、服务与部署 | 7–10 | 并行与通信 → 推理服务 → 定制推理引擎 → CPU-GPU 混合推理（部署支线） |
| 性能验证与自动调优 | 11–12、17 | 可复现实测 → 性能仿真 → 免训练优化与自动调优 |
| 架构与任务延伸 | 13–16、18–20 | Loop Transformer / ViT 稀疏化 / 实时世界模型 / Agent RL / 推理预算 / Agent 在线系统 / 扩散与 Flow 采样 |

通用主线：注意力 → KV Cache → 量化 → 投机解码 → 并行 → 服务 → 引擎集成 → 评测 → 仿真 → 调优。MoE、草稿后训练、异构部署和研究延伸可按问题补读；编号用于目录定位，不意味着每一篇都是下一篇的严格先修。重排依据与支线关系见 [知识结构说明](docs/knowledge-structure.md)。

文章源文件在 `posts/` 目录，正文保持完整静态 HTML，默认冷白、可切深色；CSS、字体和阅读器复用本站资源。离线浏览需要保留仓库的相对目录结构，不再单独复制一个 HTML。

阅读器统一采用可收起的左侧目录，手机端使用抽屉。短章节整章阅读，长章节按完整内容块分成少量连续阅读段，合并过短尾页；单页章节直接点击，多页章节展开选择。工具栏与页尾可翻页，支持直接链接、浏览器前进后退及全文切换。论文配图默认展示，可从侧栏配图目录直达。

文章统一为较窄正文行宽、17px 桌面／16px 手机正文与舒展行距，与首页共享冷白、蓝灰与深青配色及标题字体；工具栏可切换深色，并跨文章记住主动选择。标题、引文、公式、代码、表格和提示框采用统一层级，图表和交互演示保留独立绘图背景。调整依据与分页数量对照见 [阅读体验修订](docs/reading-comfort-review.md)。

主题源文件为 `assets/reading-theme.css`，阅读器源文件位于 `scripts/chapter-reader.js` 和 `scripts/chapter-reader.css`；修改后执行 `python scripts/build-site.py`，生成带内容版本的资源引用、元数据与搜索索引。首页与文章风格统一的实现与验证见 [阅读手册统一说明](docs/reader-handbook-review.md)。分页在单个 HTML 内完成，初次下载仍包含全文；关闭 JavaScript 时保留全文和原有目录。设计边界、配图审计与验证记录见 [阅读器修订说明](docs/chapter-reader-review.md)。

本地检查（Python 标准库；站点检查另需 Node.js）：

```text
python scripts/verify-mechanisms.py
python scripts/build-site.py --check
python scripts/check-site.py
python -m unittest discover -s scripts -p 'test_*.py'
node --test scripts/test-site-search.cjs
node --test scripts/test-core-visuals.cjs
python -m http.server 8000
```

数值示例只核对文中明确的机制与教学账本，不复现论文训练和 GPU 性能。

修改文章后执行 `python scripts/build-site.py` 更新 JSON 与 gzip 搜索索引及首页版本号；该索引仅从已有文章提取文本与有效章节锚点，`--check` 检查索引是否过期。它按需加载，不阻塞首页阅读。首页样式与搜索逻辑分别位于 `assets/site.css` 和 `scripts/site-search.js`。

动画和核心图解也使用同源共享资源；修改后运行统一构建命令。浏览器行为回归可运行 `node scripts/check-animations.cjs <本地预览地址>`（需要 Playwright 与已安装的 Edge）。

核心原理图的样式与逻辑在 `scripts/core-visuals.css` / `scripts/core-visuals.js`，修改后运行 `python scripts/build-core-visuals.py`；几何、手机布局和逐步结果检查使用 `node scripts/check-core-visuals.cjs <本地预览地址>`。旧手绘 SVG 的配色与样式隔离由阅读器构建维护；论文原图保留原样。

## 日期、分享与发布维护

`data/articles.json` 统一维护 20 篇的摘要、首次发布、内容更新、最近局部核验与变更记录。首次发布来自仓库首次收录提交；原稿日期单独保留。内容更新可以是研究或图解变更，核验日期只覆盖记录中明确的来源范围；界面更新不会自动刷新它。

`build-metadata.py` 生成页头日期、章节变更链接、首页最新记录与目录日期，同时生成 description、canonical、Open Graph、BlogPosting JSON-LD、sitemap 和 robots。分享图为 `assets/social-card.png`。元数据、变更记录与 sitemap 都使用同一份数据。

搜索仍在浏览器本地完成。支持 DecompressionStream 时按需加载 gzip 索引，失败或不支持则回退普通 JSON；两者均失败时保留标题与摘要搜索及重试。资源版本使用内容摘要，不使用构建时间。

提交工作分支并创建 PR，`site-checks` 运行生成一致性、链接、元数据、搜索和数值机制检查；合并后由 GitHub Pages 发布。实现和验证范围见 [本轮维护说明](docs/site-maintenance-20261104.md)。

2026-11-04 新增第 17–19 篇：性能评测与可复现实验、推理时计算与自适应预算、Agent 在线推理系统。保留原 1–16 编号，按主题插入原五阶段路线。附 Python 标准库账本及 SQLite 恢复教学示例；人工输入与 GPU 待执行协议分别标注。来源和验证范围见 [内容补齐说明](docs/content-gaps-20261104.md)，运行方式见 [实验工具说明](examples/efficiency-lab/README.md)。

新专题的浏览器回归：`node scripts/check-content-guides.cjs http://127.0.0.1:8000`（需 Playwright 与 Edge）；覆盖 375px/1440px、主题持久化、目录/翻页/引用、全文/无脚本与搜索。截图默认写入系统临时目录的 `piratepai-content-qa/`。

2026-11-04 新增第 20 篇[扩散与 Flow 模型的采样效率](posts/diffusion-flow-sampling.html)，附同求值预算的标量算例、FLUX 引导源码对照与图像、视频的评测协议。
