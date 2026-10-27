import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {WorkspaceStore} from '../src/workspace-store.js';
import {boundedHttpRequest as request} from '../src/network.js';
import {BridgeHost} from '../src/bridge-host.ts';
test('workspace CAS preserves external edits and refuses traversal and symlinks',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'publish-notes-'));try{const store=new WorkspaceStore(root);const first=await store.write({path:'sub/article.md',text:'---\ntitle: First\n---\nBody'});assert.equal((await store.inventory()).files[0].frontmatter.title,'First');const next=await store.saveFrontmatter({path:first.path,etag:first.etag,frontmatter:{title:'Updated',wechat_media_id:'fixture'}});assert.match(next.text,/fixture/);await assert.rejects(store.write({...first,text:'stale'}),/changed/);await assert.rejects(store.asset('../private.png'),/relative/);await symlink('/etc',path.join(root,'external'));await assert.rejects(store.asset('external/passwd'),/Symbolic/);}finally{await rm(root,{recursive:true,force:true});}
});
test('network refuses credential redirects and bounds responses',async()=>{
 await assert.rejects(request({url:'https://example.com?access_token=secret'}, {fetchImpl:async()=>new Response(null,{status:302,headers:{location:'https://other.example/'}})}),/Cross-origin/);
 await assert.rejects(request({url:'https://example.com'}, {fetchImpl:async()=>new Response('x',{headers:{'content-length':String(40*1024*1024)}})}),/exceeds/);
 const result=await request({url:'https://example.com'}, {fetchImpl:async()=>new Response('{"ok":true}',{status:200})});assert.equal(Buffer.from(result.base64,'base64').toString(),'{"ok":true}');
});
test('rename never replaces an existing note and preserves content identity',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'publish-rename-'));try{const store=new WorkspaceStore(root);const first=await store.write({path:'first.md',text:'Original'});await store.write({path:'existing.md',text:'Keep'});await assert.rejects(store.renameNote({...first,to:'existing.md'}),{code:'EEXIST'});assert.equal((await store.read('first.md')).text,'Original');const moved=await store.renameNote({...first,to:'folder/moved.md'});assert.equal(moved.etag,first.etag);assert.equal((await store.read(moved.path)).text,'Original');await assert.rejects(store.read('first.md'),{code:'ENOENT'});}finally{await rm(root,{recursive:true,force:true});}
});
test('real loopback hand-off is one-time, fenced to extension origins and disposed on done',async()=>{
 const host=new BridgeHost();try{const started=await host.start({job:{v:1,id:'fixture',target:'xhs',title:'Fixture',noteName:'qa',content:{text:'Test'},assets:[]},assets:[]});const [,port,token]=/#qp=(\d+)\.(.+)/.exec(started.url);const base=`http://127.0.0.1:${port}`;
 const blocked=await fetch(base+'/v1/job',{headers:{authorization:'Bearer '+token,origin:'https://example.com'}});assert.equal(blocked.status,403);
 const response=await fetch(base+'/v1/job',{headers:{authorization:'Bearer '+token,origin:'chrome-extension://fixture'}});assert.equal(response.status,200);const {session}=await response.json();assert.equal((await fetch(base+'/v1/job',{headers:{authorization:'Bearer '+token}})).status,410);
 const done=await fetch(base+'/v1/status',{method:'POST',headers:{authorization:'Bearer '+session},body:JSON.stringify({state:'done',text:'Fixture only'})});assert.equal(done.status,200);assert.equal(host.status({id:started.id}).finished,true);
 }finally{host.dispose();}
});
