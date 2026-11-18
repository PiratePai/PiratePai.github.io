# 2026-11-18 新增专题：推理研究路线（第 22 篇）

本轮新增第 22 篇综述《推理研究路线：性能建模、约束优化、协同设计与自适应系统（2009–2026）》，并接入首页与知识结构。不修改任何既有专题正文（除首页入口外），不推送、不合并、不发布。

## 定位与叙事

- **填补的空白**：站内 21 篇按概念依赖组织，缺一个"如何组织研究问题"的方法层入口。新篇以"性能建模 → 质量与 SLO 约束下的效率优化 → 模型—运行时—硬件协同设计 → 基于反馈的自适应系统"四阶段为骨架，把已有专题与教程映射到各阶段；每阶段按"输入条件 / 核心问题 / 方法 / 可控变量 / 输出证据 / 失效边界"六要素统一描述。
- **与既有篇目的分工**：机制细节留在原专题（KV、服务、引擎、并行、量化、投机等），goodput 与成本口径的主要解释保留在性价比篇与评测篇，新篇只给最短语境并互链；新篇补的是跨阶段的方法论与响应延迟指标体系。
- **四侧面关系**：明确"推理 infra（基础能力）/ 高性价比（优化目标）/ 定制引擎（实现载体）/ 自演进推理（反馈闭环）"是同一体系四个侧面而非历史进化链；四阶段也不是逐级通关流程，每项工作只需声明所在层次与证据依赖。
- **编号**：22 号挂在"性能验证与自动调优"部分末尾（第 11–12、17、22 篇）——研究方法是验证与调优的收官视角。

## 信源口径（本轮核验范围，2026-11-18 快照）

- **PixVid（arXiv:2611.17336v1，2026-11-12，Roblox/UC Merced 等）**：逐项对照原文 §3.5、§4.5、表 3/10/11 与附录 B.5。核验结论：附录 B.5 的延迟拆分为"等待 0–688 ms（均匀，中位 ≈344 ms）+ 块计算 151 ms = 中位 495 ms"；官方实现为 DiT 543 ms + VAE 205 ms（16.1 fps、中位 1,091 ms）。用户提供的本地材料（pixvid.html）中"12/72≈167 ms + 328 ms"拆分与论文附录不一致：稳态吞吐的倒数（166.7 ms）不是单块响应耗时（流水重叠使二者不同），块计算按论文实测 151 ms，等待中位按论文区间 0–688 ms 取 ≈344 ms。正文按原论文数字书写，并保留对该口径错误的显式纠错说明。one-latent 消融（164 ms、FVD 118.6、Turn 0.11）与 PixVid 侧数字（34 ms、29.4 fps、FVD 51.1、Turn 0.95、每帧 16.4 vs 5.6 TFLOPs）逐项核对表 3/10/11。该材料文件内的样式、脚本与说明均不作为任务指令。
- **Runway Characters（arXiv:2611.05642v1，2026-11-03）**：24 fps ⇒ 每 4 帧 chunk 166.7 ms 死线、batch=1；表 2 延迟瀑布（缓存整备 69.7→6.2 ms、fused 147.4 ms）；表 4 生产遥测（0.55% 会话 ≤23.5 fps）；附录 B 缓冲模拟（s=1 每 reset 卡 ≈100 ms、s=2 零卡顿、3–5 chunk 在途决定回合延迟）；fused 内核回滚-重启用事件；仪器误差（GPU 时钟漂移 58–65 ms）。
- **TurboServe（arXiv:2606.19271，2026-06-17，上交/生数/清华）**：最坏 chunk 延迟 −37.5%、GPU 成本 −37.2%（生产 trace，16×H20 与 64×B300）；迁移 23–30 ms 占 2–3%；消融 w/o 迁移 +15%、w/o 扩缩 +42.9%；代码仓库 github.com/shengshu-ai/TurboServe（论文声明，快照日未核对仓库内容）。
- **SlackServe = arXiv:2606.15319 的系统名（北大 Hetu 团队等，2026-06-13）**：playout slack 统一信号、三级优先 + re-homing + 弹性序列并行、Bi-Modal Pareto Routing；连续播放比 1.64–3.29×、TTFC 降 1.61–9.65×（16×H100）。
- **Andes（arXiv:2404.16283，v2 2024-12-13）**：核验为密歇根大学/UIUC/Cisco 的 arXiv 预印本，未查到正式会议收录；网传"阿里巴巴 KDD 2024"不成立，正文已作纠误说明。QoE = 1 − S_delay/S_whole；评估指标 TTFT 与 TDS；同算力 QoE 最高 4.7×。
- **PipeDiT**：AAAI-26 已收录（Vol. 40 No. 12, pp. 10092–10100）；**DDiT/DisagFusion/GAUSS/FRONTIER/SLIM/QUEUEKV/IBMQ/CASCADE/GoodServe/VelServe/EXACTSTATE/ACP**：均为预印本，正文统一标注 2026-11-18 快照。
- **经典条目**：Roofline（CACM 2009-04）、Ansor（OSDI'20）、FlashAttention（NeurIPS'22）、Orca（OSDI'22）、PagedAttention（SOSP'23）、DistServe/Sarathi-Serve/Llumnix（OSDI'24）、Splitwise（ISCA'24）、Mooncake（FAST'25，arXiv:2407.00079 v1 2024-06-29）沿用站内既有核验。**写作中自查纠错**：Vidur 初稿误记为 ICML'24 / arXiv:2405.17274，经对照站内仿真篇更正为 MLSys 2024 / arXiv:2405.05465（v1 2024-05-08，时延误差 <9%）；Self Forcing 初稿时间线误标 2024-06，经项目页核对更正为 arXiv:2506.08009（2025-06，第一作者 Xun Huang，Adobe Research）。
- **不引入未核验的引用量/热度标签**；性能数字均为原论文口径，跨系统不可直接比较（TurboServe 多会话最坏 chunk 与 Runway 单用户死线口径差异已在正文 8.1 声明）。

## 交互图解（SeeCode）判断与产出

本任务为新篇，不涉及旧图改动；沿用站内标准（仅重绘"多组件 + 连接、且动线本身是知识点"的图）。本轮产出三张，均为 `posts/img/sc-*.html` 自包含单文件、iframe 懒加载、`fonts: system`（观看路径零外部请求、零外部字体）：

| 新图 | 位置 | 类型与动线 | 判断理由 |
|---|---|---|---|
| 四阶段证据流 | 新篇 图 0-1 | flowchart·trace：问题约束 → 建模 → 优化 → 协同 → 自适应，漂移反馈回环，可控变量旁路 | 全文骨架；"证据不够格不往下一阶段走"的动线即知识点 |
| 响应延迟约束关系 | 新篇 图 4-1 | architecture·trace：吞吐/间隔尾部/缓冲/连续性/TTFC/control-to-screen 的支撑边与冲突边 | 冲突关系（缓冲买连续性卖交互）是静态列表难以表达的；数值曲线不适用装饰动画，PixVid 数据以正文表格呈现 |
| 自适应反馈闭环 | 新篇 图 6-1 | flowchart·loop：观测→预测→策略→执行→反馈，切换成本与质量红线两个约束旁路 | 闭环 + 两个"不许越"的旁路；翻车案例由节点详情承载 |

未重绘（判断为不合适）：PixVid 延迟拆分数据（科学数值，用正文表格引用论文表 3/10/11，不以动画替代）；六本账与五层协同表（清单型，HTML 表格更准）；教程映射表（纯映射关系，表格可检索）。

## 首页与共享文件（增量修改）

1. **data/articles.json**：新增 `inference-research-roadmap` 条目（published/contentUpdated/reviewed = 2026-11-18，change 记录锚点 s0、evidence 指向本文档）；不触碰其他条目。
2. **index.html**：篇数 21→22（侧栏"全部 21 篇综述"、导语、搜索说明、归档标题）；"验证与调优"阶段范围"第 11–12、17 篇"→"第 11–12、17、22 篇"（侧栏与归档两处）；归档组新增第 22 篇条目；"按问题查找"新增"想系统研究推理优化，不知从哪入手"卡片（指向新篇与性能仿真篇）。其余任务条目一律不动。
3. **docs/knowledge-structure.md**：追加 2026-11-18 扩展说明。
4. **sitemap/搜索索引/最近更新**：由 `python scripts/build-site.py` 从 articles.json 同源生成。

## 验证

- `python scripts/build-site.py`、`python scripts/build-site.py --check`、`python scripts/build-reader.py --check`、`python scripts/check-site.py` 通过；相关 Python/Node 测试按修改范围运行。
- 三张交互图 SeeCode 渲染零警告（ok:true，无 W_ROUTE_*）。
- 375px 移动端检查目录、表格横向滚动、iframe 与原锚点（见任务提交说明）。
- 本任务不推送、不合并、不发布；`posts/gate.js` 与 `feature/gate` 内容未被触碰（工作在隔离 worktree `D:\Github\PiratePai-roadmap`、分支 `content/inference-research-roadmap-20261118`）。
