import mermaid from 'mermaid';
import {mathjax} from 'mathjax-full/js/mathjax.js';
import {TeX} from 'mathjax-full/js/input/tex.js';
import {AllPackages} from 'mathjax-full/js/input/tex/AllPackages.js';
import {liteAdaptor} from 'mathjax-full/js/adaptors/liteAdaptor.js';
import {RegisterHTMLHandler} from 'mathjax-full/js/handlers/html.js';
import {SerializedMmlVisitor} from 'mathjax-full/js/core/MmlTree/SerializedMmlVisitor.js';
import {STATE} from 'mathjax-full/js/core/MathItem.js';
import {SVG} from 'mathjax-full/js/output/svg.js';
let diagramReady=false,math:any=null;
export function nativeMermaid(){if(!diagramReady){mermaid.initialize({startOnLoad:false,securityLevel:'strict',maxTextSize:20000,maxEdges:500,flowchart:{htmlLabels:false},suppressErrorRendering:true});diagramReady=true;}return mermaid;}
export function nativeMath(){if(!math){RegisterHTMLHandler(liteAdaptor());const document=mathjax.document('',{InputJax:new TeX({packages:AllPackages}),OutputJax:new SVG({fontCache:'none'})});const visitor=new SerializedMmlVisitor();math={tex2mml(tex:string,{display=false}={}){if(tex.length>20000)throw Error('Formula too large');return visitor.visitTree(document.convert(tex,{display,end:STATE.CONVERT}));}};}return math;}
