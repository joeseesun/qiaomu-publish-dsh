import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const win=new JSDOM('<!doctype html><body></body>').window;
for(const key of ['window','document','DOMParser','Element','HTMLElement','Node','NodeFilter','MutationObserver'])globalThis[key]=key==='window'?win:win[key];
const {renderNativeMarkdown}=await import('../src/native-markdown.ts');
const {createWorkspace}=await import('../src/native-workspace.ts');
const files=[{path:'outer/main.md',text:''},{path:'outer/photo.png'},{path:'inner/embed.md',text:'## Detail\n\n![inside](photo.png)\n\n`![[untouched]]`\n\n> [!note] Callout\n> Keep\n\nFootnote[^1]\n\n[^1]: Source'},{path:'inner/photo.png'}];
test('nested note resolves its own image; footnotes, callouts, code and wiki width survive',async()=>{
 const api={asset:async()=>({base64:'aGVsbG8=',mime:'image/png'})};const workspace=createWorkspace(api,{files},{state:{data:{}},save:async()=>{}});const root=document.createElement('div');
 await renderNativeMarkdown(workspace.app,'![[inner/embed#Detail]]\n\n![[outer/photo.png|320]]',root,'outer/main.md',{});
 assert.equal(root.querySelector('.markdown-embed .image-embed').getAttribute('src'),'inner/photo.png');
 assert.equal(root.querySelector('code').textContent,'![[untouched]]');assert.match(root.textContent,/Callout/);assert(root.querySelector('sup'));assert.equal(root.querySelector('img[width="320"]').width,320);workspace.dispose();
});
test('active HTML is removed and embed cycles fail explicitly',async()=>{
 const workspace=createWorkspace({}, {files:[{path:'self.md',text:'![[self]]'}]}, {state:{data:{}},save:async()=>{}});const root=document.createElement('div');
 await renderNativeMarkdown(workspace.app,'<script>bad()</script><img src="https://example.com/a" onerror="bad()">',root,'main.md',{});assert(!root.innerHTML.includes('onerror'));assert(!root.querySelector('script'));
 await assert.rejects(renderNativeMarkdown(workspace.app,'![[self]]',root,'self.md',{}),/循环/);workspace.dispose();
});
test('ambiguous basename never silently picks an unrelated attachment',()=>{
 const workspace=createWorkspace({}, {files}, {state:{data:{}},save:async()=>{}});assert.equal(workspace.app.metadataCache.getFirstLinkpathDest('photo.png','third/main.md'),null);workspace.dispose();
});
test('publishing metadata for a background note never replaces the active editor',async()=>{
 let edited=0,savedActive=0;
 const workspace=createWorkspace({frontmatter:async request=>({path:request.path,text:'---\nwechat_media_id: fixture\n---\nBackground',etag:'next'})},{files:[{path:'active.md',text:'Active',etag:'a'},{path:'background.md',text:'Background',etag:'b'}]},{state:{data:{}},save:async()=>{},saveNote:async()=>{savedActive++;},setEditor:()=>{edited++;}});
 workspace.view.file=workspace.files.get('active.md');await workspace.app.fileManager.processFrontMatter(workspace.files.get('background.md'),value=>{value.wechat_media_id='fixture';});assert.equal(edited,0);assert.equal(savedActive,0);assert.equal(workspace.view.file.text,'Active');workspace.dispose();
});
