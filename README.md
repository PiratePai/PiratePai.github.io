# PiratePai's Blog

大模型效率技术知识全景 —— 16 篇技术综述，在线阅读：[piratepai.github.io](https://piratepai.github.io)。

2026-11-01 根据全站审阅报告修订机制、性能口径与引文，增加每篇的阅读路径、手算例子和研究取舍；发布快讯按需展开。修订范围与证据边界见 [修订说明](docs/research-quality-review.md)。

## 知识地图 · 推理效率栈

| 层面 | 文章 |
|---|---|
| L1 算法层 | 投机解码全景：从经典投机采样到 MTP / DFlash / DSpark |
| L2 结构层 | 注意力结构演进：从 MHA 到 MLA、线性注意力与混合架构 |
| L3 显存层 | KV Cache 技术全景：从原理到前沿 |
| L4 压缩层 | 模型量化在 LLM / VLM / DiT 中的原理、代码实现与前沿进展 |
| L5 系统层 | 大模型推理服务优化：技术发展史、原理与前沿展望 |

## 延伸 · 训练与架构

- 大模型 CPU-GPU 混合推理：从专家卸载到分层缓存（以 Strata 为引，125B MoE 跑进 12 GB 显卡；谱系：ZeRO-Infinity → FlexGen → Fiddler / MoE-Infinity / Pre-gated / PowerInfer / KTransformers → Splash / Strata）
- 投机解码的后训练：草稿蒸馏、解码头、训练时测试与 RL 协同训练（2023–2026）
- 混合专家（MoE）全景
- 大模型并行策略与通信优化
- Agent 与强化学习技术全景
- ViT 稀疏化技术梳理

文章源文件在 `posts/` 目录，均为自包含 HTML（暗色主题、移动端适配）。

阅读器统一采用可收起的左侧目录，手机端使用抽屉。短章节整章阅读，长章节按完整内容块分成少量连续阅读段，合并过短尾页；单页章节直接点击，多页章节展开选择。工具栏与页尾可翻页，支持直接链接、浏览器前进后退及全文切换。论文配图默认展示，可从侧栏配图目录直达。

文章统一为较窄正文行宽、17px 桌面／16px 手机正文与舒展行距，使用柔和深灰配色；工具栏可切换纸白浅色，并跨文章记住选择。标题、引文、公式、代码、表格和提示框采用统一层级，图表和交互演示保留独立绘图背景。调整依据与分页数量对照见 [阅读体验修订](docs/reading-comfort-review.md)。

阅读器源文件位于 `scripts/chapter-reader.js` 和 `scripts/chapter-reader.css`；修改后执行 `python scripts/build-reader.py`，将它们内嵌进全部文章。分页在单个 HTML 内完成，初次下载仍包含全文；关闭 JavaScript 时保留全文和原有目录。设计边界、配图审计与验证记录见 [阅读器修订说明](docs/chapter-reader-review.md)。

补充专题：定制推理引擎、性能仿真、Loop Transformer、实时世界模型、免训练自动调优。

本地检查（Python 标准库；站点检查另需 Node.js）：

```text
python scripts/verify-mechanisms.py
python scripts/build-reader.py --check
python scripts/check-site.py
python -m http.server 8000
```

数值示例只核对文中明确的机制与教学账本，不复现论文训练和 GPU 性能。
