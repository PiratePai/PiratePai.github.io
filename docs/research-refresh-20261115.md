# 2026-11-15 研究增补：20 篇专题统一刷新

本轮覆盖站内全部 20 个专题，检索窗口以 **2026-10-29 → 2026-11-15** 为主，另补录 10 月中下旬漏项（Reflection Beam、KTransformers v0.7.2、混元 Prism、Microsoft SMD、FlashInfer v0.7.2）。每篇新增内容：前沿亮点卡片（hl 区）、正文快讯（16 篇模式文章进"更新附录"的「⚡ 11 月上旬快讯」小节；custom-inference-engines、strata-hybrid-inference、realtime-world-models 三篇无附录文章在参考文献前新增 `#research-20261115` 节；四篇 11-04 教程文章在相关章末加「前沿增补」小节）、以及文末「2026-11-15 增补来源」引用块（键位 `R26B-*`，沿用 11-03 的 `R26-*` 惯例）。

## 检索与筛选口径

- 优先级：字节跳动 / 腾讯 / 英伟达等大厂官方开源与发布 > DeepSeek/Moonshot/阿里 Qwen/Meta/AMD/微软等官方一手 > 顶会论文（NeurIPS 2026 接收、WACV 2027、ICONIP 2026、EMNLP 2026）> 高关注 arXiv 预印本。
- 所有条目要求可验证的来源 URL（官方博客 / GitHub release / arXiv abs 页 / 官方 X 公告）；关键条目（vLLM v0.33.0、SGLang v0.5.23、Kimi K3.1 Pro day-0、Hy4 正式版）由主编二次直接核验原文。
- 二手转述（Mistral Large 4 参数口径、ForeSpark 的 Meta 归属、Genie 3 第三方 FPS 对比、tau-bench 2.0.0）均就地标注"二手转述"；日期以一手落点为准。
- 检索明确未检出的方向不硬凑：字节窗口内无新推理引擎类开源；Genie 4 无后续硬数字（仍限 trusted tester）；MLPerf Inference 最新仍是 v6.1（2026-09-16）；TensorRT-LLM 无新稳定版（停在 v1.2.1，v1.4.0rc3 指向 11-03 commit）。

## 逐篇新增（主题与判断边界）

| 专题 | 新增要点 |
|---|---|
| 推理服务 | K3.1 Pro 权重开放+day-0（AgentX/DCP/零失配 RL）；SGLang v0.5.23（Paged Experts、megakernel）；NEAR AI SGLang RCE 事故；vLLM v0.33.0。安全事件与性能发布分开陈述。 |
| 定制引擎 | Dynamo 逐模型 dev 分支与 TRT-LLM 停更口径；vLLM/SGLang 双周节奏；DeepInfer 仓库动态。稳定版与 RC 不混称。 |
| 混合推理 | Paged Experts 吸收专家卸载（12–30× vs CPU offload）；AdaOffload 多 GPU；llama.cpp moe-cache 子系统化；补录 KTransformers 训练侧。 |
| 投机解码 | ForeSpark 预算联合调度；K3.1 Pro 官方 DSpark 草稿；vLLM v0.33.0 方法官方化。 |
| 草稿后训练 | SpecOPD 分支并行 OPD；REAL/TVP 损失研究潮。 |
| KV Cache | K3.1 Pro sparse-MLA 结构；LowRAM；ADKV（NeurIPS 2026）。 |
| 量化 | BitDecoding-FP4（爱丁堡+腾讯）；对齐坍塌（NeurIPS 2026）；FlashInfer NVFP4 全栈。 |
| 注意力 | Bifocal 等内存对比（论战后续）；Hy4 GA；SinkState；Pavlichenko 长文。 |
| MoE | K3.1 Pro 权重；700B–1T 开源密集期；HF MoE 手册。 |
| Loop | NVIDIA Dory1.0-4B；字节 Cola2 权重。 |
| ViT 稀疏化 | AB-Attention；港大少步免训练剪枝；补录混元 Prism。 |
| 并行通信 | NCCL 2.32.6-1+路线图；vLLM 弹性 EP；K3.1 Pro DCP。 |
| 性能仿真 | SIMPLE 能耗定律；StepSplit 请求级归因；LM-SimBench。 |
| 自动调优 | Together Compiler 持续编译；KernelMosaic 数据集。 |
| Agent RL | Targeted Guidance；tokin；零失配 RL。 |
| 世界模型 | NVIDIA Cosmos 交互仿真；World Labs Atlas/Frameboy；Hy-Nomas 生态（SGLang+TPU）。 |
| 推理预算 | Fable 5.2 effort 档位；ADP-HT；SC 门控负结果。 |
| Agent 推理系统 | Evolving Infra；Δτ-Bench；tau-bench 2.0.0。 |
| 评测 | SemiAnalysis TPUv7 AgentX；AMD 官方调优记录；厂商自提交口径警示。 |
| 扩散采样 | AGAVE（1-NFE）；History Forcing；SMD/StepX-OPD。 |

## 叙事逻辑与冗余核查

- **跨篇重复**：50 字级滑窗扫描仅命中自动生成的维护信息块（`data/articles.json` 同源渲染，属设计内）与既有的 arXiv 核验脚注套语；未发现正文级重复段落。Kimi K3.1 Pro 等大事件在 6 篇中出现，但各篇取不同侧面（服务数字 / 草稿模型 / KV 结构 / DCP / 零失配 RL / 权重开放），为有意的多视角覆盖而非冗余。
- **篇内重复**：注意力篇"93.3%/5.76× 为整模型对比口径"的提醒在时间线、引用框与表格脚注各出现一次，属"数字出现在哪、口径提醒跟到哪"的既有规范，保留。
- **首页叙事**：hero → 在线书入口 → 按问题查找 → 五阶段路线 → 最近更新 → 知识结构目录的层级经 11-04 多轮评审定型，本轮仅由 `articles.json` 驱动"最近更新"刷新，未改动导航文案；无新增冗余。
- **快照式表述**：附录中"截至 10-28 未发布 v0.5.23 tag"等带日期快照保留原文（附录导语已声明按原资料快照保留发布脉络），本轮新条目给出 11-02 发布事实，时间线自洽。

## 交互图解（SeeCode 重绘）

判断标准：仅重绘"多组件 + 连接、且动线本身是知识点"的静态架构图（CSS/SVG 手绘），不重复已有的四张 core-visuals 交互图（ZeRO / KV 分页 / MoE 路由 / 投机采样），简单 2–3 盒流程保留手绘版。站点无 Mermaid 图（全站 0 处），不涉及。

| 新图 | 位置 | 替代/补充对象 | 类型与动线 |
|---|---|---|---|
| P/D 分离架构请求全路径 | 推理服务 图 5-2 | 补充图 5-1 静态速览 | architecture·trace：prompt → Prefill 池 → KV 块 RDMA → Decode 池 → 流式返回 |
| Strata 三级存储取用路径 | 混合推理 图 3-2 | 补充图 3-1 全量布局 | architecture·trace：缺失专家 → PCIe DMA → 内存 pinned → CPU 计算 → 写回；NVMe mmap 预读 |
| Agent RL 数据飞轮运转顺序 | Agent 与 RL 图 2-2 | 补充图 2-1 六环节总览 | architecture·trace：任务下发 → rollout×环境 → 奖励 → 训练 → 权重热载闭环 |
| 注意力结构演进时间线 | 注意力 图 0-1 | 本章大事记（文字时间线）的图形对照 | timeline·trace：2014–2026 十二事件、三时期分段 |

四张图由 SeeCode 生成（自包含单文件 HTML，`posts/img/sc-*.html`，已剥离外部字体链接、系统字体回退，`iframe` 懒加载嵌入；观看零外部请求。页面内的 GIF/MP4 导出按钮在离线时不可用，属查看之外的附加功能）。原有静态图保留为无脚本回退与快速浏览路径。图表编号沿用章-序号顺延（5-2 / 2-2 / 3-2 / 0-1），无需改动既有编号。

## 明确不采的信源

- SGLang 核心团队 RadixArk 融资、vLLM a16z 融资传闻（TechCrunch 二手、金额未证实）。
- "Decart Mirage LSD-V2 系 11 月发布"（单一 Facebook 二手，无官方落点）。
- Seedance 2.5 "4K 电影级测试"（二手与官方口径混杂）。

## 验证

- `python scripts/build-site.py`（动画、图解、阅读器、元数据、搜索索引同源重建）与 `python scripts/check-site.py` 通过后发布。
- 未执行 GPU/NPU 复测；各条目数字均按论文/官方发布口径转述，跨系统数字不可直接比较的提醒沿正文惯例保留。
