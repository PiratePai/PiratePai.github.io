# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

读者围绕大模型效率技术理解专题之间的关系与阅读顺序。此次首页优先任务由用户于 2026-11-03 确认。

## Product Purpose

Pai's Blog 提供中文大模型效率技术综述；首页是技术专题的阅读入口。首页以分阶段阅读手册解释专题关系，并提供全站搜索。

## Operating Context

通过浏览器阅读自包含 HTML 综述；首页组织 L0–L6 推理效率栈，并延伸至训练、架构与视觉领域。

## Capabilities and Constraints

现有仓库采用静态 HTML/CSS/JavaScript，通过 GitHub Pages 托管。本轮只重做首页，保留已有文章、链接、中文内容与事实口径。文章阅读器和正文不在本轮修改范围。发布通过 PR 合入 main，由 GitHub Pages 构建。

## Brand Commitments

保留 Pai's Blog / PiratePai 名称。中文为主，技术术语保留英文。首页采用已确认的浅色阅读手册风格，使用标准文档导航。

## Evidence on Hand

posts/ 有 16 篇现有技术综述；原首页包含其中 15 个入口。views.json 提供真实浏览量快照，不能将 GitHub 与全站共用计数宣称为独立站点访客数。首页已有 10 个交互动画的数量说明，未经逐项复核不扩张该口径。

## Product Principles

- 先解释专题关系和建议阅读顺序，再帮助读者进入具体文章。
- 保留研究内容和原有引用事实，导航文案不引入新的性能结论。
- 首页改版保持静态托管，手机和键盘可用。

## Confirmed update · 2026-11-03

用户选中分阶段阅读手册（reading-handbook），选择 code-first；随后认可风格并要求增加搜索。搜索需覆盖现有文章，保留主题关系与阅读顺序。用户已确认测试效果，并授权将本版合入仓库。
