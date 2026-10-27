import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('build/cards-qa',{recursive:true});
await build({entryPoints:['tests/browser/cards.ts'],outfile:'build/cards-qa/cards.js',bundle:true,platform:'browser',format:'esm',loader:{'.woff2':'base64'}});
await writeFile('build/cards-qa/index.html','<!doctype html><html lang="zh"><meta charset="utf-8"><title>Publish original card export QA</title><style>body{font:16px sans-serif;margin:24px}main{display:flex;flex-wrap:wrap;gap:20px}a{display:flex;flex-direction:column;gap:8px;color:#222}img{border:1px solid #ddd}</style><button>生成六套原版卡片 PNG</button><p role="status">未开始</p><main></main><script type="module" src="cards.js"></script></html>');
