# AGENTS.md · 本仓库必读（写作与发布规范）

> 本文件是 piratepai.github.io 仓库的 **agent 必读**。任何"写新综述 / 修改文章 / 发布上线"任务，
> 动手前先通读本文件；交付前用它当 checklist 逐项核对。
> 规范从既有 13 篇综述（尤其是最新例程 `posts/strata-hybrid-inference.html` 与
> `posts/realtime-world-models-2026.html`）反向总结而来；观点性准则源自
> `D:\Github\world-model\INSIGHT-WRITING-GUIDE.md`（历史协作纠错沉淀，两处保持一致）。

---

## 一、仓库结构与发布链路

| 位置 | 内容 |
|---|---|
| `index.html` | 首页：推理效率栈 L1–L6 分层卡 + "延伸·训练与架构"卡片网格 + 浏览量曲线（views.json + 不蒜子） |
| `posts/*.html` | 文章正文，全部为**自包含 HTML**（无外部 CSS/JS 依赖，暗色主题，移动端适配） |
| `posts/img/` | 论文原图/手绘图 SVG（部分文章图片以内嵌 base64 或相对路径引用） |
| `views.json` / `scripts/` | 每日 04:30 自动快照的 PV/UV 数据与脚本 |
| `AGENTS.md` | 本文件 |

**发布流程（github.com:443 不通时用 API 通道）**：
1. 本地仓库改文件 → `git add` + `git commit`（在 **main** 分支；不要动 `feature/gate`）。
2. 在 `D:\Github\spec\` 下执行 `node push-via-api.mjs D:/Github/PiratePai.github.io`——
   它按 blob sha 对比本地与远端 main，只把**内容有差异的文件**经 Git Data API 推上去。
3. 发布后 `WebFetch https://piratepai.github.io/` 验证首页与文章可达。
- ⚠️ **门禁警告**：`feature/gate` 分支上的 `gate.js` 与密文版 `llm-perf-simulation-2026.html`
  是邀请码加密试点，**未获用户明确指示不得推送**（push-via-api 会无差别推送所有差异文件，
  所以务必先确认当前分支是 main、且工作区没有 gate 改动）。

---

## 二、文章结构模板（每篇必须长这样）

```
<!DOCTYPE html><html lang="zh-CN"> … 固定 <style> 块（见下）…
返回首页悬浮按钮（position:fixed 左下）
<header class="hero">  kicker（绿色小字：领域 · 年份）/ h1 / p.sub（一条主线）/ .meta chips（调研日期、对象与版本、源码实测对象）
<div class="wrap">
  .toc 目录          ★ 前沿亮点 永远第一条，其后 0..N 章，最后"参考文献"
  #hl 前沿亮点区     2×3 张 .hl-card（日期 + 一句话事件 + → 章节锚点），内嵌自己的 <style>
  h2#s0  导读与大事记  开篇回答"本文回答哪四个问题"；一页纸地图（范式/流派对照表）；ul.timeline 大事记
  h2#s1  预备知识     写给本科生：只用矩阵乘法级常识；每个概念配 .analogy 类比框
  h2#s2+ 发展历程/深拆 按"题目"归队，不按论文逐篇复述
  …每章末尾 .summary3 "本章小结（记住三句话）" 三条 ol
  h2#refs 参考文献    ol.refs，尾部加小字"注："说明信源口径与快照日期
页脚 不蒜子计数 + busuanzi script
```

**命名**：文件名英文小写连字符（如 `realtime-world-models-2026.html`）；
章内小节 `h3` 编号 `3.1/3.2…`；图表编号 `图 0-1 / 图 1-1 / 图 3-1`（章-序号），代码 `代码 7-1`。

## 三、固定 CSS 类（从既有文章复制，不要新发明）

| 类 | 用途 |
|---|---|
| `.card` `.note` | 卡片 / 提示框（note 内 b 高亮） |
| `.citebox` | **引用框**（核心规范，见第四节） |
| `.analogy` | 类比框，自动加 "🍽 类比" 前缀 |
| `.timeline` `.t` | 大事记竖排时间线 |
| `.fig` `.flowrow` `.fbox(.hl/.ok)` `.arr` `.cap` | 手绘流程图：盒子+箭头+图注（图内机制说明用小字） |
| `.pill` `.tag(.sys/.paper/.ind)` | 药丸标签 / 分类徽标（系统/论文/工程） |
| `.summary3` | 章末三句话小结（绿框） |
| `sup.cite` | 上标引用 `[KEY]`，white-space:nowrap |
| `pre` `code` `.codecap` | 代码块 + 图注式说明（编号 代码 X-Y） |
| `details/summary` | 长表格、长清单折叠 |

配色变量：`--ink:#6ea8ff`（主蓝）`--muted:#aeb4bd` `--bg:#1b2128` `--card:#171a21`
`--ok:#41d1a7`（绿=亮点/正确）`--warn:#ffb454`（橙=引用框标题/警示）`--accent2:#9d7bff`。
表格奇偶行交替（`tr:nth-child(even)`）。移动端 `@media(max-width:760px)` 单列目录。

## 四、引用规范（最硬的一条）

1. **就地标注**：任何有来源的事实，在出现位置加 `sup.cite` 上标 `[KEY]`；
   文末 `ol.refs` 给全量（作者粗体、标题斜体、venue/arXiv 编号、**精确日期**、链接）。
2. **citebox 原文/译文**：关键论断附近放 `.citebox`：
   `[KEY] 作者. 标题. venue, 日期。原文："…"（中文译文。）`
   英文原句用 `<span class="q">` 斜体，日期精确到日（发布/挂 arXiv 日）。
3. **一手优先，二手标注可信度**：闭源系统只用官方博客/技术报告；媒体报道（36kr、
   Bloomberg 转述）标注"二手信源，标注可信度：…"。自己做的推算写明"推算/估"。
4. **快照日期**：开源仓库的版本事实必须写快照日期（如"main 分支 2026-10 快照"）；
   性能数字注明测量口径，提醒跨系统不可直接比。
5. **图注**：手绘图写"本文自绘，机制综合自 X 论文 Figure N 与 Y 仓库 Z 文件"；
   引用原图写"图 X-Y · 原文 Figure N（arXiv:xxxx.xxxxx）· 图源：…（版权归原作者，引用仅作技术说明）"。

## 五、行文与事实标准

1. **数据必须核实到当天**：版本号、日期、状态（已发布/传闻）发布前重查一轮；
   一个过期锚点会毁掉全文可信度。
2. **原理写到本科生能懂**：每个术语首次出现即解释（Plücker 坐标="像素视线写成 6 个数"这类一句人话）；
   重概念配 `.analogy`（说书人/医院/仓库这类生活类比）。
3. **每章记住三句话**：`.summary3` 强制收敛，读者只读绿框也能带走结论。
4. **讲"为什么"不只给结论**：定性判断翻译成定量（多少 ms、多少 FPS、怎么算的）；
   数字跨表跨文一致。
5. **结构服务逻辑**：按"问题→范式→机制→工程→生态"组织，不按对话时间顺序；
   开篇抛主线（一句话加粗公式化），章末回扣。
6. **诚实标注局限与负结果**：引用论文 limitation 原文（如 LingBot"外观持久≠身份持久"）；
   官方未披露的写"未披露"，不脑补参数量。
7. **中文行文，术语保留英文原名**（latent action / KV cache / DMD 首次出现给中文解释）；
   标点用全角，代码与专有名词用 `code`。

## 六、发布前 checklist

- [ ] 结构完整：hero / toc(★+章+refs) / hl 前沿亮点 / 每章 summary3 / refs+注 / 页脚计数
- [ ] 每个 `[KEY]` 上标在 refs 或邻近 citebox 有对应出处；日期精确；二手信源已标注
- [ ] 图表编号连续、图注含来源与位置；代码块有 codecap
- [ ] 移动端单列正常（浏览器 375px 宽过一遍）；文章无外部资源依赖
- [ ] `index.html`：卡片 tags/h2/p/foot 更新，综述篇数 chip +1，日期 chip 更新
- [ ] 本地预览：`cd D:\Github\spec && node serve-posts.mjs` → http://localhost:8931/<文件名>
- [ ] 在 **main** 分支 commit；确认无 gate 相关文件混入；`node push-via-api.mjs` 推送；线上验证
