# 全站原理解读修订 · 2026-11-20

本轮逐章查看首页收录的 23 篇文章，在 84 章改写或补充文字说明，重点放在读者需要先理解因果关系的地方。时间线、参考文献表或已经具备足够解释的章节不另加导读。

采用 [nils-e 的 ELI5 文字说明](https://github.com/nils-e/agent-skills/blob/0c58d00967c79f18fb63e2c164207a4cdb4f4939/skills/eli5/SKILL.md) 的做法。先用一个日常例子讲明问题，再回到原来的术语、实现、测量或限制。一般只写两三句话。原文已有类比且覆盖同一原理时，改写原框或保留原框。沿用站点现有样式、插图和阅读器。

《大模型推理服务优化》第 3 章采用先前预览中的书架、收纳盒和两段故事。正文说明 KV Cache 的利用率分母，把 vLLM 论文与发布博客的吞吐结果按基线分别列出，并注明 APC 完整块匹配和末 token 计算边界。RadixAttention 命中率对应论文的具体负载，跨机路由一并考虑等待与传输。[PagedAttention 论文](https://arxiv.org/html/2309.06180) · [vLLM 发布博客](https://vllm.ai/blog/2023-06-20-vllm) · [vLLM APC 设计文档](https://docs.vllm.ai/en/stable/design/prefix_caching/) · [SGLang 论文](https://arxiv.org/html/2312.07104) · [Mooncake 论文](https://arxiv.org/html/2407.00079)

内容更新日按本轮编辑记录。各篇资料核验日期沿用原记录。论文与博客的结果使用来源报告的口径。

## 独立审阅

DSH NEXT 对候选提交 `10efb4a` 做只读审阅。它要求修正 Delta 规则的例子，区分预留空间和内部碎片，缩短前缀缓存的类比框，并删去 MoE 章首重复的例子。本轮也补齐了性能测试设置，明确 EAGLE-3 训练时沿用草稿的内部状态与给定真实 token 的区别。
