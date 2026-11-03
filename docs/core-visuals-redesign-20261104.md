# 2026-11-04 原理图解重绘

截图中的 ZeRO 图存在两个独立问题：ZeRO-1 说明的 x 坐标写到 DP 说明旁，长段 SVG 文本又越出 viewBox。本轮将其改为响应式 HTML 比较图，同时处理全站同类的文字相交、裁切、过小与样式污染。

## 设计与交付

按 Sites skill 的展示设计原则实施在原 GitHub Pages 仓库，保留原发布方式。已查到 Figma 可创建可编辑设计和 FigJam 图，但本轮核验时尚未安装/连接；没有声称调用了 Figma，也没有把未连接服务作为网页交付的依赖。

统一使用站点冷白 / 深色主题、蓝灰正文、深青交互色，减少高饱和深色大底。蓝、青、棕在 ZeRO 图中固定对应参数、梯度、优化器状态；所有含义同时有文字标注。中文长句使用原生文本换行，核心数值采用等宽数字，控件触控高度至少 44px。

| 图解 | 处理 | 机制与来源 |
|---|---|---|
| [ZeRO](../posts/parallelism-survey.html#zero-memory-figure) | 替换原图 3-1；DP 和 ZeRO 1/2/3 使用同一长度标尺，选择 1/4/8/64 卡 | Rajbhandari 等，ZeRO Figure 1 / §5；FP16 参数与梯度、FP32 Adam 账本，不含激活 |
| [KV 分页](../posts/kv-cache-survey.html#kv-block-map) | 新增四步轻量图解；共享 → 写时复制 → 填满尾块 → 分配新块 | Kwon 等，PagedAttention Figure 8 / §4.4；区别同请求并行采样与完整块前缀缓存 |
| [MoE 路由](../posts/moe-survey.html#moe-route-combine) | 重绘原图 2；打分 → top-2 → 专家计算 → 加权合并 | Shazeer 等，§2 式 (1)/(3)/(5)；例子先 top-k 再 softmax，省略训练噪声 |
| [投机采样](../posts/speculative-decoding.html#spec-rejection) | 新增接受 / 拒绝分支、正残差补采样与概率质量账本 | Leviathan 等，ICML 2023 Algorithm 1；固定前缀下的单位置例子，不模拟 GPU 性能 |

四张核心图解在手机端重新排版。其余 34 张现有手绘 SVG 统一为主题变量，图内样式以唯一 ID 隔离；正文 `.cap` 排版规则不再放大 SVG 的同名标签。保留原文论文图片的内容与颜色，不对引用原图套用手绘图主题。

固定布局的旧 SVG 默认保持至少 12px 的主标签，并在自己的图框内横向滚动；支持键盘滚动和“整图预览 / 恢复可读尺寸”。这是旧复杂图的可读性回退，不冒称所有旧图都已改为响应式布局。新核心图解不依赖横向滚动。

## 直接修订

- ZeRO 标签重叠、说明越界，并补齐 ZeRO-2；移除“颜色渐变”等不符合图形的说明。
- Agent RL 时间线多组描述互相覆盖，去噪图中省略号与状态名相交。
- 两张性能屋脊图中落在绘图区外的刻度标签。
- Loop 图的循环次数压在 coda 上，另一幅图中的整段说明越界；长说明移至图外。
- MoE 的 MLA 说明覆盖数值、MoE-LLaVA 初始化标签越界、工业激活率图左侧名称被裁切。MLA 示例中 576 / 32,768 约为 1.8%，改正原“压缩约 93%”，并限定为图示维度；不再暗示所有 MLA 内核都显式解压完整 K/V。
- 并行通信图的 all-to-all 长说明及重叠时间线的右端刻度越界。
- KV Cache 和投机解码篇的重复更新附录标题，保留旧锚点。

## 低开销与可维护性

`scripts/core-visuals.js` 同时提供可测试的纯计算函数和页面渲染。`scripts/core-visuals.css` 是核心图解样式；运行 `build-core-visuals.py` 内嵌到四篇文章，保持自包含。默认 HTML 包含完整初始图和图注，关闭脚本仍可读。

新增演示默认静止、手动播放或单步；复用 `PaiMotion`，最多 4 次调度/秒，只有阶段或选项改变时才更新图形 DOM。每 1.5 秒推进一步，到终点停止；离屏、隐藏页面或减少动态效果偏好下停止持续调度。静态 ZeRO 图仅在更改卡数时重绘。无 Three.js、外部字体或新增前端依赖。

`build-reader.py` 负责内嵌全站阅读器，并为作者手绘 SVG 添加隔离的样式与主题令牌；重复构建不会再次转换已有令牌。变更后还需重建搜索索引。

## 验证

```text
node --test scripts/test-core-visuals.cjs scripts/test-site-search.cjs
python scripts/verify-mechanisms.py
python scripts/build-core-visuals.py --check
python scripts/build-animations.py --check
python scripts/build-reader.py --check
python scripts/check-site.py
python scripts/build-search-index.py --check
node scripts/check-core-visuals.cjs http://127.0.0.1:8947
node scripts/check-reader.cjs http://127.0.0.1:8947
node scripts/check-animations.cjs http://127.0.0.1:8947
node scripts/check-reading-comfort.cjs http://127.0.0.1:8947
```

数值检查覆盖 ZeRO 守恒、KV 写时复制、稳定 top-k softmax 与加权输出、接受质量加残差恢复目标分布。浏览器检查覆盖全站 320/375/1440px SVG 的真实变换后边界、标签相交、主标签字号与页面宽度；新增图解覆盖 320/375/768/1440px、深浅主题、全部阶段、真实滚动离屏、低频调度、单步、暂停、减少动态效果及无脚本内容。另检查桌面与手机截图。

这些是教学可视化与页面行为检查，不是模型训练、GPU 跑分或整站 CPU 百分比测量。
