# 2026-11-18：PR #19–#22 整合审查

基线为 `3490057`。审查范围为四个 PR 的差异、三篇文章的关键论证与共享导航；历史文章只做站点回归，不声称重新核验全站文献。原 PR 的验证记录作为历史记录保留，最终内容以本次整合为准。

## 编排决定

- #22 的维护规范、PR 模板和检查入口保留，与内容更新一并交付。
- 第 21 篇保留成本专题：回答有效产出如何定义、资源如何记账、方案如何比较。
- 第 22 篇保留研究路线：回答如何组织建模、约束优化、协同设计和反馈证据。这些是可交叉的问题层次，不是必须逐级通关的阶段。
- 第 23 篇为 Self Forcing 研究案例：回答具体实现的执行、状态和实验设计。研究路线中重复的详细块等待推导改为链接此篇；成本篇保留成本教学例，三篇相互链接。
- 首页、README、元数据、索引统一为 23 篇。保持既有视觉主题；本次浏览器回归未发现必须更换主题的理由。

审查依据：用户指定 `D:/Github/piratepai-review-requirements/docs/site-review-requirements.md`，与本仓库同名文档逐字比较一致。合入前候选为 `e565c33` 加本报告所列逻辑列表、图解静止/暂停和验收脚本修订；最终 SHA 由 PR 最新提交固定。

## 发现与修复

| 编号 / 优先级 | 文件 / 锚点 | 原文或复现 | 影响 | 修订 / 验证方式 | 状态 |
|---|---|---|---|---|---|
| R01 / P1 | `index.html` | #19/#20 同为第 22 篇 | 导航冲突 | 研究路线 22，Self Forcing 23，更新目录与知识结构 | 已验证 |
| R02 / P1 | `cost-efficient-inference-2026.html#s8` | 成本篇将旧 s8/s9 改成新主题 | 历史深链接误导 | 旧 s8 仍为落地、s9 仍为局限；新增视频章使用 video-response，显示章节号独立 | 已验证 |
| R03 / P0 | `cost-efficient-inference-2026.html#video-response` | 495/34 ms 中位数被用于 p99 可行性；600 ms 容纳 839 ms；质量门不一致 | 成本决策错误 | 改成明确假设的 p99、900 ms 放宽条件、相同质量门；说明超速但未消费帧不能进入有效分母 | 已验证 |
| R04 / P0 | `self-forcing-inference-research.html#s2` | Self Forcing 写成整条轨迹梯度反传 | 训练机制错误 | 核对 training pipeline 的随机退出步、no_grad 与缓存提交，改为截断梯度 | 已验证 |
| R05 / P0 | `self-forcing-inference-research.html#s1` | 稳态 12 帧写成 4 latent，满槽前历史 27,300 | 形状账本错误 | 稳态新增 3 latent，最后一块前历史 28,080，7 块/21 latent 填满 32,760 槽 | 已验证 |
| R06 / P1 | `sc-sf-state-life.html / #s31` | 第 21 块才触顶、默认实现展示 hist=10/20 | 图文和实现边界错配 | 图改第 7 块；长历史行明确扩容假设，默认不能执行 | 已验证 |
| R07 / P0 | `self-forcing-inference-research.html#s31` | cross-KV 权重投影使用 1280；交叉 attention 漏 Q/O、误写总 FLOPs | 公式与源码不符 | K/V 经文本嵌入后均 dim→dim；重算主矩阵参数与表格，补充 Q/O 约 1.325 TF、打分/加权约 0.442 TF | 已验证 |
| R08 / P0 | `self-forcing-inference-research.html#s31` | LLM 单 token bf16 强度写成 0.5 | 倍数错误 | 只计权重时 2/s = 1 FLOP/B，KV 流量使其下降 | 已验证 |
| R09 / P0 | `self-forcing-inference-research.html#s2` | clean commit 才更新索引；重加噪前向彼此独立 | 源码语义错误 | 每次 attention 都更新索引，同块 current_end 不变；噪声独立不代表前向独立 | 已验证 |
| R10 / P0 | `self-forcing-inference-research.html#s33` | 18.6 GiB 当默认 KV 窗口且 clone 只算单向 | 流量估计错误 | 默认 5.6236 GiB，读+写按约 12.08 GB，峰值带宽下理想下界约 3.6 ms | 已验证 |
| R11 / P1 | `self-forcing-inference-research.html#s34` | 无测量即断言 VAE 1–2 GB、确定算力瓶颈 | 证据过强 | 撤回峰值断言；瓶颈明确为简化模型预测，要求实际流量与利用率验证 | 已验证 |
| R12 / P1 | `sc-roadmap-four-stages.html` | 图示要求逐阶段通关、正文却允许交叉进入 | 结构矛盾 | 图说明改为证据依赖示例；保留跨阶段回访 | 已验证 |
| R13 / P1 | `新文 hero / 九张图解` | 新文章页头 pill 未被共享主题覆盖；手机图解整体缩小导致标签难读 | 视觉验收发现 | 页头使用共享 chip 样式；图解在窄屏保持局部可滚动宽度，提供横向阅读提示 | 已验证 |
| R14 / P1 | 新文并列说明 | ①②③、（i）（ii）（iii）连写成段 | 难以扫读 | 将明确并列项改为语义列表；保留引用和代码，Python 结构检查与阅读器回归 | 已验证 |
| R15 / P1 | 九张 sc 图解 | live 默认开启、缺少离屏/后台处理 | 动效生命周期不符合规范 | 默认静止，显式启用；离屏/后台暂停，减少动态效果禁用持续播放；定向测试逐阶段/离屏/无 JS，源码核对 visibilitychange | 已验证 |

## 一手核对与适用边界

2026-11-18 查询并静态阅读 [Self-Forcing 官方仓库](https://github.com/guandeh17/Self-Forcing)，main 为 `33593df3e81fa3ec10239271dd2c100facac6de1`（2025-09-12）。重点核对 `pipeline/self_forcing_training.py`、`pipeline/causal_inference.py`、`wan/modules/causal_model.py`、`wan/modules/model.py`、配置及 `demo.py`。没有运行模型或下载权重。

核对 [Self Forcing v2](https://arxiv.org/html/2506.08009v2) 的训练与梯度截断说明、[PixVid v1](https://arxiv.org/html/2611.17336v1) 的 §4.5、附录 B.5、表 10/11，以及 [Runway Characters](https://arxiv.org/abs/2611.05642) 摘要中的部署与性能口径。采用论文对指标边界的区分，不引入其整套框架。其他新文献复用原 PR 研究记录；本次未逐篇复现实验，也未把预印本结果写成本站实测。

## 验证

全站构建、链接与资源检查覆盖 23 篇文章及首页。Python 单元测试 21 项、Node 搜索与机制测试 15 项通过；标准库机制检查通过。桌面 1440px、手机 375px 的阅读器回归和深浅主题舒适度回归按现有脚本执行，首页搜索/历史/失败回退及无 JavaScript 检查通过。最终候选的补充验证、CI 与上线状态记录在整合 PR。

原工作目录有未提交内容及 gate.js，因此使用独立 worktree；整合范围不含门禁文件。此记录不代表 GPU 性能复现、完整无障碍认证或所有外部引用全文重验。

## 按审查要求逐项验收

| 要求 | 证据与结论 |
|---|---|
| 2.1 事实与机制 | R03–R11 源码、公式与一手来源核查；正文代码 3-1 实际用 Python 标准库执行并对照四行表格；性能不作本站实测 |
| 2.2 逻辑排版 | 本轮修改两篇新文的显式并列段落；正文、提示框、局限与来源注释纳入；没有以固定字数切分 |
| 2.3 HTML 与保真 | 21 项 Python 单测、全站链接/锚点检查；旧 s8/s9 主题断言；全站阅读器检查正文顺序/图片/无 JS；研究路线有意精简 4.3 重复推导并保留引文及案例链接 |
| 2.4 渲染与交互 | 23 篇阅读器双宽度、舒适度双宽度双主题；核心图四状态及 320/375/768/1440px；九张新改图定向逐步骤、默认静止、离屏与减少动态效果、无 JS；人工查看页头、手机图解截图 |
| 2.5 搜索与元数据 | 统一构建稳定，23 篇索引；Node 搜索测试与首页浏览器失败回退、历史导航、无 JS 通过；未宣称体积变小或整站 CPU 收益 |
| 第 7 节发布 | 合入前核对最新 SHA 的 CI；合入后的 Pages 与线上校验记录在 PR，未完成前不视为上线 |

### 环境、命令与失败记录

Windows、Python 3.12、Node.js、Playwright + Microsoft Edge。预览 `http://127.0.0.1:8964`。`NODE_PATH=D:/Github/spec/node_modules`。本地日志、JSON 与截图保存在 `D:/Github/piratepai-pr-review-evidence/`；截图文件包含视口，新图初始为浅色。

基础命令为规范第 6 节的五条检查，均退出 0。浏览器执行 `check-reader.cjs`、`check-reading-comfort.cjs`、`check-home.cjs`、`check-core-visuals.cjs`、`check-animations.cjs`；新增 `check-research-integration.cjs` 覆盖本轮三篇文章与九张图。现有 `check-content-guides.cjs` 针对旧四篇，新增内容采用定向用例替代，不声称该脚本覆盖新专题。

首次核心图与定向脚本在无 JavaScript 上下文等待第三方计数图片加载时超时，日志保留为 `check-core-visuals.log`、`integration.log`。修复测试环境：给无 JS 上下文加入与已有 JS 上下文相同的外部请求屏蔽；本地资源、结构与交互断言均保留。修后 `core-final.log`、`integration-final.log` 通过。外部请求屏蔽不证明论文外链可达。

最有价值的三项修订是：纠正 p50/p99 与有效分母，按实际源码修正训练/状态账本，恢复稳定导航并补足图解与语义列表可读性。验证达到源码、计算样式与浏览器渲染层级；未执行 GPU 实验、所有外文全文复核或完整无障碍认证。

### 全站回归覆盖集合

以下为元数据与 posts 文件去重后的实际集合；“通过”仅指阅读器双宽度与舒适度双主题回归，不表示历史事实全文重验。

| 文章 | 阅读器 | 舒适度 | 本轮技术语义审查 |
|---|---|---|---|
| `agent-inference-systems` | 通过 | 通过 | 未扩大历史核验范围 |
| `agent-rl-survey` | 通过 | 通过 | 未扩大历史核验范围 |
| `attention-evolution` | 通过 | 通过 | 未扩大历史核验范围 |
| `cost-efficient-inference-2026` | 通过 | 通过 | 本轮重点 |
| `custom-inference-engines-2026` | 通过 | 通过 | 未扩大历史核验范围 |
| `diffusion-flow-sampling` | 通过 | 通过 | 未扩大历史核验范围 |
| `inference-evaluation` | 通过 | 通过 | 未扩大历史核验范围 |
| `inference-research-roadmap` | 通过 | 通过 | 本轮重点 |
| `inference-serving` | 通过 | 通过 | 未扩大历史核验范围 |
| `kv-cache-survey` | 通过 | 通过 | 未扩大历史核验范围 |
| `llm-perf-simulation-2026` | 通过 | 通过 | 未扩大历史核验范围 |
| `loop-transformer-survey` | 通过 | 通过 | 未扩大历史核验范围 |
| `moe-survey` | 通过 | 通过 | 未扩大历史核验范围 |
| `parallelism-survey` | 通过 | 通过 | 未扩大历史核验范围 |
| `quantization-survey` | 通过 | 通过 | 未扩大历史核验范围 |
| `realtime-world-models-2026` | 通过 | 通过 | 未扩大历史核验范围 |
| `self-forcing-inference-research` | 通过 | 通过 | 本轮重点 |
| `spec-decoding-post-training` | 通过 | 通过 | 未扩大历史核验范围 |
| `speculative-decoding` | 通过 | 通过 | 未扩大历史核验范围 |
| `strata-hybrid-inference` | 通过 | 通过 | 未扩大历史核验范围 |
| `test-time-compute` | 通过 | 通过 | 未扩大历史核验范围 |
| `training-free-autotune-2026` | 通过 | 通过 | 未扩大历史核验范围 |
| `vit-sparsification` | 通过 | 通过 | 未扩大历史核验范围 |
