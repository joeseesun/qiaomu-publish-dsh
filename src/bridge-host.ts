import {createServer,type Server} from 'node:http';
import {randomBytes,randomUUID} from 'node:crypto';
import {BridgeHandler} from './original/bridge/handler';
import {landingUrl,type BridgeJob,type BridgeStatus} from './original/bridge/protocol';

export class BridgeHost {
 runs=new Map<string,any>();
 async start({job,assets}: {job:BridgeJob;assets:Array<{id:string;base64:string;mime:string}>}){
  if(!job||job.v!==1||!['x','zhihu','xhs'].includes(job.target)||!Array.isArray(job.assets)||job.assets.length>200||JSON.stringify(job).length>4*1024*1024)throw Error('Invalid publishing job');
  if(!Array.isArray(assets)||assets.length!==job.assets.length)throw Error('Missing publishing assets');
  if([...this.runs.values()].some(run=>!run.finished))throw Error('A browser hand-off is already running');
  const blobs=new Map();let total=0;
  for(const asset of assets){const manifest=job.assets.find(item=>item.id===asset.id);if(!manifest||blobs.has(asset.id)||!/^[-\w]+$/.test(asset.id)||typeof asset.base64!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(asset.base64)||!/^image\/(png|jpeg|gif|webp|avif|svg\+xml)$/.test(asset.mime))throw Error('Invalid publishing asset');const data=Buffer.from(asset.base64,'base64');total+=data.length;if(total>64*1024*1024||data.length!==manifest.bytes)throw Error('Invalid publishing asset size');blobs.set(asset.id,{data:data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),mime:asset.mime});}
  const id=randomUUID(),token=randomBytes(16).toString('hex'),session=randomBytes(16).toString('hex');
  const run:any={status:{state:'running',text:'等待浏览器扩展'},finished:false,timer:null,server:null};
  let port=0;
  const finish=(status:BridgeStatus)=>{if(run.finished)return;run.finished=true;run.status=status;clearTimeout(run.timer);run.server?.close();setTimeout(()=>run.server?.closeAllConnections(),400).unref();blobs.clear();run.retention=setTimeout(()=>this.runs.delete(id),60000);run.retention.unref();};run.finish=finish;
  const arm=(ms:number,code:string,message:string)=>{clearTimeout(run.timer);run.timer=setTimeout(()=>finish({state:'error',error:{code,message}}),ms);run.timer.unref();};
  const handler=new BridgeHandler({job,token,session,port:()=>port,readAsset:async id=>blobs.get(id)||null,hooks:{onFetched:()=>arm(180000,'idle','浏览器长时间没有响应'),onStatus:status=>{run.status=status;if(status.state!=='running')finish(status);}}});run.handler=handler;
  const server=createServer(async(req,res)=>{try{let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>65536){res.writeHead(413).end();return;}chunks.push(chunk);}const headers=Object.fromEntries(Object.entries(req.headers).map(([key,value])=>[key,Array.isArray(value)?value.join(', '):value]));const reply=await handler.handle({method:req.method||'GET',path:req.url||'/',headers,body:Buffer.concat(chunks).toString('utf8')});if(handler.isFetched&&!run.finished&&reply.status===200)arm(180000,'idle','浏览器长时间没有响应');res.writeHead(reply.status,reply.headers);res.end(reply.body);}catch{if(!res.headersSent)res.writeHead(500);res.end();}});
  server.requestTimeout=15000;server.headersTimeout=10000;run.server=server;
  await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{server.off('error',reject);resolve();});});
  port=(server.address() as any).port;this.runs.set(id,run);arm(45000,'no-extension','没有检测到乔木 Clipper 扩展来取这篇文章');
  return{id,url:landingUrl(job.target,port,token)};
 }
 status({id}:{id:string}){const run=this.runs.get(id);if(!run)throw Error('Browser hand-off expired');return{status:run.status,finished:run.finished};}
 cancel({id}:{id:string}){const run=this.runs.get(id);if(!run||run.finished)return;run.handler.requestCancel();clearTimeout(run.timer);run.timer=setTimeout(()=>run.finish({state:'cancelled',text:'已停止'}),4000);run.timer.unref();}
 dispose(){for(const run of this.runs.values()){clearTimeout(run.retention);run.finish({state:'cancelled'});clearTimeout(run.retention);run.server?.closeAllConnections();}this.runs.clear();}
}
