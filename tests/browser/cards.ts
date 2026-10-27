import {layoutXhsCards,renderCardBlobs} from '../../src/original/external/xhs-cards';
import {CARD_TEMPLATES} from '../../src/original/external/card-styles';
document.querySelector('button')!.onclick=async()=>{
 const status=document.querySelector('[role=status]')!;const output=document.querySelector('main')!;
 try{for(const template of CARD_TEMPLATES){status.textContent=template.name;const options={title:'原版卡片迁移验收',subtitle:'直接复用原组件、字体、配色与分页',meta:['2026-10-27','乔木'],html:'<h2>保留原来的阅读体验</h2><p>完整功能迁移到 DeepSeek Harness，继续使用熟悉的样式。</p><p>这只是本地导出验收，不会提交任何外部平台。</p>',template:template.id,palette:template.palettes[0].id,font:'',pagination:'flow' as const};const layout=await layoutXhsCards(options);const blobs=await renderCardBlobs(layout.cards,options);for(const [index,blob] of blobs.entries()){const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`${template.id}-${index+1}.png`;link.textContent=template.name+' '+(index+1);const image=document.createElement('img');image.src=link.href;image.width=180;image.height=240;image.alt=link.download;await image.decode();link.append(image);link.dataset.size=`${image.naturalWidth}x${image.naturalHeight}`;output.append(link);} }
 status.textContent='完成';}catch(e){status.textContent='失败：'+(e as Error).message;}
};
