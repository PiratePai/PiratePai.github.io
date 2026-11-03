# 效率评测与 Agent 恢复教学工具

使用 Python 3.10+ 标准库，无依赖、无模型下载、无网络请求。所有命令从仓库根目录运行。

```text
python examples/efficiency-lab/evaluate.py examples/efficiency-lab/synthetic
python examples/efficiency-lab/evaluate.py examples/efficiency-lab/synthetic --check examples/efficiency-lab/synthetic/expected.json
python examples/efficiency-lab/recovery_demo.py
python -m unittest discover -s scripts -p 'test_efficiency_lab.py'
```

`synthetic/` 的输入是人工构造的六条请求、四道任务与三种策略的记录。策略名称仅为教学标签，并未调用模型或执行预算控制器。`expected.json` 是运行统计程序得到的确定性输出，可核对文章里的算术；它不是 GPU 基准或模型准确率证据。`recovery_demo.py` 实际运行本地 SQLite 故障注入，也不构成生产恢复保证。

## 请求账本

`manifest.json` 指定观察窗口 `duration_ms`、全部计划请求数 `planned_requests`、延迟目标 `slo_ms`。`requests.jsonl` 必须包含所有计划请求，包括失败、超时与取消；一个逻辑请求一行，内部重试的耗时归入该行。单独分析重试时使用另外的事件账本，不能增加任务分母。

| 字段 | 定义 |
|---|---|
| request_id | 非空唯一字符串 |
| scheduled_ms / sent_ms | 相对观察窗口起点的计划到达与实际发送时间 |
| first_token_ms / last_token_ms | 首、末输出 token 的客户端到达时间；失败可为空 |
| end_ms | 成功结束或失败终止事件的时间；须落在完整观察窗口内 |
| output_tokens | 使用约定 tokenizer 或服务端用量统计得到的输出 token 数，不是 HTTP chunk 数 |
| success | 请求成功结束的布尔值；和回答正确性分开 |
| quality_pass | 独立质量评价的布尔值；未知写 null |

统计约定：

- TTFT = first_token − scheduled，包含客户端排队。E2E = end − scheduled。
- TPOT = (last_token − first_token)/(output_tokens − 1)。单 token 请求不参与 TPOT 分布，SLO 中该约束不适用，仍检查 TTFT 与 E2E。
- 分位数用 nearest-rank。成功请求的 TTFT、TPOT、E2E 与全部请求失败率同时报告；不把失败请求补成零延迟。
- goodput 单位为请求/秒，只计同时满足全部适用延迟目标的成功请求。输出吞吐只计成功请求的输出 token；失败输出与重试消耗若需要分析应另行记账。
- 观察窗口包含排空或超时终止阶段。若使用稳态窗口、截断观测或其他分母，应重新标注，不能直接与本工具数值混比。
- 所有成功请求均有质量标签时才输出质量与 SLO 同时合格的 goodput，否则为 null。
- 该工具不验证源数据的真实性，不能从服务端平均值重建逐请求时间线。vLLM 原始 JSON **不能直接**作为此 JSONL 输入。缺少计划到达或末 token 时间时应使用原工具口径，而不是补造字段。

## 任务账本

`task_ids` 与 `strategies` 指定待比较的完整集合。`tasks.jsonl` 每个 task/strategy 恰好一行；独立重复实验用不同运行目录，避免把重复当作不同题目。字段包括 `status`（completed/failed/timeout/cancelled）、`success`、`cost_units`、`latency_ms`。

每次成功成本 = **所有尝试总成本 / 成功次数**。截止时间内成功成本同理。零成功时为 null，而非零。超时是截断观察，`latency_all_attempts_ms` 是终止事件分布，不意味着这些任务本来就会在超时时刻完成。

本例 cost_unit 是任意教学积分。真实实验应统一货币或明确资源计量，不得混加美元、token 和 GPU 秒。`success` 应来自最终状态验收，不能照搬模型的自述。工具要求相同任务集合，但无法自动发现数据泄漏、错误评价器或不公平预算。

## 恢复示例的保证范围

Agent 检查点与模拟工具使用两个 SQLite 数据库。在工具事务完成、Agent 结果保存之前注入崩溃；再次进入执行器后，用同一逻辑动作键重试。工具业务效果和幂等记录在一个事务中提交，唯一键让效果只发生一次；同键不同参数被拒绝。

示例通过重新打开数据库模拟恢复路径，不模拟真实网络、操作系统崩溃、磁盘损坏或跨地域一致性。真实工具必须提供相应的幂等/查询协议，不能只靠 Agent checkpoint 宣称 exactly-once。临时目录由 Python 自动清理。

## GPU 实验材料

`run-manifest.template.json` 是尚未执行的实验清单，空项有意保留 null。填好模型与 tokenizer revision、镜像/提交、数据哈希、硬件、完整命令和缓存状态后，在隔离的目标 GPU 环境执行文章中的 vLLM 冒烟压测。随机 token 测试只检验形状与服务链路；质量、前缀命中和草稿接受率需要真实请求数据。

每轮基线、单项优化、组合优化使用独立目录，保留原始结果与失败样本。不得将人工样例移动到“实测”目录后改名为硬件性能结果。
