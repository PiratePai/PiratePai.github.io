---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["scripts/site-search.js","assets/site.css","search-index.json"]
---

# 首页阅读手册

模式：Read。范围：首页、站内搜索；文章正文及阅读器保持不变。用户已选 reading-handbook、code-first，并追加搜索功能。

## Direction contract

THESIS: 首页先解释主题关系与建议顺序，再进入长篇综述。拒绝营销式大标题加统计，也拒绝不解释关系的扁平目录。

OWN-WORLD: 冷白阅读面、蓝灰侧栏、深蓝正文与深青链接。导航、主栏和页边关联提示形成稳定的三栏；正文保持舒适行宽，控件使用普通文档语法。

STORY: 读者先理解模型结构，进而学习缓存、压缩与解码，再学习并行和服务，最后做性能验证；目录按知识结构分五部分，主线与选读分支分开。顶部搜索可以直接找术语与章节。

FIRST VIEWPORT: 左栏约224px，中央紧凑标题与五部分知识导读，右栏关联提示；搜索在中央顶部。常用宽度首屏能看到模型基础和推理优化，不将文章入口推到屏外。手机折叠导航并按阅读顺序单列。

FORM: 分阶段阅读手册，首轮候选第2项教材章节旁注系统，用户在 safer 比较轮选中 reading-handbook；seed:aa0db9a17c37cb1f。选中草图 .impeccable/mocks/decision/reading-handbook.html，已生成效果图 .impeccable/mocks/decision/reading-handbook.png 作为评审参照，并非逐像素实现契约。署名与搜索均为真实控件，不增加草图里虚构的关于页面。

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
