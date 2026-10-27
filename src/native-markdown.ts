import {Marked} from 'marked';
import markedFootnote from 'marked-footnote';
import DOMPurify from 'dompurify';
import {stripFrontmatter} from './original/markdown-prep';

const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const markdown=new Marked({gfm:true,breaks:false});
markdown.use(markedFootnote());
markdown.use({extensions:[{
 name:'wiki',level:'inline',start(src:string){return src.search(/!?\[\[/);},
 tokenizer(src:string){const match=/^(!?)\[\[([^\]\n]+)\]\]/.exec(src);if(match)return{type:'wiki',raw:match[0],embed:!!match[1],value:match[2]};},
 renderer(token:any){const [target,...labels]=token.value.split('|');const label=labels.join('|')||target;
  return token.embed?`<span class="internal-embed" data-native-embed="${escape(target)}" data-native-label="${escape(label)}"></span>`:`<a class="internal-link" href="#" data-href="${escape(target)}">${escape(label)}</a>`;
 }
}]});

function noteSection(text:string,fragment:string){
 if(!fragment)return text;
 if(fragment.startsWith('^')){const id=fragment.slice(1);const lines=text.split('\n');const at=lines.findIndex(line=>line.endsWith(' ^'+id)||line==='^'+id);if(at<0)throw Error(`找不到嵌入块：${fragment}`);let start=at;while(start>0&&lines[start-1].trim())start--;return lines.slice(start,at+1).join('\n').replace(new RegExp('\\s*\\^'+id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$'),'');}
 const lines=text.split('\n');const at=lines.findIndex(line=>/^#{1,6}\s/.test(line)&&line.replace(/^#+\s+|\s+#+\s*$/g,'').trim()===decodeURIComponent(fragment));if(at<0)throw Error(`找不到嵌入标题：${fragment}`);const level=/^#+/.exec(lines[at])![0].length;let end=at+1;while(end<lines.length&&!new RegExp(`^#{1,${level}}\\s`).test(lines[end]))end++;return lines.slice(at,end).join('\n');
}

/** Uses only the explicit notes workspace. Nested references resolve relative to their own file. */
export async function renderNativeMarkdown(app:any,source:string,root:HTMLElement,sourcePath:string,component:any,stack:string[]=[]){
 if(stack.length>=8||stack.includes(sourcePath))throw Error('笔记嵌入循环或超过 8 层');
 const trail=[...stack,sourcePath];
 root.innerHTML=DOMPurify.sanitize(await markdown.parse(stripFrontmatter(source)),{ADD_ATTR:['data-native-embed','data-native-label','data-href']});
 for(const quote of Array.from(root.querySelectorAll('blockquote'))){
  const first=quote.firstElementChild;if(first?.tagName!=='P')continue;
  const match=/^\[!([\w-]+)\][+-]?(?:[ \t]+([^\n]*))?(?:\n|$)/.exec(first.textContent||'');if(!match)continue;
  const callout=document.createElement('div');callout.className='callout';callout.dataset.callout=match[1];const title=document.createElement('div');title.className='callout-title-inner';title.textContent=match[2]||'';callout.append(title);
  const content=document.createElement('div');content.className='callout-content';const newline=first.innerHTML.indexOf('\n');if(newline<0)first.remove();else first.innerHTML=first.innerHTML.slice(newline+1);content.append(...quote.childNodes);callout.append(content);quote.replaceWith(callout);
 }
 for(const backref of root.querySelectorAll('[data-footnote-backref]'))backref.classList.add('footnote-backref');
 // The upstream host hides this screen-reader heading; don't turn it into an article H2.
 for(const heading of root.querySelectorAll('section[data-footnotes] > h2.sr-only'))heading.remove();
 for(const node of Array.from(root.querySelectorAll<HTMLElement>('[data-native-embed]'))){
  const raw=node.dataset.nativeEmbed!;const [link,fragment='']=raw.split('#');const file=app.metadataCache.getFirstLinkpathDest(link,sourcePath);
  node.setAttribute('src',file?.path||raw);node.classList.add('is-loaded');
  if(!file){node.textContent=`无法找到嵌入：${raw}`;continue;}
  if(file.extension.toLowerCase()==='md'){
   node.classList.add('markdown-embed');const content=document.createElement('div');content.className='markdown-embed-content';node.append(content);
   const nested=noteSection(await app.vault.cachedRead(file),fragment);
   // The export pipeline collects math/diagram placeholders from nested documents too.
   const prepared=app.prepareEmbeddedMarkdown?app.prepareEmbeddedMarkdown(nested):nested;
   await renderNativeMarkdown(app,prepared,content,file.path,component,trail);
  }else if(/^(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(file.extension)){
   node.classList.add('image-embed');const image=document.createElement('img');image.alt=file.basename;image.src=await app.vault.resource(file);const size=/^(\d+)(?:x(\d+))?$/.exec(node.dataset.nativeLabel||'');if(size){image.width=Math.min(4096,Number(size[1]));if(size[2])image.height=Math.min(4096,Number(size[2]));}node.append(image);
  }else node.textContent=raw;
 }
 for(const image of Array.from(root.querySelectorAll<HTMLImageElement>('img'))){
  if(image.closest('.image-embed'))continue;
  const src=image.getAttribute('src')||'';if(/^(https?:|data:|blob:)/i.test(src))continue;
  let link=src;try{link=decodeURIComponent(src);}catch{}
  const file=app.metadataCache.getFirstLinkpathDest(link.split('#')[0],sourcePath);
  const wrapper=document.createElement('span');wrapper.className='internal-embed image-embed is-loaded';wrapper.setAttribute('src',file?.path||link);image.replaceWith(wrapper);wrapper.append(image);
  if(file)image.src=await app.vault.resource(file);
 }
}
