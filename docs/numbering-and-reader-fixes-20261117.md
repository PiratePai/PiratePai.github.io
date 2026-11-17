# 2026-11-17 编号、图示与阅读器修订记录

本轮为内容与界面维护，不推进任何研究资料核验日期（`reviewed` 保持原值）。

## 编号修订（正文跳号 + 附录非正文编号）

五篇旧综述的正文章节编号在"更新附录"脱离正文编号后遗留跳号（附录原占用的章号被空出）。
本轮将正文编号改为连续，并把更新附录小节改为"附A、附B…"非正文编号体系（沿用 2026-11-15
speculative-decoding / cost-efficient-inference-2026 的既有做法）。所有旧锚点 id 保持原值，
仅调整展示编号与文内交叉引用：

| 文章 | 正文改动 | 附录小节 |
|---|---|---|
| kv-cache-survey | 11→10（未来方向）、12→11（动手实验） | 10.1–10.4 → 附A–附D |
| inference-serving | 10→9（未来方向，10.1–10.6→9.1–9.6） | 9.0–9.6 → 附A–附G |
| parallelism-survey | 11→10（未来方向，11.1–11.8→10.1–10.8）、12→11（结语，图 12-1→图 11-1） | 10.1–10.9 → 附A–附I |
| quantization-survey | 10→9（未来方向）、11→10（术语速查表） | 9.1–9.3 → 附A–附C |
| speculative-decoding | 8→7（未来方向）、9→8（一张表总结） | 已为附A–附E，无改动 |

同步更新：无脚本目录文本与顺序、文内 §/第 N 章/图 N-M 交叉引用（含 inference-serving
跨文引用 "KV Cache 综述 §10.4"→"§附D"）。

## 附录重复标题清理

inference-serving、quantization-survey、spec-decoding-post-training 的更新附录内残留
与生成标题同文的第二个 h2（旧锚点 s9-content / latest-content 改为同名 span.anchor 保留可达性）；
parallelism-survey、vit-sparsification 的嵌套 section 内同名 h2 直接移除（ch10-content /
s6-content 锚点保留）。

## 图示与交互修正

- kv-cache-survey 图 4-1：重构为自洽的 A/B 页表快照——A 页表 0→P1、1→P4、2→P6；
  B 与 A 共享前缀块（P1、P4 引用 2），分叉后 A 占 P6、B 占 P2；共享未满块写时复制的说明与
  下方交互图（kv-block-map）一致。
- llm-perf-simulation-2026 9.2 交互：教学目标改为"batch 摊薄权重流量，AI 因 KV 流量饱和"。
  数学事实：AI(B)=2·7e9·B/(14e9+B·0.537e9)，B=256 时 AI≈23.7，极限≈26.1 < 屋脊 295.34，
  该参数下不会出现"带宽→算力"切换；图注、判定文案、小结与过时注释同步修正，并新增
  AI 饱和上限参考线与权重/KV 流量占比读数。模型常数未改动。
- 图 9-1/9-2 与 moe-survey 图解的数据点采用 `data-diagram-point` 语义标记：阅读器以
  主题前景色族（白底 3.9–4.8:1，深色底 6.9–8.1:1，满足 WCAG 2.2 §1.4.11 非文本对比
  3:1）加背景色光环渲染；构建脚本同步支持该属性的十六进制→强色映射。

## 阅读器

- 目录标题提取（label）排除装饰徽章/药丸/引用（.pill/.badge/.tag/.cite 与 aria-hidden），
  目录不再出现"…通信墙基础""[2,3]"等黏连文本。
- 其余（图标、勘误、FlashAttention 表格换行）见对应文章与共享脚本改动。
