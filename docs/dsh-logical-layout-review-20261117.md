# DeepSeek Harness 逻辑排版只读审查

原生会话：`session-1b6323a3-a4b7-4d24-975f-f4293dedf323`。通过 agent-collab 的 CliAdapter，以 read-only 权限调用现有 DSH NEXT 入口；审查的是首轮 188 处修改后的候选。以下为原始报告，行号对应审查快照，修改状态见 [修订记录](logical-layout-20261117.md)。报告中的“未调用模型接口”指 DSH 未另行委派或发起额外模型调用；本次审查本身是真实 DSH 推理调用。46 项与 58 个落点为其自行统计，不表示浏览器验证。

## 结论

21 篇已全部只读核查，确认 **46 个可执行修订条目、58 个文件级落点**；其中 HTML 结构类落点 15 个（`figure` 直接挂在 `ul` 下 8 处、`alt` 被内嵌引号截断 6 处、`p` 内嵌 `div` 1 处），文本结构类问题集中在长段混排、内联 ①②③、note/box 长墙和更新附录单条 li 塞多工作。最严重的是 `training-free-autotune-2026.html` 的 1165 字 TL;DR、`agent-rl-survey.html` 的 ①-③ 混段、`vit-sparsification.html` 的 2123 字时间线 li，以及多篇更新附录的多工作条目；`llm-perf-simulation-2026.html` 未发现实质问题。

本次未修改任何文件、未创建外部资源、未委派 agent、未调用模型接口。行号以 2026-11-17 16:33 的 `posts/` 快照为准；审计期间 `AGENTS.md` 等文件有外部并发改动，与本报告结论无关。

---

## 一、核查口径与证据

- 全量扫描 21 篇，共 **2,040 个 `<p>`、2,556 个 `<li>`、446 个 `note/box/tldr/summary` 类容器**；`.prose-second-pass.json` 的 214 条仅作定位线索，所有结论均回读原文与 DOM。
- 按 `AGENTS.md` 新增 §8 检查：`p` 边界、三项以上并列是否真实列表化、`.note/.box/.tldr` 直接文本、更新附录单条 li、图注是否只说明图表。
- 排除项：完整原文引用、`.citebox`/`.quote`、ASCII 图、代码块、公式链、参考文献条目；不评判事实、不改数字与日期。
- 结构校验结果：21 篇 `p` 配对全部通过（`spec-decoding-post-training.html` 的 151/151 已平衡，未再发现漏 `</p>`）；另发现 `p > div` 1 处、`ul > figure` 8 处、`alt` 异常 6 处、嵌套 `p` 0 处。
- 工具侧有 4 次非零退出，均为 PowerShell ConstrainedLanguage/引号解析问题；已改用直接 `read` 与 Python 解析复核，不影响行号与结论。

---

## 二、系统性 HTML 缺陷（建议最先修）

### S1. `<figure>` 作为 `<ul>` 的直接子元素（8 处）

| 文件 | `<ul>` | `<figure>` | 紧随元素 |
|---|---:|---:|---|
| `posts/agent-rl-survey.html` | 926 | 929 | `<li>` 934 |
| `posts/attention-evolution.html` | 1158 | 1162 | `</ul>` 1167 |
| `posts/inference-serving.html` | 971 | 976 | `<li>` 981 |
| `posts/loop-transformer-survey.html` | 940 | 943 | `<li>` 948 |
| `posts/moe-survey.html` | 1471 | 1477 | `<li>` 1482 |
| `posts/parallelism-survey.html` | 1270 | 1273 | `<li>` 1278 |
| `posts/quantization-survey.html` | 1089 | 1096 | `</ul>` 1101 |
| `posts/vit-sparsification.html` | 997 | 1000 | `<li>` 1005 |

**影响**：`ul` 的直接子元素只能是 `li`；现在 `figure` 是裸子元素，不属于任何条目，列表语义、缩进和阅读器分页都会被打断。6 处 `figure` 后还有 `<li>`，列表被图片切成两段；2 处虽在末条 li 之后，也仍是不合法的结构。

**建议**：把 `figure` 放进对应条目的 `<li>` 内（该条文字之后、`</li>` 之前），或整体移到 `</ul>` 之后；不要留在两个 `li` 之间。只移动标签，不改图注与图片路径。

### S2. `alt` 内嵌 ASCII 引号导致截断/伪属性（6 处）

| 文件:行 | 当前结果 |
|---|---|
| `agent-rl-survey.html:930` | `alt` 截断在“（百”，后半句丢失 |
| `inference-serving.html:977` | 产生 `prefill`、`decode`、`需求比值"的逐分钟变化"` 三个伪属性 |
| `kv-cache-survey.html:1132` | 产生 `读窗口"对比…` 伪属性 |
| `loop-transformer-survey.html:944` | 产生 `有界映"` 伪属性 |
| `speculative-decoding.html:1199` | 产生 `起草-验证-接受"循环（上）与`、`2026`、`年草稿形态的三次进化（下）"` 等伪属性 |
| `vit-sparsification.html:1001` | `alt` 截断在“（融合 RoPE” |

**影响**：读屏软件和图片加载失败时的替代文本不完整；HTML 校验失败，属性解析结果不可控。

**建议**：内层引号统一写成 `&quot;` 或中文引号「」；`alt` 写成一句完整描述，不要把说明塞进其他属性。

### S3. `p` 内嵌 `div.quote`（`attention-evolution.html:383-389`）

```html
<p>……WMT14 翻译质量几乎无损（BLEU 28.5 vs 28.4）……：
<div class="quote">……</div></p>
```

**影响**：`div` 开始标签会强制关闭 `p`，引用块实际落在 `p` 外，末尾 `</p>` 成为游离标签；前后句与引用框的段落样式、间距不再受同一 `p` 控制，阅读器内容测试也会报 `p` 边界错误。

**建议**：在 `div.quote` 前补 `</p>`，删除 `</div>` 后的 `</p>`；引用块保持独立。

---

## 三、逐篇修订清单（44 个文本条目）

### 1. `agent-rl-survey.html`（7 个落点）

- **:269（note 长墙）** 303 字的“直觉性总结”按 2022 RLHF → 2025 R1 → 2025 下半年 Agent → “与此同时”多模态 GRPO 四段推进。**影响**：note 被压成时间线压缩包，最后的“多模态转向”被淹没。**建议**：在“2025 下半年开始”和“与此同时”前断成 3 个短段，或改为 4 项 `ul`。
- **:317（内联编号 + 三主题）** ①SFT/②RM/③PPO 之后又接 PPO 的 2017 出处与 reward hacking。**影响**：流程、历史、局限三层信息压在同一段，读者容易把“PPO 由 Schulman 提出”误读成第三步。**建议**：①②③ 改 `<ol>` 三项；在“PPO 由 Schulman…”前断段，把出处与局限放入下一段。
- **:511（内联编号）** rollout 贵的三层原因 ①GRPO 组采样 ②长回答 ③环境交互，全部挤在一段。**影响**：三个并列成本无法横向比较。**建议**：保留首句定义，三原因改 `ul`，最后“所以优化 RL 基本等于优化 rollout”单独成段。
- **:898（note 长墙 + 学习步骤）** ①-④ 四步学习路径连写在 note 内。**影响**：操作步骤不能勾选、不能编号，读者难以按序执行。**建议**：改 `<ol>` 四项；保留末尾“走完这四步……”的收束句。
- **:948、:949（多工作 li）** 948 一条 li 含 Self-Credit、Mosaic、ReFlow、SPROUT/SERO/RSIPO、KV4-RL、Prorsa、verl、OpenRLHF；949 的“一句话动态”又含 Arctic-SWE、Lean4AgenticRL、KnowGPO、CoHARL、EMNLP 论文。**影响**：一条 bullet 里 4–8 个独立工作，无法逐条引用或扫读。**建议**：948 按“算法 / 系统 / 框架”拆 3 条 li 或每个工作一条；949 拆 4 条 li，或改成“工作 / 日期 / 一句话结果”表。
- **S1 :929、S2 :930**：分别见系统性表格。

### 2. `attention-evolution.html`（4 个落点）

- **:383-389（HTML 破损，最高优先）** `p` 内嵌 `div.quote`。**影响**：浏览器在 `div` 处提前闭合 `p`，引用块与前后句脱节，`</p>` 游离。**建议**：按 S3 修复。
- **:753（孤立数字 / 过度拆分）** MoBA 引用块之后只剩“1M 预填充最高 6.5×，扩展到 10M token 时注意力计算时间降 16×。”，没有主语。**影响**：读者不知道这是 MoBA、NSA 还是本节合计；与 747 行“关键数字：……”的体例不一致。**建议**：合并回 749 行的 MoBA 机制段，或改为“MoBA 的关键数字：……”独立成段。
- **:1097-1102（box 长墙 + 内联编号）** “学习路径建议”用 ①-⑤ 连写五步。**影响**：box 内五步没有可执行的列表结构。**建议**：box 内改 `<ol>` 五项，保留开头一句。
- **S1 :1162**：`figure` 在末条 li 后、`</ul>` 前，见 S1。

### 3. `cost-efficient-inference-2026.html`（1 个落点）

- **:338（note 长墙 + 内联编号）** “引用任何成本数字前问三句”用（1）口径、（2）快照日期、（3）单位连写。**影响**：三个检查项是清单，不是连续叙述，第二问容易被略过。**建议**：note 内改 `<ol>` 三项，保留“引用任何成本数字前问三句：”引导句。

### 4. `custom-inference-engines-2026.html`（3 个落点）

- **:212-214（多工作 li / 年份时间线）** 2023 一条 li 含 vLLM、llama.cpp、TGI、LMDeploy、LightLLM、TensorRT-LLM、Anyscale；2024 含 SGLang、Sarathi、DistServe、Splitwise、Mooncake、DeepSeek-V2/V3、FlashAttention-3；2025 含 DeepSeek 开源周、EAGLE-3、Dynamo、vLLM V1、DSA。**影响**：一条年份 bullet 变成整段技术史，单个工作失去可扫描性。**建议**：保留年份为父项，内部按“框架 / 模型 / 算子”或季度拆嵌套 `ul`；至少把 2023 的 vLLM、TensorRT-LLM、llama.cpp 三条主线分开。
- **:349、:537、:756（图注混杂）** `p.codecap` 在表题后直接接“三个切口洞察 / 三条工程路径 / 三个读数”的 ①②③ 分析。**影响**：图注承担了正文结论，表前先读一段论证，表后没有落点；违背“图注只说明图表”的规则。**建议**：`codecap` 只保留“表 X · 标题（来源、快照）”；把三点分析移到表后的普通 `p` 或 `ul`。
- **:870（note 长墙）** “可以并列比较的只有四类”①-④，后面又接“不可并列的典型错误”三个例子。**影响**：规则与反例混在一个 note，读者分不清哪些是“可比条件”、哪些是“错误示范”。**建议**：前四类改 `ul`；另起一段“不可并列的典型错误”，内部再用 3 项 `ul`。

### 5. `diffusion-flow-sampling.html`（1 个落点）

- **:234（多工作段落）** “工程侧还有两个信号”后接 Microsoft SMD 与 StepX-OPD 两个独立工作。**影响**：两个信号没有对应结构，第二项被压在第一项的长句后。**建议**：改 2 项 `ul`，或拆成两段；两项独立工作不宜继续合写。

### 6. `inference-evaluation.html`（1 个落点）

- **:132（两项对比混段）** 闭环负载与开环负载两个定义在同一段，最后“限制最大并发会把开环输入变成受限输入”只针对开环。**影响**：读者容易把最后一句的限制条件套到闭环上。**建议**：拆成两个 `p`，或 `<dl>` 两个术语；把并发限制的 caveat 留在开环段。

### 7. `test-time-compute.html`（1 个落点）

- **:140（两项对比混段）** 标题是“两种选择规则”，正文把 Self-Consistency 与 Best-of-N 写在同一段；后面的 citebox 只覆盖 SC。**影响**：两个选择规则的边界、各自证据不对等，Best-of-N 没有同等级说明。**建议**：拆成两段或 2 项 `ul`；citebox 保持在 SC 之后。

### 8. `agent-inference-systems.html`（1 个落点）

- **:168（多工作段落）** “评测侧”一段同时写 Δτ-Bench（1,588 任务、42 域、成功率 42.3%）与 tau-bench 2.0（多语言、pass^k）。**影响**：两个 benchmark 更新、两组数字、两个引用挤在一段，分不清哪个数字属于哪个基准。**建议**：拆成两段或 2 项 `ul`，各自保留 cite。

### 9. `inference-serving.html`（4 个落点）

- **:972（多工作 li）** 一条 li 同时写 vLLM 双向 KV 传输（TTFT 2334ms→702ms）与两天后的 NIXL push（再降约 3×、TPOT 约 30%）。**影响**：两个机制、两组数字在同一 bullet，第二组被埋在句尾。**建议**：拆成两条 li，各自保留 `[VLLMBIKV]` / `[VLLMNIXLPUSH]`。
- **:983（note 长墙 / 多主题）** 一个 note 含 ①Dynamo 会话感知推理 ②SOSP'26 的 Janus/LLM-42/ACDC 三篇 ③TokenRouter。**影响**：三类互不相关的内容挤在 347 字 note，SOSP 三篇本身又是三个工作。**建议**：改 3 项 `ul`；SOSP 项内部再列三篇或改成“会议 / 论文 / 一句话”。
- **S1 :976、S2 :977**：分别见系统性表格。

### 10. `kv-cache-survey.html`（3 个落点）

- **:397（box 长墙 + 内联编号）** “时间线里的三条暗线”用 ①②③ 连写算法/系统闭环、KV 身份升级、模型结构为 KV 设计。**影响**：三条判断无法与上面的时间线逐条对照。**建议**：box 内改 `ul` 三项，每项保留加粗主句。
- **:559（内联编号）** “几个工程细节”①块哈希 ②滑窗回收 ③Mamba/混合层块类型，全在一段。**影响**：三个细节跟在代码后，读者难以把细节映射回代码。**建议**：改 `ul` 三项，保留开头“几个工程细节：”。
- **S2 :1132**：`alt` 伪属性，见 S2。

### 11. `llm-perf-simulation-2026.html`（0 个落点）

全量扫描 68 个 `p`、121 个 `li`、24 个提示/来源框；长块均为引用、来源或公式说明，正文段落基本单一主题；更新附录 li 未发现单条并置多个独立工作，也没有 ①-⑤ 同段堆叠。**未发现需要修订的实质问题**，故不计入清单。

### 12. `loop-transformer-survey.html`（5 个落点）

- **:391（多工作 li / 时间线）** “2026 下半年·全面扩散”一条 li 含 ELT、LoopVAE、RecRec、Looped World Models、Thinking with Looped Flows、i-DEQ、DEQ 解混、分形收敛盆、SMELT 等 8+ 工作。**影响**：一个时间线条目变成综述目录，失去时间线粒度。**建议**：按“视觉生成 / VAE / 世界模型 / 理论”拆嵌套 `ul`，或拆成 2–3 个时间线条目。
- **:806（内联编号）** 截断反传的四条候选出路 ①隐式微分 ②逐步自举 ③RL 到迭代 ④可并行时间维展开，全部塞在一段。**影响**：四条研究路线无法横向比较。**建议**：改 `ul` 四项，保留开头“截断反传是……的妥协”。
- **:960、:971（多工作 li）** 960 的“一句话动态”含 4 个工作；971 含 StateLoop、TUM、Inside the Loop、Apple Halting Heads、Cross-Loop Query Handoff、LoopGR、Recursive CLIP、One Model Two Paths 等 8 个工作。**影响**：一条 bullet 无法逐条读或引用。**建议**：按主题拆 li，或改成“工作 / 机构 / 日期 / 结果”表。
- **S1 :943、S2 :944**：分别见系统性表格。

### 13. `moe-survey.html`（4 个落点）

- **:1460（多工作 li）** 一条 li 先写 Qwen3.8-Flash-Next（125B-A6B、512 选 10+1），再用“此外”接 Kimi K2.5（15T 图文 token、K2 结构不动）。**影响**：两个模型挤在一条 li，第二个模型被“此外”隐藏。**建议**：拆成两条 li。
- **:1467（多工作段落）** 一段同时写 MoE-CORE、SSD-LLaMA、华为“Trillion-Parameter MoE in a Box”三个推理系统。**影响**：三个系统、三组数字/条件混排，读者无法比较。**建议**：改 3 项 `ul`，每项保留各自口径。
- **:1276（note 长墙 + 内联编号）** “源码级洞察（三代同堂）”①代码注释 ②topkgating 骨架 ③drop_tokens=False ④fp32 路由权重，368 字连写。**影响**：四个不同层面的代码观察挤在一个 note。**建议**：改 `ul` 四项；把“三代同堂”的结论留作末尾一句。
- **S1 :1477**：见 S1。

### 14. `parallelism-survey.html`（3 个落点）

- **:1231（多工作 li）** 一条 li 含 SwiftMoE、HeterMoE、X-MoE、UniEP、DisagMoE 五个学术工作。**影响**：五个机制差异无法比较，读者只能看到一串名字。**建议**：拆 5 条 li，或按“专家复制 / 解耦 / MegaKernel”分 3 组嵌套 `ul`。
- **:1271（长 li + 机制/版本/证据混排）** 705 字一条 li：NCCL-Extensions 是什么、PyPI 版本 caveat、`nccl_ep`/`nccl_m2n` 两个 API、DeepSeek-V3 基准、结论全在一句长句里；版本注插在主语和谓语之间。**影响**：读者读到 API 名字时已丢失主干，版本与结论互相打断。**建议**：拆成“短 lead（NCCL-EP/M2N 是什么）+ 版本注 + 结果 `ul`”，或 3 条 li。
- **S1 :1273**：见 S1。

### 15. `quantization-survey.html`（3 个落点）

- **:597（内联编号）** GPTQ 的三个实现细节 ①groupsize ②actorder ③静态分组与后续 kernel 结论挤在一段。**影响**：三个参数细节无法扫读。**建议**：三个细节改 `ul`；最后“量化完后权重被打包……”单独成段。
- **:1094（多工作 li）** 一条 li 写 TempoKV，末尾用“同期”接 PulseQuant。**影响**：两个视频 KV 工作、两组数字、两个引用混在一条 bullet。**建议**：拆成两条 li。
- **S1 :1096**：见 S1。

### 16. `realtime-world-models-2026.html`（3 个落点）

- **:324（多主题段落）** “四道题”跑多久/记得住/多模态/进得去，各带 2–3 个例子，全部塞在 279 字一段。**影响**：例子和问题对不上，读者无法按“题”检索。**建议**：改 4 项 `ul`，每项一个“题 + 代表工作 + 结果”。
- **:448（note 长墙 / 多工作）** “同族工作”note 含 Code World Model、Programmable World Model、StatePlay、MASS、OmniDreams、GameDirector，最后才说它们与 Matrix-Game 4.0 的区别。**影响**：读者先被名单淹没，真正的区分点（谁来写引擎）被放在最后。**建议**：按“agent 现场写 / 人工预制”分两组 `ul`，或拆成 2 段；把区别句提前。
- **:634（多工作 li）** Hy-Nomas 一条 li 含 SGLang 主分支、Google TPU、WanGP/Diffusers 移植、Hy-Nomas-Bench 四个平台/工具更新。**影响**：一个生态条目变成四条独立进展。**建议**：拆嵌套 `ul` 或 3 条 li；同类模式还见于 :215 的时间线 li。

### 17. `spec-decoding-post-training.html`（2 个落点）

- **:336（内联编号 + 遗产/局限混排）** ①多头预测 ②并行验证 ③前缀接受三个遗产之后，直接接“只支持贪心解码、需要额外训练”的局限。**影响**：读者容易把局限当成“第四条遗产”。**建议**：三个遗产改 `<ol>`；局限另起一段。
- **:347（多工作段落）** 一段先写 Leviathan 的 α≈0.5–0.75 / bigram≈0.2，末尾“同年 SpecInfer”转写树状草稿与树注意力。**影响**：两个工作、两个机制在同一段，SpecInfer 的边界被埋在句尾。**建议**：在“同年 SpecInfer”前断段。

### 18. `speculative-decoding.html`（2 个落点）

- **:1194（多工作段落 / 工程动态）** 一张 card 内写 DFlash 进 SGLang、TensorRT-LLM 扩 decoding_type、NVIDIA 官方博客、ACL/ICML 多篇（METASD、Speculative Verification、Mine-Draft）。**影响**：“工程侧动态”没有分项，三类信息混在一起。**建议**：按“引擎集成 / 厂商博客 / 会议论文”拆 3 段或 3 项 `ul`。
- **S2 :1199**：`alt` 伪属性，见 S2。

### 19. `strata-hybrid-inference.html`（2 个落点）

- **:194、:195（多工作 li / 时间线）** 2024 一条 li 含 MoE-Infinity、Pre-gated MoE、Gloeckle MTP、Fiddler、ik_llama.cpp；2025 一条 li 含 PowerInfer、KTransformers、T-MAC、MARLIN、Fiddler。**影响**：年份条目变成 4–5 个工作的清单，单个工作无法定位。**建议**：按“论文 / 工程分叉”或半年拆嵌套 `ul`；至少把 MoE-Infinity、Pre-gated MoE、MTP 三条线分开。
- **:475（三项对比混段）** Splash、HyperQwen、ninfer 三个系统在同一段比较（统一内存 / vLLM 肩膀 / 自写引擎），最后才说 Strata 的差异化。**影响**：三个系统的假设、显存要求和适用场景没有对齐，读者难以横向比较。**建议**：拆 3 个短段，或改成“系统 / 假设 / 适用场景”三列表；保留“未作穷尽检索”的 caveat。

### 20. `training-free-autotune-2026.html`（3 个落点）

- **:217-227（tldr 长墙，最高优先）** 1,165 字的 TL;DR：核心收益 + 引用小字 + (1)(2)(3) 本文给出 + 四站流程 + 每一步说明 + 脚手架，全部在一个 `div.tldr` 内，没有 `<p>` 分段。**影响**：摘要比多数小节还长，读者找不到“一句话结论”；引用块和 (1)(2)(3) 也失去层次。**建议**：拆 2–3 个 `p`；(1)(2)(3) 改 `<ol>`；引用小字移到独立 note；TL;DR 只保留核心主张与四站流程名称。
- **:270（多工作 li）** 一条 li 先写 NVIDIA Dynamo（GTC 2025→1.0→v1.5.1），末尾接 TensorRT-LLM 1.0→1.3.0rc25/1.4.0 dev。**影响**：两个框架挤在一条 li，TRT-LLM 的版本信息挂在 Dynamo 段尾。**建议**：拆成两条 li。
- **:273（多工作 li）** 一条 li 含腾讯 xDiT/ncnn/TNN、字节 FlashInfer/veRL/AReaL、Mooncake 三类主体。**影响**：三个公司/三类设施混在一条 bullet。**建议**：拆 3 条 li，或改成“厂商 / 代表项目 / 角色”表。

### 21. `vit-sparsification.html`（5 个落点）

- **:596-623（超长时间线 li，最高优先）** 2,123 字的 ToMe 条目，含机制、原文引用、18 行代码、代码说明、里程碑意义，全部在一条 `li` 内，且有 6 个 ①②③ 编号嵌在代码注释里。**影响**：时间线节奏被一条 mini-section 打断，代码被埋在 bullet 中；读者既不能按时间线扫读，也不方便读代码。**建议**：时间线只保留 1–2 句“ToMe 是什么 + 关键数字”；把机制、引用、代码、代码说明整体移到 §3.x 的独立小节或 `<details>` 中，不要把这些内容改成列表。
- **:919（多工作 li）** 一条 li 写 TensorRT-LLM v1.4.0rc0，末尾接 SGLang v0.5.22 的 DiT INT8 W8A8。**影响**：两个引擎更新挤在一条 bullet。**建议**：拆成两条 li。
- **:920（多工作 li）** “一句话动态”含 FoveaTree、CatchUp、TokenGate、Offline Makes Online Better、Are We Evaluating VLM Token Pruning Right? 五个工作；:1008 的“外溢”同样含 VLA-ACL 等多项。**影响**：一条 bullet 无法逐条读或引用。**建议**：拆 li 或改成“工作 / 机构 / 日期 / 结果”表。
- **S1 :1000、S2 :1001**：分别见系统性表格。

---

## 四、逐篇覆盖统计

“落点”含系统性问题在本文件内的位置；因此 46 个条目对应 58 个落点。

| 文章 | p / li / 框 | 落点 | 说明 |
|---|---:|---:|---|
| `agent-inference-systems.html` | 47 / 55 / 20 | 1 | 评测侧两个 benchmark 同段 |
| `agent-rl-survey.html` | 96 / 137 / 36 | 7 | 5 条文本 + S1 + S2 |
| `attention-evolution.html` | 117 / 166 / 13 | 4 | 3 条文本（含 p>div）+ S1 |
| `cost-efficient-inference-2026.html` | 98 / 186 / 32 | 1 | note 内三问 |
| `custom-inference-engines-2026.html` | 168 / 199 / 63 | 3 | 年份 li、图注、note |
| `diffusion-flow-sampling.html` | 49 / 67 / 10 | 1 | 两个工程信号同段 |
| `inference-evaluation.html` | 41 / 45 / 17 | 1 | 闭环/开环同段 |
| `inference-serving.html` | 114 / 148 / 52 | 4 | 2 条文本 + S1 + S2 |
| `kv-cache-survey.html` | 145 / 184 / 12 | 3 | 2 条文本 + S2 |
| `llm-perf-simulation-2026.html` | 68 / 121 / 24 | 0 | 长块均为引用/来源/公式说明，未见实质问题 |
| `loop-transformer-survey.html` | 107 / 180 / 4 | 5 | 3 条文本 + S1 + S2 |
| `moe-survey.html` | 102 / 103 / 17 | 4 | 3 条文本 + S1 |
| `parallelism-survey.html` | 130 / 128 / 10 | 3 | 2 条文本 + S1 |
| `quantization-survey.html` | 114 / 176 / 9 | 3 | 2 条文本 + S1 |
| `realtime-world-models-2026.html` | 96 / 126 / 41 | 3 | 四道题、同族 note、生态 li |
| `spec-decoding-post-training.html` | 151 / 70 / 3 | 2 | 三遗产、Leviathan+SpecInfer |
| `speculative-decoding.html` | 137 / 88 / 10 | 2 | 工程动态 + S2 |
| `strata-hybrid-inference.html` | 78 / 100 / 23 | 2 | 年份时间线、三系统对比 |
| `test-time-compute.html` | 51 / 55 / 18 | 1 | SC / Best-of-N 同段 |
| `training-free-autotune-2026.html` | 52 / 90 / 8 | 3 | TL;DR、Dynamo+TRT、三主体 li |
| `vit-sparsification.html` | 79 / 132 / 24 | 5 | 3 条文本 + S1 + S2 |

---

## 五、建议修复顺序

1. **HTML 结构**：S1 的 8 处 `figure/ul`、S3 的 `attention:383-389`、S2 的 6 处 `alt`。先修标签，避免后续文本调整与结构问题互相干扰。
2. **超长块**：`training-free:217-227`、`agent-rl:317`、`vit:596-623`、`custom:212-214`、`parallelism:1271`。
3. **更新附录多工作 li**：`agent-rl:948/949`、`loop:971/960`、`realtime:634`、`vit:920`、`strata:194/195`、`training-free:270/273`。
4. **内联 ①②③**：`agent-rl:511/898`、`cost:338`、`kv:397/559`、`moe:1276`、`quant:597`、`spec-post:336`。
5. **两项对比与图注**：其余条目按文章逐条处理；两项对比优先拆段而非强行列表。

---

## 六、未完成项与边界

- **未做浏览器视觉复核**（375px、浅色/深色、无 JavaScript 阅读器）：本次是源码与 DOM 结构审查，不声称做过渲染截图验证。
- **未做事实核验**：没有改数字、日期、版本、技术判断，也没有扩大核验日期。
- **未修改文件**：本 agent 未写入任何文件；审计期间 `AGENTS.md` 等有外部并发改动，`posts/` 的 mtime 稳定在 16:33:16。
- **未委派 agent、未调用模型接口、未发布**。
- 工具侧 4 次非零退出均为 PowerShell 引号/ConstrainedLanguage 问题，已用直接读取复核；不影响行号与结论。

## 交付文件/目录

无文件产物（只读审查，未创建或修改文件）。

```json
{"version":1,"nonce":"blog-prose-audit-20261117","summary":"只读审查 21 篇，输出 46 个修订条目、58 个文件级落点；未修改文件。","files":[]}
```
