# 2026-11-03 研究增补与交互修订

本轮覆盖首页现有 16 个专题，沿正文的机制章节选择性补充内容。新增引用落在 13 个官方项目和 14 篇论文，包含 2026-11-02 的 BasisKV、Model Optimizer 0.48.0，以及 10-30 的 TraceSpec、MXCode、ZHA。检索截至 2026-11-03；论文首发、修订、仓库提交与软件发布日期分别记录。

每篇新增正文可从 `#research-20261103` 直达；BasisKV 另在 KV Cache 结构压缩章的 `#basis-kv-20261103`。来源元数据、固定提交、发布标签和逐篇映射见 [来源记录](research-refresh-20261103-sources.json)。这些日期不是对旧文所有内容的统一刷新声明。

## 选择方法与覆盖

优先官方代码、论文原文与能确认的会议基线，保留原有 FlashAttention、PagedAttention、KIVI 等经典研究脉络。最新预印本往往还没有成熟引用积累，本轮不编造引用次数、不按 stars 代替学术质量，也不把作者自述接收升级为独立会议核验。Precise 的 NeurIPS 2026 状态明确标作作者仓库披露；其余新增论文按预印本处理。

| 专题 | 选择性补充及判断边界 |
|---|---|
| 注意力 | Prism 原生视听稀疏、ZHA 层次索引、FlashMLA 版本兼容；索引开销也属于复杂度。 |
| MoE | VeOmni grouped-GEMM 工程快照与 CRISP 组合剪枝；保持路由和近似剪枝分开。 |
| KV Cache | dLLM-KVQ 的缓存复用误差、BasisKV 的低秩表示与通信；局部精确 QK 不等于全量注意力等价。 |
| 量化 | Model Optimizer 0.48.0、MXCode；存储位宽、fake quant、导出和原生低比特执行分开。 |
| 投机解码 | 能耗账本与 batch / 语料变化；接受更多未必每 token 更节能。 |
| 草稿后训练 | DFlash2 工程入口、TraceSpec 轨迹监督；回放吞吐不等于含工具等待的任务加速。 |
| 并行通信 | 字节 Flux 的细粒度依赖重叠与当前源码支持范围；2025 年提交不包装成新发布。 |
| 推理服务 | Dynamo v1.6.1 矩阵、字节 InfiniStore；命中不自动保证跨 worker 布局兼容。 |
| 定制引擎 | TensorRT Edge-LLM 0.11.1 的端侧路径、正确性修复；与数据中心引擎分开定位。 |
| CPU–GPU 混合推理 | Adaptive Expert Assignment 与 CRISP；按本次专家负载比较搬运和 CPU 计算。 |
| 性能仿真 | AIConfigurator → AISimulate；区分分析配置搜索、请求 Replay 和真实压测。 |
| 自动调优 | 配置可组合性、分阶段搜索、实测预算与能耗约束；保留 ZCode 案例未执行的说明。 |
| Loop Transformer | How to Loop Your Transformer；固定参数与固定 FLOPs 得到不同取舍。 |
| ViT 稀疏化 | Prism 的可变块形状与视听耦合；原生训练不归入免训练缓存或 token 剪枝。 |
| 实时世界模型 | Hy-Nomas 的参考图、LoRA、低显存与流式入口；开源日、论文日和社区结果分列。 |
| Agent RL | UniRL 统一工程接口与 Precise 随机采样策略；接口统一不代表概率模型相同。 |

检索也查看了 NVIDIA cuTile、ByteDance 的其他模型项目、2026-11-02 的集群效率 / In-DRAM 研究等。与现有机制重复、硬件假设差异较大或当前证据不足的条目不强行堆入正文；本轮不是论文全量索引。

## 直接修订的错漏

- 性能仿真篇：撤回 `alibaba/ai-configurator` 的错误仓库地址和单一机构归属，移出“跨设备外推”一栏，补正确论文与 AIConfigurator / AISimulate 分工。
- 世界模型与自动调优篇：修正 Dynamo “当前 1.5”及过期后端矩阵；历史发布材料保留历史标签，稳定版本与 main 不混为一谈。
- 首页与世界模型篇：Hy-Nomas 代码首发为 10-21，10-27 为 arXiv 报告日。
- 缓存与量化篇：撤回标题中 FP8 / NVFP4 KV 已普遍默认的表述，改为模型、硬件、后端各自的支持范围。
- 注意力交互：因果 softmax 以前只在图上遮蔽未来位置，归一化仍计入它们；现在未来位置概率严格为零、可见行和为一。MLA 的示例缓存比例补上尺寸依赖说明。
- Loop Transformer：去除重复附录标题，保留原锚点；新增循环结构图放在正文未来方向章。
- ViT 交互：修正逐帧取整导致层数不推进的问题；播放累计时间，单步推进一层。调度器使用最新可见性记录，避免阅读器移动节点后的旧记录阻塞按钮重绘。
- MoE 交互：使用已有 2D 路由图，去掉自动下载 Three.js 的路径和无效旋转提示，补齐最热专家占比。

## 原图与轻量演示

引用两张已核对 CC BY 4.0 许可的原图：dLLM-KVQ Figure 1、How to Loop Your Transformer Figure 2。逐图写明作者、版本、编号、许可和中文读图提示，正文默认展示，可从配图目录直达。无裁切、无改动内容，转为无损 WebP；两张文件共 350,244 bytes，HTML 内嵌 base64 约 456 KiB，保持离线自包含。`loading="lazy"` / `decoding="async"` 推迟解码，但内嵌图片的字节仍随 HTML 下载，不能将其称为网络按需加载。

新增 [通信重叠 SVG 演示](../posts/parallelism-survey.html#overlap-demo)：四块数据、每块通信 2 ms / 计算 3 ms，比较串行 20 ms 与理想流水 14 ms；默认静止、支持播放 / 单步 / 重置，到终点停止。数值只用于解释依赖，不是 Flux 性能复现。

原有 9 个演示的常驻绘制循环已替换（其中 MoE 原代码包含 3D / 2D 两个候选循环）。共享调度器是 [efficient-animations.js](../scripts/efficient-animations.js)：

- 默认不自动播放；量化静态图只在输入或点击后重绘。
- 播放最多约 20 次绘制/秒；计时器触发 rAF，不以 60 Hz 空转检查状态。
- `IntersectionObserver`、页面可见状态与阅读器章节隐藏共同控制停止；暂停时取消定时器和 rAF。
- `prefers-reduced-motion` 下保留静态图与单步，不持续播放。
- 无新增第三方脚本依赖。共享脚本通过构建内嵌，不改变 HTML 的离线使用方式。

## 验证与范围

```text
python scripts/verify-mechanisms.py
python scripts/build-animations.py --check
python scripts/build-reader.py --check
python scripts/check-site.py
python scripts/build-search-index.py --check
node --test scripts/test-site-search.cjs
node scripts/check-reader.cjs http://127.0.0.1:8946
node scripts/check-animations.cjs http://127.0.0.1:8946
```

浏览器测试使用本机 Edge 和已有 Playwright：检查 16 篇文章的 1440px / 375px 阅读器、旧锚点、正文顺序、配图、无脚本回退；动画测试检查默认空闲、手动播放、帧数上界、暂停、切换章节、减少动态效果，以及全部新增正文的手机深链接。另模拟批量可见性记录，检查 ViT 层数在播放和单步时实际推进。新增 softmax 数值检查直接提取演示的实际函数，覆盖所有因果行。

未执行论文训练、GPU/NPU 跑分、实际服务迁移或功耗复现；未对旧文约 800 条历史引文逐条重做全文核验。新增研究的结论按论文或官方发布材料标明范围，不为旧文所有性能声明背书。
