# 2026-11-01 技术综述修订

本次依据 `spec/review/REPORT.md`、16 份单篇报告与争议复核，对 16 篇已发布 HTML 进行修订。原始审阅材料位于作者研究工作区，不是本站的公开依赖。

修改直接落实在原错误位置，并同步处理摘要、小结、图注和比较表。没有以重新打分代替修订，也不将主观质量评分当作已验证结果。

## 阅读结构与研究取舍

- 每篇增加具体的阅读路径、术语铺垫、可手算例子和路线比较表；比较省掉什么、付出什么、怎样证伪收益。
- DeepInfer 篇恢复预备知识→历史→通用技术栈→具体引擎的正文顺序。
- 13 篇将完整或局部发布摘要移到文末可展开的更新附录；16 篇开头的前沿亮点均可折叠。原有章节、图片和深链接保留，跳到折叠内部的锚点会自动展开。
- 补充 vAttention、多 LoRA 服务、RLOO、Search-R1、Performer、QuIP/QuIP#、QLoRA、ALBERT、Pause Tokens、iCoT、STA、TaylorSeer、DART、WorldMem 等谱系。新增阅读资料就地给出作者、正式题名、arXiv 与首发日期。
- 删除部分热度票数的价值暗示，将普遍最优/行业必选等判断改为带资源、任务、质量条件的研究问题。

## 逐篇对应

| 文章 | 机制、证据及叙事修订 |
| --- | --- |
| [推理服务](../posts/inference-serving.html#reading-path) | 一次 decode 是完整模型前向；token 与字符分开；分块不保证恒定耗时；CUDA Graph 非零启动；修 JSON 字符串与下推解析；Sarathi 作者；DistServe 7.4× 的 DeepSpeed-MII 基线与 KV 传输分母；EPD 的 TTFT 口径；补可算的 top-p/min-p 例子。 |
| [定制推理引擎](../posts/custom-inference-engines-2026.html#reading-path) | FlashAttention 线性中间空间与二次参数化 IO 分开；MLA 69,120 B/token；vLLM V1 Python 调度器；投机加速条件与 Medusa 分类；FastV 视觉 token/系统提示观察；FastGen 正式题名和日期；Wide-EP、SWA replay、DSA 前缀复用边界；撤回跨系统倍数贡献分解。 |
| [CPU–GPU 混合推理](../posts/strata-hybrid-inference.html#reading-path) | GDN 状态右乘次序与维度；QSA 索引仍随长度增长；门铃属于同步协议；专家选择比例与激活参数比例；MoE 验证专家并集；SSD 读取延迟；Amdahl 与并发关键路径；MoE-Infinity 作者及 venue；“投机无损”限于同执行配置。 |
| [KV Cache](../posts/kv-cache-survey.html#reading-path) | 重写 YOCO 全局 KV 来源与 O(N+CL)；InfiniGen 跨层预演；MLA 矩阵吸收；缓存字节不等于可部署容量；前缀复用前提；分页残余浪费；Gemma 全局层仍增长；量化质量边界；RAQ-MLA 的推理/代码与检索退化分开。 |
| [注意力](../posts/attention-evolution.html#reading-path) | RoPE 作用 Q/K；Delta 梯度方向；GQA 为 g/h；RetNet 固定衰减与 Mamba-2 数据依赖门分开；固定状态维度与数值干扰分开；线性注意力版本史；MiniMax-01/M1；FA4 已有预印本；核化示意与完整归一化数值例子分开。 |
| [量化](../posts/quantization-survey.html#reading-path) | 统一 signed/unsigned 编码；GPTQ 搜索 p=1.00..0.21；AWQ 矩阵朝向；V3 混合精度保留；KIVI 分组轴；ViDiT-Q 静态—动态通道平衡与实验对象；SVDQuant 分解变换后权重；QATFactory 正式题名；撤回不清楚绝对/相对定义的 90% 比较。 |
| [MoE](../posts/moe-survey.html#reading-path) | top-1 再归一化会消除主任务门控梯度；均匀损失是参考值而非下界，并给反例；Qwen3 使用 global-batch loss；偏置间接影响训练；Expert-Choice 的 softmax/选择轴；CogVideoX 模态 AdaLN；分位数均衡不保证一步精确达标。 |
| [并行与通信](../posts/parallelism-survey.html#reading-path) | 修气泡分母、异步 TP 重叠依赖、ZeRO 参数 AG/梯度 RS、SP 的比较基线、DP/EP rank 重复计数、dispatch 顺序、MFU/HFU、SP/CP；INC-MoE 注明第五个加速器模拟交换机与通信时间口径。 |
| [投机解码](../posts/speculative-decoding.html#reading-path) | 修 KV 增量计算、随机接受与残差修正、最坏情况可能慢于 AR；Medusa typical acceptance 非严格同分布；拆 EAGLE 版本；DFlash 的 1 锚点+15 草稿与下一轮锚点；MTP 有额外成本；补系统感知前史。 |
| [投机后训练](../posts/spec-decoding-post-training.html#reading-path) | i.i.d. 几何期望与墙钟加速分开；高熵不必低接受率；DistillSpec 学生 on-policy 和两种温度；EAGLE 固定数据与可选特征噪声；42MB 非全部可训参数；DSpark 条件接受率/前缀存活与非前瞻选择；D-PAL 序列权重；拆开两组混写的论文。 |
| [Agent RL](../posts/agent-rl-survey.html#reading-path) | GRPO 奖励标准化而非排名；R1/R1-Zero；GLM-4.5 的 GRPO 与格式惩罚；HybridFlow 编号；训推布局转换而非“推理必须完整权重”；AReaL 可派发余量与三策略分工；Flow-GRPO 随机初始条件与逐步随机转移分开。 |
| [Loop Transformer](../posts/loop-transformer-survey.html#reading-path) | Yang 任务输出损失而非正确隐藏状态监督；Huginn 预训练与噪声负结果；Coconut n+1 次前向；等深经验与理论额外资源条件；PLT 依赖改写；最小示例的掩码/残差；输入注入为设计选择；系统卡不作闭源循环架构证据。 |
| [实时世界模型](../posts/realtime-world-models-2026.html#reading-path) | WorldPlay RCM/Context Forcing；Matrix-Game 2.0 编号/日期；Plücker 叉乘；零噪声不等于事实正确；显式状态不等于视觉身份持久；少步非全部一步；CtrlCache 与单步不默认兼容；FPS/块耗时/动作延迟分开；Oneira 用 dB 与比较限制。 |
| [ViT 稀疏化](../posts/vit-sparsification.html#reading-path) | ToMe 比例注意力补质量而非温度；ToMeSD 模块前合并/后展开与输入特征匹配；TeaCache 年代/经验阈值；SVG 窗口/FP8；Triage PSNR 相对其他近似基线与 NVFP4 残差校正；线性/SSM 不能说固定原始邻居；总成本线性/二次项分开。 |
| [性能仿真](../posts/llm-perf-simulation-2026.html#reading-path) | AI≈2m/b 的权重主导条件；476GB 改成可追溯的约 280.91GB 简化骨干载荷；撤回错误 KV entry 精确分解；DiT 分 token 与 timestep 投影并复算；174.8s 为四请求总 wall time；prefix 乘 (1−h)；波量化惩罚乘法；TP/EP 通信；Vidur 编号与指标；未校准图示不作容量承诺。 |
| [自动调优](../posts/training-free-autotune-2026.html#reading-path) | 免目标模型训练与改权重表示分开；AI/硬件平衡点；1.21× 追加预算与 0.74×/0.51× 匹配预算；61/85 回退分母；DiT 51.8/56.917s；质量验收非等价证明；固定 3% 只是待标定启发式；案例明确为方案，未编造 ZCode 实跑。 |

## 承重引文口径

跨篇统一：DeepSeek-V2 的 42.5% / 93.3% / 5.76× 是相对 DeepSeek 67B 的整模型结果；PagedAttention 的 2–4× 是原论文特定设置、同延迟下相对 FasterTransformer/Orca 的系统吞吐，不能当作任意分页开关的收益。

主要一手核查落点：

- [FlashAttention v2 定理 2](https://arxiv.org/html/2205.14135v2)：空间、IO 和计算复杂度分开；M 是 SRAM 容量参数。
- [YOCO v2 §2](https://arxiv.org/html/2405.05254v2)、[InfiniGen v1 §4](https://arxiv.org/html/2406.19707v1)：跨层共享与预取的真实来源。
- [Gated DeltaNet v1 §3.1 式 8](https://arxiv.org/html/2412.06464v1)：S 为 d_v×d_k，键方向更新在右侧。
- [Sarathi-Serve 正式记录](https://www.usenix.org/conference/osdi24/presentation/agrawal)、[DistServe §6.2–6.3](https://www.usenix.org/system/files/osdi24-zhong-yinmin.pdf)：作者、比较基线与延迟分母。
- [GLM-4.5 v1 §3](https://arxiv.org/html/2508.06471v1)、[Qwen3 v1](https://arxiv.org/html/2505.09388v1)、[CogVideoX v3 §2.2](https://arxiv.org/html/2408.06072v3)：算法/均衡机制/Expert AdaLN。
- [Medusa](https://arxiv.org/html/2401.10774)、[DSpark v1](https://arxiv.org/html/2607.05147v1)：近似接受、条件置信度与自适应选择前提。
- [WorldPlay v1 §3.3–3.4](https://arxiv.org/html/2512.14614v1)、[Triage v1](https://arxiv.org/html/2610.35706v1)、[RAQ-MLA v1](https://arxiv.org/html/2610.33625v1)：记忆机制、近似基线与质量任务范围。
- [Evolving Agent Teams v1 §4.2–4.3](https://arxiv.org/html/2610.36848v1)、[KernelOPT v1 §6.2](https://arxiv.org/html/2609.30059v1)：预算与分母。

本次还核对了 73 个 arXiv 条目的题名、作者及提交记录，记录在 [来源元数据](research-quality-sources.json)。**身份核验不等于每条机制、原文摘录、性能数字全部验证**；该文件不为旧文全部约 800 条引文背书。

## 验证及边界

```text
python scripts/verify-mechanisms.py
python scripts/check-site.py
```

- 标准库数值例子验证归一化因果核注意力的两种计算形式、非方阵 GDN 更新、量化前 AWQ 等价缩放、量化编码、固定上下文拒绝采样及教学账本。
- 静态检查首页与 16 篇文章的本地链接/图片、唯一锚点和内联 JavaScript 语法。
- Edge 无头浏览器在 1440px、375px 检查 17 页；包括展开更新、深链接自动展开、图片、页面脚本错误与横向溢出。窄屏表格使用局部滚动。
- 未执行训练、GPU/NPU 性能复现或作者调优案例；图示与简化账本不作为真实部署容量承诺。Huginn 嵌入的 PyTorch 节选只做静态修正，独立标准库脚本覆盖的是数值机制。
- 未绑定 commit 的历史源码节选明确作为教学示意；不补造历史 SHA。未定位来源的旧发布数字降为检索线索。Hawkeye 的正文访问受限，保留定位链接并撤回未复核数字。

本次以 PR 交付，合并后由仓库现有 GitHub Pages 链路发布。
