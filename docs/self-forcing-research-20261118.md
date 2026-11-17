# 2026-11-18 新增专题：Self Forcing 流式视频推理（第 22 篇）

本轮新增第 22 篇综述《Self Forcing 流式视频推理：六维建模与响应延迟研究方案（2025–2026）》，并在首页"研究延伸"部分接入。本篇是**文献与源码研究 + 研究方案设计**：不运行模型，不做性能/质量实验，不交付推理适配器或压测平台。

## 定位与叙事

- **填补的空白**：站内 21 篇中，自回归视频扩散的推理侧系统建模（块执行链、KV/VAE 状态账本、响应延迟分解）无专文覆盖——实时世界模型篇（§5 serving 生态）与 ViT 稀疏化篇（UnStep/MonarchRT）各取一角，KV/量化/服务篇是 LLM 侧通用机制。新篇以官方 Self Forcing（Wan2.1-T2V-1.3B 衍生）为唯一主线案例，把**存算比、宽容比、异构分离、KV 缓存、VAE 显存、响应延迟**统一成"一条执行链的六个截面"，全部公式配源码形状推算数字。
- **与既有篇目的分工**：训练/蒸馏细节归扩散采样篇与 CausVid/Self Forcing 论文；KV 通用机制归 KV Cache 篇；KV 压缩方法地图归量化篇；serving 生态归世界模型篇；新篇只做"Self Forcing 案例上的六维建模 + 研究设计"，重叠处互链不重写。
- **阅读路线**：编号 22 挂在研究延伸部分（第 13–16、18–20、22 篇），与第 15 篇（实时世界模型）互为"机制篇/系统篇"两半。

## 信源口径（本轮核验范围，2026-11-18）

- **源码核对（静态阅读，非运行验证）**：`guandeh17/Self-Forcing` commit `33593df`（main，2025-09-12 后无新推送；3,564 star、Apache-2.0）。逐文件核对 `configs/default_config.yaml`、`configs/self_forcing_dmd.yaml`、`inference.py`、`demo.py`、`pipeline/causal_inference.py`、`wan/modules/causal_model.py`、`wan/modules/vae.py`、`utils/wan_wrapper.py`、`wan/configs/wan_t2v_1.3B.py`。证实：832×480；VAE 4×8×8、16 通道；patch 1×2×2；1,560 token/latent；30 层/1,536/12 头/128/FFN 8,960（无 GQA）；b=3；S=4 + 1 次 t=0 KV 提交前向；KV 槽 [B,32760,12,128]（=21×1,560）；cross-KV [B,512,12,128]；首块 9 帧/稳态 12 帧（demo 丢帧逻辑）；默认全量窗口（滑窗+sink 为可选分支）；离线 bf16/demo fp16；**无用户动作控制接口**（SocketIO 仅 start/stop）。
- **论文核对**：PixVid arXiv:2611.17336v1（2026-11-12，Roblox 等）§3.5/§4.5/附录 B.5 逐句核对：480×864、单 B200、4 步、CuTeDSL、窗口填满后计时；151 ms 块计算 + 0–688 ms 等待 → 151–839 ms、中位 495；单 latent 为微调+蒸馏重训配置；计时边界为 wait+generation（不含公网与显示）。
- **文献查新**：Self Forcing（arXiv:2506.08009，v1 2025-06-09，Adobe+UT Austin，NeurIPS 2025 Spotlight——注意非字节/非 ICLR）；CausVid（2412.07772，CVPR 2025）；Wan2.1（HF 2025-02-25 / arXiv:2503.20314，VAE 127M）；Forcing-KV（2605.09681）；FlowCache（2602.10825）；KV 量化 33 方法实证（2603.27469，UCSD）；PipeDiT（2511.12056）；DDiT（2506.13497）；DisagFusion（2605.25550）；SlackServe（2606.15319，北大 Hetu）；TurboServe（2606.19271，上交+生数）；Roofline（CACM 2009-04）。UnStep/MonarchRT 沿用站内既有引用。
- **数字口径**：正文所有显存/FLOPs/耗时为**源码形状推算 + 假设效率参数**（逐处标注假设），代码 3-1 可独立复算；与论文报告数字分层显示，不混写。

## 交互图解（SeeCode）判断与产出

沿用站内标准（多组件+连接、动线本身是知识点才做交互图；简单 2–3 盒流程保留手绘）。本轮产出四张，`posts/img/sc-sf-*.html` 自包含单文件、iframe 懒加载：

| 新图 | 位置 | 类型与动线 | 判断理由 |
|---|---|---|---|
| 六维分析依赖图 | 图 0-1 | architecture·trace：状态/计算/传输三列汇入有效产出目标 | 全文总纲：六维与执行链的关系是本文核心认知 |
| 状态生命周期 | 图 3-1 | gantt·reveal：四类状态（恒活/增长/滑窗/块内）随块序号的存活区间 | "谁随会话增长、谁有界、谁只活一块"难以用静态图表达 |
| DiT—VAE 异构分离 | 图 3-2 | architecture·trace：latent 块→跨链路→解码，三条节拍上限 | 分离边界与状态亲和是 3.5 节的机制骨架 |
| 控制等待双轨时间线 | 图 3-3 | gantt·reveal：12 帧块（等 344+算 151）vs 单帧块（0+34） | 响应维的招牌对比；比例按论文数字绘制并标注口径 |

未做交互图（判断为不合适）：执行链十步与块生命周期（2–5 盒线性流程，手绘 fbox 保留）；E0–E7 对照（表格信息密度更高）；播放缓冲权衡（正文表格+文字，动线简单）。

## 伴随修订

1. **首页**：篇数 21→22（侧栏 extensions 范围、导语、搜索帮助、归档标题）；研究延伸部分新增第 22 篇条目；"按问题查找"新增"流式视频不跟手/卡顿"卡片（链接新篇与实时世界模型篇）。
2. **docs/knowledge-structure.md**：补第 22 篇定位说明。
3. **互链**：新篇对站内 9 篇互链（世界模型/KV/量化/稀疏化/服务/成本/评测/仿真/并行）；不改各旧文正文。

## 与并行任务的隔离

本轮与"高性价比专题刷新"（另一任务）同日进行，两者使用独立 git worktree 与独立分支，互不覆盖：本分支基线为 origin/main@3490057，不包含该任务的未提交改动；该任务对 cost-efficient/首页的修改由其自身分支交付。

## 验证

- `python scripts/build-site.py`、`--check`、`build-reader.py --check`、`check-site.py` 在隔离 worktree 内全部通过（见交付说明）。
- 四张交互图：SeeCode 渲染零警告；iframe 懒加载、观看路径零外部请求（除 Google Fonts 样式表，与既有 sc-* 图一致）。
- 正文算术由代码 3-1 复算核对（表 3-1/3-2 与 stdout 一致）；375px 移动端检查见任务交付说明。
