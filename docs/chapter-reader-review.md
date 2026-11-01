# 阅读器与章内分页修订

用户反馈：论文原图不易找到、顶部目录在长文中失去作用、章节内部仍然过长。此修订覆盖全部 16 篇文章，不修改研究论断与引用内容。

## 配图核对与恢复可见

比较前一轮修订之前的 `7946637`、已合并的 `81b92d7` 与此次版本：26 个 `<img>` 的引用路径及顺序完全相同，35 个内嵌 SVG 数量保持不变；前一轮没有删改 `posts/img/`。问题在于上轮把发布记录折叠时，连带将 25 张图片藏在折叠区域内。

这次将更新附录改成正常章节，图片随对应文字默认展示；新增配图目录，可直接定位图片所在的章内页。无 JavaScript 时，图片也不再藏在关闭的折叠块内。

实际解码检查还发现，已有的 `dpal-fig1.svg` 和 `packedss-fig1.svg` 缺少独立 SVG 文件必需的命名空间。本次补齐 SVG、foreignObject 内 HTML、MathML 的命名空间，保留原图几何、文字与源路径，并验证浏览器能成功解码。站点检查新增 SVG XML 与根命名空间校验。

| 文章 | img 数量 | 内嵌 SVG 数量 |
|---|---:|---:|
| agent-rl-survey | 2 | 6 |
| attention-evolution | 2 | 0 |
| custom-inference-engines-2026 | 0 | 0 |
| inference-serving | 2 | 0 |
| kv-cache-survey | 4 | 0 |
| llm-perf-simulation-2026 | 1 | 5 |
| loop-transformer-survey | 2 | 2 |
| moe-survey | 2 | 12 |
| parallelism-survey | 2 | 10 |
| quantization-survey | 2 | 0 |
| realtime-world-models-2026 | 0 | 0 |
| spec-decoding-post-training | 2 | 0 |
| speculative-decoding | 3 | 0 |
| strata-hybrid-inference | 0 | 0 |
| training-free-autotune-2026 | 0 | 0 |
| vit-sparsification | 2 | 0 |
| **合计** | **26** | **35** |

## 阅读行为

- 桌面端：固定左侧目录，可整体收起，并记住收起状态；各章可展开章内页。
- 手机端：目录抽屉默认关闭，支持遮罩关闭、Escape、键盘焦点循环；点击页链接后关闭。
- **章节内部也分页**：优先在小节标题处分隔，再按完整段落、列表项等内容块控制长度。公式块、图与图注、交互演示保留为完整节点；参考文献长表按完整行分页并重复表头。移动时间线收窄左侧留白，避免正文挤成长列。
- 工具栏始终提供页码和前后翻页，页尾提供带标题的前后页链接；到达章末时跨章继续。可切换全文阅读，模式写入 URL 的 `view=all`。
- 保留原有章节、文献和小节 ID；旧链接会自动定位所属页，必要时展开目标所在折叠块。生成的 `#reader-page-N` 链接也支持冷启动直接打开、浏览器前进与后退。正文编辑后自动页序可能变化，长期引用优先使用原有语义锚点。
- 保留原始 DOM 节点和演示监听器。初次加载仍下载单篇完整 HTML，分页只控制阅读呈现；无新增外部 CSS/JS 依赖。禁用 JavaScript 时显示全文，打印时显示所有分页内容。

## 维护与验证

修改共享阅读器后运行：

```text
python scripts/build-reader.py
python scripts/build-reader.py --check
python scripts/check-site.py
python scripts/verify-mechanisms.py
```

浏览器回归需本机安装 Playwright 和 Microsoft Edge：

```text
python -m http.server 8943 --bind 127.0.0.1
node scripts/check-reader.cjs http://127.0.0.1:8943
```

`check-reader.cjs` 在 1440px 与 375px 下检查全部 16 篇文章、每一章内页：正文文本完整且有序、原有 ID 保留且不重复、单页可见、无横向溢出、旧锚点和图片目标可达、翻页与浏览器后退、全文切换、抽屉关闭和桌面收起状态持久化。另检查禁用 JavaScript 后配图仍可见。桌面和手机使用相同的语义分页边界。

本次验证通过 32 组文章／视口组合，共 1,444 次分页检查；所有图片成功解码。注意力模式切换与温度滑块、Roofline 与排队参数滑块、ViT 剪枝模式切换仍能交互。生成一致性、17 页站点链接／锚点／脚本／SVG 检查及机制数值检查均通过。
