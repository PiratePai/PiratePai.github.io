# 评测、推理预算与 Agent 在线系统内容补齐

核验日期：2026-11-04。新增三个独立专题，目录保留原 1–16 编号，新增为 17–19；按主题并入原五阶段路线。

| 新专题 | 核验与实现范围 | 尚未执行 |
|---|---|---|
| 性能评测与可复现实验 | DistServe、vLLM CLI 与复现文档；请求指标、完整分母、实验矩阵、标准库统计工具 | GPU 服务压测、模型质量实测与硬件排行榜 |
| 推理时计算与自适应预算 | Self-Consistency、Tree of Thoughts、过程监督、Snell 等预算研究、RouteLLM、s1、Agent 测试时计算；预算伪代码与成本账本 | 论文模型复现、学习型控制器训练与线上路由实验 |
| Agent 在线推理系统 | ReAct、MemGPT、SGLang、τ-bench、Anthropic 上下文文章、LangGraph 持久化/故障处理文档；本地 SQLite 恢复演示 | 真实工具/网络故障矩阵、生产恢复保证、Agent 任务基准 |

## 一手来源

论文提交与修订日期、作者、机制以 arXiv 页面为准，正文逐处上标并提供参考列表。没有搬用跨论文加速比做统一排名。官方滚动文档只声明访问快照，不编造首发日或保证旧版本命令可用。

- https://arxiv.org/abs/2401.09670
- https://docs.vllm.ai/en/latest/cli/bench/serve/
- https://docs.vllm.ai/en/latest/usage/reproducibility/
- https://arxiv.org/abs/2203.11171
- https://arxiv.org/abs/2305.10601
- https://arxiv.org/abs/2305.20050
- https://arxiv.org/abs/2408.03314
- https://arxiv.org/abs/2406.18665
- https://arxiv.org/abs/2501.19393
- https://arxiv.org/abs/2506.12928
- https://arxiv.org/abs/2210.03629
- https://arxiv.org/abs/2310.08560
- https://arxiv.org/abs/2312.07104
- https://arxiv.org/abs/2406.12045
- https://www.anthropic.com/research/effective-context-engineering-for-ai-agents
- https://docs.langchain.com/oss/python/langgraph/persistence
- https://docs.langchain.com/oss/python/langgraph/fault-tolerance

## 教学代码和数字

`examples/efficiency-lab/` 包含人工请求/任务输入、统计程序、期望输出、GPU 运行清单模板以及本地恢复演示。输入标签和时长是作者设定；运行统计程序只验证公式与数据契约，不测量模型成功率。

六条请求、10 秒窗口：成功 5 条、输出 21 token、失败率 1/6、SLO 合格 3 条、质量与 SLO 同时合格 2 条，分别得到 0.5 请求/秒、2.1 token/秒、0.3 和 0.2 合格请求/秒。单 token 不参与 TPOT 分位数；缺少质量标签不输出质量 goodput。

四道题三种策略的人工总成本分别为 4、20、12 积分，成功次数为 2、3、3；每次成功成本为 2、20/3、4。失败与超时成本计入；零成功对应 null。该样例没有执行真正的预算控制器，也不支持任何策略优劣结论。

恢复示例真实执行本地 SQLite 事务，在工具提交效果后、Agent 保存结果前注入异常。重新打开数据库恢复后效果仍为 1，检查点为 completed。保证来自工具端的事务与唯一动作键；不模拟网络分区、磁盘故障或生产 API。

## 站点集成

首页目录、问题入口、阶段范围、搜索、SEO 和 sitemap 扩展为 19 篇。六篇相邻旧文增加回链及对应内容变更记录，保留各自资料核验日期。首页篇数元数据改从目录数据生成，最近更新按实际文章去重计数；新文章在首次合并前链接到文件历史，避免引用尚不存在的提交哈希。

新文章沿用现有 CSS、阅读器和主题，包含导读、亮点、时间线、原理图、章节三句小结、引用和代码入口。手绘图为 HTML 流程图，手机端可以换行；原始正文与目录保留无 JavaScript 阅读能力。

## 验证命令与边界

```text
python examples/efficiency-lab/evaluate.py examples/efficiency-lab/synthetic --check examples/efficiency-lab/synthetic/expected.json
python examples/efficiency-lab/recovery_demo.py
python -m unittest discover -s scripts -p 'test_*.py'
python scripts/build-site.py --check
python scripts/check-site.py
python scripts/verify-mechanisms.py
node --test scripts/test-site-search.cjs scripts/test-core-visuals.cjs
```

新测试覆盖失败分母、单 token、缺失质量、重复/缺失记录、非法时序、非有限数、零成功成本、工具提交后的恢复及同键不同参数冲突。浏览器发布检查覆盖新文 375px/桌面布局、章节导航、深色与无脚本全文、搜索直达和引用锚点。GPU 实验仍按清单等待目标环境执行，不包含在这些检查中。

本地结果：14 项 Python 测试、14 项 Node 测试及既有数值机制检查通过；20 个页面的链接、资源、锚点和脚本语法检查通过。浏览器脚本 `scripts/check-content-guides.cjs` 验证三篇的 375px/1440px 阅读、主题切换与持久化、抽屉目录、翻页、引用、全文/无脚本和搜索；无横向页面溢出与脚本异常。检查中修复了 Windows 下 SQLite 连接未关闭导致临时目录无法清理的问题，以及原有搜索测试将文章数写死为 16 的问题。
