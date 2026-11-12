# DeepSeek Harness 0.2.2-rc.2 verification

Verified 2026-11-12 (America/Los_Angeles). Product 0.1.4, baseline v0.1.3 / `e4bde2c42964af4190b858de0b4fde67d7ca177d`.

The old public tgz is rejected by the unmodified official rc.2 installer in an empty profile. This release explicitly adds only `0.2.2-rc.2` to the existing engines/DSH peers; untested future rc.3 remains rejected. Lock root metadata and bundled product identity are synchronized; the locked dependency graph is unchanged.

Upstream: [official rc.2 release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.2-rc.2). The official compatibility evaluator still gives engines.dsh precedence. Reviewed the actual sidebar slot, layout, Typert remote/gateway and tool contracts. The sidebar.panellist registration remains supported; these products do not wrap the changed session append API or depend on the old host overlay positioning API. RSS defines tools through defineTool and does not inspect obsolete error categories. No exemption is used.

## Verified

- Clean `npm ci`, existing `npm run check`, build and package audit pass.
- Official signed macOS arm64 rc.2 Desktop bundled CLI; signature and exact version rechecked. A separate DSH_HOME/workspace and web profile are used, with no daily-host changes.
- Candidate plugin install, composed configuration, host startup and every packaged installed file compared by size/SHA-256.
- 真实 Harness 排版面板编辑 Markdown，经 Host 保存并独立核对磁盘；标题、正文和粗体预览正确；样式菜单切换为 Claude Warm。

## Limits and recovery

本次验证本地排版和保存；未触发公众号草稿、外部发布或微信客户端/内嵌页面操作。 Windows/Linux and older host versions were not rerun; retained older declarations are not new runtime evidence. No production publishing or paid model calls. Existing migration branches and primary-workspace edits are preserved.

Previous version remains available at [the prior release](https://github.com/joeseesun/qiaomu-publish-dsh/releases/tag/v0.1.3). Roll back by installing that tgz with the matching prior host; no data-format migration is introduced. Release assets and the independently downloaded public package are checked separately after merge.
