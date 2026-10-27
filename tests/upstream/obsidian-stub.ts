// Existing upstream network fixtures now enter the real Harness request boundary.
import {configureNativeHost} from '../../src/harness-ui';
export function setRequestUrlHandler(handler:any){configureNativeHost({request:async(request:any)=>{
 const body=request.base64?Uint8Array.from(atob(request.base64),c=>c.charCodeAt(0)).buffer:request.body;
 const result=await handler({...request,body});
 let text=result.text; if(text===undefined){try{text=JSON.stringify(result.json??{});}catch{text='<html>Proxy unavailable</html>';}}
 const bytes=result.arrayBuffer?new Uint8Array(result.arrayBuffer):new TextEncoder().encode(text);
 return{status:result.status??200,headers:result.headers??{},base64:Buffer.from(bytes).toString('base64')};
}});}
