# 2026-11-19 全站改版：六专题首页、问题入口与两条阅读样板

基线 `dde9172404beb8ca35a4e4cc80554aee4d747e33`（origin/main），工作树 `D:\Github\piratepai-site-redesign`，分支 `codex/site-redesign-20261118`。本轮授权为本地实现与候选提交；不含推送、PR 与发布。

## Summary

把首页从"五阶段路线主导"改为"问题入口 + 六专题"：四个通用专题（模型结构与状态、推理算法与计算预算、执行引擎与在线服务、性能建模、评测与成本）与两个工作负载专区（图像、视频与世界模型；Agent 训练与执行）。专题归属、编号、导航、短索引与完整目录全部由 `data/articles.json` 生成并校验；新增研究判断登记表页面与搜索术语表；完成两条可验收的阅读样板（KV Cache 文本推理路径、Self Forcing 视频研究路径）。

## 改动与依据

### 1. 专题数据与构建校验

- `data/articles.json`：每篇新增 `number`（1–23，唯一且连续）、`topic`、目录短标题 `short`、`meta` 与 `related`；新增顶层 `topics`（六个，含 `zone` 区分专题/工作负载专区）与 `pages`（研究判断登记表，不计入综述篇数）。
- `scripts/build-metadata.py`：`validate_topics` 校验重复编号、重复/未知归属、空专题与非法 zone；`load_metadata` 校验 articles ∪ pages 与 `posts/` 精确对应、pages 的日期/锚点/证据。首页新增四个生成区：`topic-nav`（侧栏）、`mobile-topic-nav`（移动导航）、`topic-index`（六专题短索引）、`topic-catalog`（专题目录）。旧目录锚点 `#chapters-foundations/-optimization/-execution/-evaluation/-research` 由专题分组内的别名锚点承接（`chapters-research` → 视觉专题）。
- `scripts/test_site_build.py`：新增 `test_generated_topic_structure_matches_editorial_data`（含三种破坏性数据的校验失败断言）；sitemap/元数据/最近更新测试扩展到 pages。

### 2. 首页与移动导航

- 顺序调整为：标题与一行站点范围 → 按问题查找（首屏）→ 六专题短索引 → 选读路线（原五阶段，锚点 `#start/#core/#systems/#evaluate/#extensions` 保留，去掉与目录重复的编号区间，修复了基线中 23 同时出现在"验证与调优"和"研究延伸"、侧栏漏列 23 的缺陷）→ 在线书入口 → 六专题完整目录 → 最近更新 → 浏览量（页尾）。
- 问题入口为"显存不足、首 token 慢、逐 token 生成慢、单位成本高"各指定首选章节锚点与后续读物；新增新手入口（一次请求的时间线 → 注意力 → KV Cache → 测一次）、交互视频（控制到屏幕）与研究判断入口；跨文链接说明"跳过去会看到什么"。
- 移动端：topbar 内新增原生 details 移动导航（六专题 + 快速入口）；在线书收成紧凑"动手实验"入口（隐藏简介、缩小标题）。删除三格 entrypoints 重复导航。
- 375px 实测（667px 视口）：`#problems` 起点 372px，第一条问题及可点击入口在首屏内（定向脚本断言）；六专题短索引 2469px；完整目录 4431px（基线 3560px）；更新记录 12770px；浏览量 13301px（页尾）。1440px：问题区 210px、短索引 1164px、目录 2524px（基线 2420px）。

### 3. 搜索术语表（`scripts/site-search.js`）

- 新增小而窄的别名表 `TERM_ENTRIES`（六条），查询与别名按 NFKC 归一化后精确匹配；命中时在结果列表上方渲染术语卡（全部 `textContent` 构建，输入不会成为 HTML）。TTFT/首 token 延迟/首token延迟/首 token 时延/首字时延/首字延迟/Time to First Token → `inference-evaluation.html#s1`；P/D 分离/PD 分离/P-D 分离/Prefill-Decode 分离/Prefill/Decode 分离/prefill decode 分离 → `inference-serving.html#s5`；分页管理/PagedAttention/页表管理 → `kv-cache-survey.html#s4`；Self Forcing → 专题；goodput/有效吞吐 → `inference-evaluation.html#s2`；块等待/control to screen/控制到屏幕时延 → `self-forcing-inference-research.html#s36`。
- 宽泛词（推理、缓存、分页、TT、KV Cache 等）不做强别名（测试断言为 null）；查询 URL、前进后退、回退与重试行为不变（check-home 全过）。
- `syncNavigation` 默认高亮从 `#start` 改为跟随实际哈希。

### 4. 阅读界面（`scripts/chapter-reader.css`）

- ≤980px 工具栏显示当前章短名称（`.reader-current-title` 由 `display:none` 改为截断显示，≤360px 再次隐藏以保 320px 放得下）；工具栏全部按钮/链接最小高度 44px；工具栏高度 60→64px。焦点归还（Escape → 目录按钮）原本已实现，回归通过。

### 5. 文本推理路径样板（`kv-cache-survey.html`）

- 新增 4.3 逐步推演：两请求 × 三逻辑块的六步状态转移表（按需分配、非连续物理映射 P1/P4/P6、前缀命中、分叉独占块），与图 4-1 快照、4.2 源码（`allocate_slots`/`find_longest_cache_hit`）逐步对应；对照静态预留说明连续预留与内部/外部碎片怎么被消除。
- 5.1 新增共享账算例：两个完整前缀块使物理块 6→4、引用计数簿记；新增写时复制边界框：COW 只发生在向共享未满块追加写（同请求并行采样/beam search），vLLM APC "We only cache full blocks"（设计文档 2026-11-19 快照）按完整块哈希复用，两者是不同机制。
- 新增 5.4 观测账本：容量（allocated/reserved/引用计数/未满尾块/页表）与命中（命中 token、减少的 prefill、实际含排队 TTFT）分开列出；教学边界算例给出命中收益被传输（100→25 MB/s 时 10→40 ms > 省 16 ms）或排队（批满等待，收益进吞吐不进延迟）抵消的两种情形。
- 证据口径分层：PagedAttention 论文（2023 实测口径）、vLLM V1 源码静态阅读（2026-08 主线）+ 设计文档（2026-11-19 快照，新增 ref `V26-APCDOC`）、固定提交 `ea75c00` 下 `tests/v1/core` 测试文件（`test_prefix_caching.py` 等，新增 ref `V26-TESTS`；核对存在与覆盖意图，本站未运行）、教学简化（块大小与池子为设定值）。与 Self Forcing 固定提交 KV 管理（覆写追加、滑窗驱逐、无跨请求复用）对照互链。
- 评测篇 1.1 新增"时间线作为机制专题坐标系"段落，双向链接。

### 6. 视频研究路径样板（`self-forcing-inference-research.html` + 成本篇）

- 3.6 开头新增四个定义对照表（首帧时间、帧间隔、平均帧率、控制到屏幕时延）。
- 新增 3.6.1.1 动手核对算例：f=16（控制间隔 62.5 ms）、生成与显示合并 50 ms，N=1/4/8 → 50/237.5/487.5 ms（公式 R_first=(N−1)/f+t_g，逐行复算）；明确教学假设与改块的三重影响（质量 FVD 53.8→118.6、算术强度 5.6→16.4 TFLOPs/帧、服务协议），否定条件指向 E6 组与成本篇对照表。
- 章末衔接段：成本篇 `video-response`（吞吐、响应与成本三分反例）、`s8`（落地清单与决策树）、`s9`（局限与未来）与研究判断第 3 条，均带"跳过去会看到什么"。
- 成本篇 5.3/6.5/8.3、推理服务 5.6、研究路线 s0 分别衔接判断 1/2/3 与登记表入口。原有对照组、结论边界与 `s8/s9/video-response` 锚点语义不变（check-research-integration 断言通过）。

### 7. 研究判断登记表（`posts/research-judgments.html`）

- 三条判断（缓存感知路由 vs 最短队列；Agent token 单价 vs 每成功任务成本；交互视频同卡 vs 流水线分离 + 响应约束），每条九字段齐全，证据状态均为"待验证假设"，拟回看日期 2027-02-19；与六个专题双向链接。元数据在 `pages` 键下；搜索索引、sitemap、最近更新、阅读器与无 JS 阅读路径均覆盖（check-reader/comfort 枚举 24 篇通过）。

### 8. 文档与规范

- `AGENTS.md`：仓库结构表更新（生成区、pages）；新增"开篇按文章类型"规范（机制综述/系统解剖/研究方案三类开篇差异）；checklist 更新为生成区维护方式。
- `docs/knowledge-structure.md`：追加 2026-11-19 六专题结构说明（含旧锚点映射与首屏决策）。
- `docs/article-opening-review-20261119.md`：逐篇开篇审查清单（23 篇 + 登记页；B 型旧文的共性缺口列为 P2 后续项）。
- `README.md`：首页描述、六专题表与登记表说明同步。

## Testing

环境：Windows、Python 3.12、Node 22、Playwright（`D:/Github/spec/node_modules`）+ Microsoft Edge；预览 `http://127.0.0.1:8965`。

| 命令 | 退出码 |
|---|---|
| `python scripts/build-site.py`（构建后 `--check` 二次无漂移） | 0 |
| `python scripts/check-site.py`（25 页：链接/锚点/SVG/JS 语法） | 0 |
| `python scripts/verify-mechanisms.py` | 0 |
| `python -m unittest discover -s scripts -p 'test_*.py'`（22 项，含新增专题结构测试） | 0 |
| `node --test scripts/test-site-search.cjs scripts/test-core-visuals.cjs`（16 项，含术语别名测试） | 0 |
| `git diff --check` | 0（无空白错误） |
| `node scripts/check-home.cjs URL`（1440/375 + 无 JS） | 0 |
| `node scripts/check-reader.cjs URL`（24 篇双宽度 + 无 JS） | 0 |
| `node scripts/check-reading-comfort.cjs URL`（24 篇双宽度双主题；320px 工具栏） | 0 |
| `node scripts/check-core-visuals.cjs URL` | 0 |
| `node scripts/check-animations.cjs URL` | 0 |
| `node scripts/check-research-integration.cjs URL` | 0 |
| `node scripts/check-content-guides.cjs URL` | 0 |
| 定向验收脚本 `D:/Github/piratepai-redesign-qa/redesign-targeted-check.cjs` | 0 |

定向断言覆盖：375×667 首屏含第一个具体问题与可点击入口；TTFT 三种写法与 P/D 三种写法分别归一到同一术语卡；`分页管理` 首条命中 `kv-cache-survey.html#s4`；`#chapters-research` 落在视觉专题；五阶段锚点全部可达；侧栏计数 3/5/4/5/4/2；移动导航可开合跳转；移动工具栏显示"分页管理/P/D 分离"章名且六个控件 ≥44px；320px 无横向溢出。

截图与测量存档：`D:/Github/piratepai-redesign-qa/`（`home/`、`reader/`、`content/`、`targeted/`）。

## 测试环境修复记录

- `check-home.cjs`：期望列表按编辑编号排序（与生成顺序一致），合并 `pages`；导航断言改用 `#topic-execution/#topic-algorithms`。
- `check-content-guides.cjs`：`.article-entry` 计数排除 `pages`；无 JS 上下文补外部请求屏蔽（与既有脚本同策略；此前 komarev 计数器会挂起 load 事件）。
- 首次内容指南运行超时记录在会话日志；修复为测试环境问题，非产品缺陷。

## 事实与验证边界

- vLLM：设计文档（2026-11-19 静态阅读）与 `ea75c00` 提交下测试文件存在性核对；源码细节复用站内既有 2026-08 主线静态阅读记录；本站未运行 vLLM 测试或模型。
- 块等待算例与 KV 边界算例均为标注假设的教学数字；PixVid/Self-Forcing/Mooncake/DistServe 数字保持论文报告口径。
- `reviewed` 日期未推进（界面、导航与教学内容更新；新增来源的核验范围即本记录）。
- 未运行真实模型；未做完整无障碍符合性认证（仅覆盖 44px 触控、对比度脚本断言、键盘焦点回归与 Reflow 相关的 320px/无溢出检查）；外部链接可达性未验证（浏览器脚本屏蔽外部请求）。

## 遗留项

- B 型旧文（1、2、4、5、7、13）开篇缺少显式"不解决什么/适用条件"——P2，见 `docs/article-opening-review-20261119.md`。
- 375px 完整目录起点 4431px（基线 3560px）：问题列表前移与短索引插入的预期代价，首屏门槛不受影响。
- 连续阅读与章内跳转的全站默认模式未切换（维持现默认，无用户任务证据）。

## 独立验收后的修订（2026-11-19）

以 `4e1a593` 的验收问题为范围。首页先显示四个常见问题与六专题短索引，更多问题及入门路线仍可展开。恢复部署选型入口，旧 `#chapters-research` 可通往原有八个专题。移动端点选专题时收起菜单，目标标题在粘性顶部栏下方可见。匹配术语时，Enter 聚焦定义入口，章节索引加载完成后保留焦点，正文匹配数单独报告。

- KV Cache 第 5.4 节按[PagedAttention 论文图 2](https://arxiv.org/html/2309.06180)区分旧系统利用率与算例节省量，并以独立排队假设说明命中仍可增加 TTFT。
- 成本篇与研究判断按 [Ali 等的预印本第 3 节](https://arxiv.org/html/2610.07094#S3)修正证据分类。用独立失败的教学例说明 20 步成功概率和完整尝试假设，不外推 decode 优势的盈亏平衡。登记表纠正 [Mooncake v1](https://arxiv.org/abs/2407.00079v1)日期，明确性能取舍和视频响应档的判定规则。
- Self Forcing 的块等待教学例支持 1、4、8 条输入，保留静态读数表。按 [PixVid 附录 B.5](https://arxiv.org/html/2611.17336v1)修正每帧计算量术语。核验限于上述引用和修改。
- KV Cache 和推理服务试点「章内跳转」及 `?view=chapter`，保留默认分页、可切换全文阅读与旧锚点。KV Cache、P/D 分离与计时章节分别链接到公开在线书的对应实验。
- 首页与研究整合的浏览器脚本增加定向断言，覆盖标题可见、术语焦点、算例三档和两篇文章的连续读本章。已有文章的未改行保留原换行，索引和资源版本由统一构建更新。
