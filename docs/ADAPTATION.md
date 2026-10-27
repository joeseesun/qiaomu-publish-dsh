# 乔木排版 DSH 适配

源仓库 https://github.com/joeseesun/qiaomu-publish，冻结基线 `4fbeae30017e1db4be95b7454620b30eae47ada8`。不修改原插件工作区及未提交内容。

目标 DSH 0.2.1-rc.3。客户端使用原生 main / sidebar.panellist Slot，Host Remote 持久化，原 Obsidian UI/文件 API 重建，不引入 Obsidian 兼容壳。

验收记录将在本目录追加。

## 迁移初始缺项记录（历史记录，以下 22:12 更新为当前状态）

本表以冻结来源代码为基线；“已实现”不等于全部端到端已验证。不得将待迁移项改写为不支持后发布精简版。

| 能力 | 原始证据 | DSH 等价行为 | 当前状态 |
| --- | --- | --- | --- |
| 主题和逐篇样式 | themes.ts、article-style.ts、article-style-panel.ts | 42主题、搜索、字体/字号/行距/段距/留白/主色/缩进、默认与逐篇 | 部分；主题与基础预览已实现，完整控件和逐篇保存待迁移 |
| 完整文章渲染 | render-note.ts、host-mermaid.ts、code-highlight.ts | 代码行号/配色、MathJax/Mermaid图片、脚注/说明/自定义CSS | 部分；Markdown与代码高亮已迁移，其余待做 |
| 工作区与同步 | preview-view.ts、scroll-sync.ts | 文件选择/修改同步、双向滚动、重命名保留设置 | 未迁移 |
| 本地与远程附件 | image-assets.ts、external/assets.ts | Wiki/MD/HTML/引用/嵌入笔记附件、去重、SVG栅格、缺图阻断 | 未迁移 |
| 导出与剪贴板 | copy-html.ts、export-file.ts、rasterize.ts | 同样式富文本、嵌入图片HTML、长图PNG、超长降采样提醒 | 部分；HTML/文字复制已实测，图片与长图待迁移 |
| 封面编辑 | cover/*、title-cover.ts | 图片来源优先级、本机/笔记图片、裁剪、标题封面文字字体背景 | 未迁移 |
| 公众号账号 | connection-modal.ts、transport-router.ts | 多账号、直连/乔木中转/自建Bridge、测试与错误分类/IP查询 | 未迁移；用 API 测试，不自动操作微信 UI |
| 公众号草稿 | publisher.ts、publish-modal.ts | 标题作者摘要、封面/图片上传、新建/更新、关联ID/笔记属性回写 | 未迁移；真实外发单独按用户授权验收 |
| X/知乎交接 | bridge/*、external/prepare.ts | Clipper一次性凭据桥、编辑文章/封面、媒体保真与上限、取消清理 | 未迁移 |
| 小红书卡片 | external/xhs-cards.ts、card-layout.ts | 6模板、配色分页/移除、3:4 PNG、标题正文话题交接 | 未迁移 |
| 凭据与迁移 | settings-tab.ts、main.ts | 系统安全凭据、旧Agent配置只读迁移、原数据迁移 | 未迁移 |
| Blog 子插件能力 | qiaomu-blog-opensource/ecosystem/obsidian-publisher | 博客API草稿、R2本地/远程图片音视频、标题推导 | 尚待逐项对照；不能仅因职责相近就省略 |

## UI 迁移硬约束（用户 2026-10-27 明确要求）

尽可能直接复用 Obsidian 原版的布局、CSS、组件、图标、交互和设置界面，不自行重新设计。只改宿主 API、必要的容器与主题变量映射；不得以换宿主为理由重画 UI 或删减功能。逐项对照原版截图与真实交互验收。

## 2026-10-27 22:12 原版迁移更新（以上早期状态已过时）

实际入口已使用 src/original 的 WechatPreviewView、QiaomuPublishSettingTab、WechatPublishModal、ExternalPublishModal、CoverEditor、CoverPicker、裁剪与设计弹窗、42 个主题和六套卡片模板。styles.css 与冻结源字节完全一致，字体随包附带。旧自绘入口、ported/render 与对应测试已移出项目。

| 能力 | 当前实现与独立证据 |
| --- | --- |
| 主题、逐篇排版、同步滚动、工具栏 | 原版组件直用；主题搜索 42 项、Linear Night 切换、重命名后样式保留和磁盘 state 已核验。深色提示块文字与公式背景补可读性修复，布局不变。 |
| Markdown、公式与图表 | Marked/脚注/原版 Markdown 预处理；内置 MathJax、Mermaid 转 PNG 实际预览。Wiki/Markdown/HTML/引用图片、笔记与标题/块嵌入、循环限制、相对路径和同名歧义有针对性检查。 |
| 文件与配置 | 显式 notesDir、2 MB Markdown、CAS、原子保存、重命名不覆盖、外部修改同步、草稿恢复；旧 Publish/Agent data.json 导入，保留 secret IDs，凭据需重新填入新宿主系统钥匙串。原 Obsidian 数据与钥匙串不修改。 |
| 导出 | 原版 HTML/富文本/长图实现；实导 HTML 42495 字节，2 张内嵌图片且无残留 blob；长图 PNG 1354×1648、173151 字节，已查看。后续修复隐藏脚注辅助标题，最终发布包需复验。 |
| 公众号 | 原版多账号/直连/中转/自建 Bridge、封面/草稿新建更新/前置检查/回写保留；Host HTTP 和系统凭据替代 Obsidian API。原版传输、上传、回滚与错误分类 fixture 测试通过。未发送真实公众号草稿，不代表真实账户业务已验收。 |
| X / 知乎 | 原版 Markdown/封面/手机预览、Clipper v1 协议保留；127.0.0.1 Host 临时监听，单次 token、扩展来源、会话令牌、取消/超时/卸载清理。真实本地 socket 测试通过；X 原版窗口已准备就绪。未向外部平台创建草稿。 |
| 小红书 | 原版六模板/配色/字体/分页/移除/正文话题/手机预览；实际窗口完成 3 张卡片准备。独立真实浏览器调用同一原版导出模块，六模板共 12 张 1080×1440 PNG 已生成与查看。 |
| 命令 | Harness 原生快捷操作：预览、4 平台窗口、设置、更新说明；操作只打开窗口，发送仍由窗口按钮触发。 |
| Blog 子插件 | 单独按 qiaomu-blog-publisher-dsh 迁移，保留原博客 API/R2 能力，不用 Publish 的公众号能力冒充博客迁移。整组任务中仍待完成。 |

最新检查：15 项 Node 边界测试 + 391 项原版/原界面测试，构建与包契约通过。已完整归集实际打包的 94 项依赖和字体许可证。运行候选 r29；720px 窄屏实测无页面横向溢出，最终 HTML 42075 字节，2 张嵌入图片，无 blob 和隐藏脚注辅助标题。异步保存期间继续编辑或更换文件路径均保持未保存状态，补充延迟写入回归测试。GitHub 发布与日用安装证据见后续追加记录。Windows/Linux 凭据使用 DPAPI/Secret Service，当前实机环境只验证 macOS，不虚报其他系统验收。
