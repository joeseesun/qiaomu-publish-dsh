import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nativeMath} from '../src/native-renderers.ts';
test('actual bundled MathJax retains inline math, fractions and aligned environments',()=>{
 const math=nativeMath();for(const source of ['E=mc^2','\\frac{a+b}{c}','\\begin{aligned}a&=b+c\\\\d&=e\\end{aligned}']){const output=math.tex2mml(source,{display:true});assert.match(output,/<math/);assert(!output.includes('merror'));}assert.throws(()=>math.tex2mml('x'.repeat(20001)),/too large/);
});
