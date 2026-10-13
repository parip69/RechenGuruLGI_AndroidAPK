/* Offline Rechenketten: no eval, exact integer division, bounded paper steps. */
(function(root){
'use strict';
const symbols={plus:'+',minus:'−',mal:'×',geteilt:'÷'};
function normalizeOps(ops){const a=Array.isArray(ops)?ops:String(ops||'').split(',');const valid=[...new Set(a.filter(x=>Object.prototype.hasOwnProperty.call(symbols,x)))];return valid.length?valid:['plus'];}
function text(numbers,ops){return numbers.map((n,i)=>(i?symbols[ops[i-1]]+' ':'')+n).join(' ');}
function evaluate(numbers,ops,max=Infinity){
 if(numbers.length<2||ops.length!==numbers.length-1||numbers.some(n=>!Number.isInteger(n)||n<0||n>max)||ops.some(o=>!Object.prototype.hasOwnProperty.call(symbols,o)))throw Error('Invalid chain');
 const ns=numbers.slice(),os=ops.slice(),steps=[text(ns,os)],intermediates=[];
 while(os.length){let i=os.findIndex(o=>o==='mal'||o==='geteilt');if(i<0)i=0;const a=ns[i],b=ns[i+1],op=os[i];
  if(op==='geteilt'&&(b===0||a%b!==0))throw Error('Division must be exact');
  const n=op==='plus'?a+b:op==='minus'?a-b:op==='mal'?a*b:a/b;
  if(!Number.isSafeInteger(n)||n<0||n>max)throw Error('Result outside range');
  ns.splice(i,2,n);os.splice(i,1);intermediates.push(n);steps.push(text(ns,os));
 }
 return {res:ns[0],steps,intermediates};
}
function generate({max=100,count=4,ops=['plus'],pattern='free',rng=Math.random}={}){
 max=Math.trunc(Number(max));count=count==='mixed'?2+Math.min(8,Math.floor(rng()*9)):Math.trunc(Number(count));if(max<1||max>9999||count<2||count>10)throw Error('Invalid settings');ops=normalizeOps(ops);
 const pick=n=>Math.min(n-1,Math.floor(rng()*n)),int=(a,b)=>a+pick(b-a+1);
 const shuffled=ops.slice();for(let i=shuffled.length-1;i>0;i--){const j=int(0,i);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
 let schedule=Array.from({length:count-1},(_,i)=>i<shuffled.length?shuffled[i]:ops[pick(ops.length)]);
 const high=shuffled.filter(o=>o==='mal'||o==='geteilt'),low=shuffled.filter(o=>o==='plus'||o==='minus');
 if(!['free','terms','startHigh','mixed'].includes(pattern))throw Error('Invalid pattern');
 if(pattern==='mixed')pattern=['free','terms','startHigh'][pick(3)];
 if(high.length&&low.length&&pattern!=='free'){
  let hi=0,lo=0;
  schedule=schedule.map((_,i)=>(pattern==='terms'?i%2===0:i===0)?high[hi++%high.length]:low[lo++%low.length]);
 }
 if(ops.length===1&&ops[0]==='geteilt'){
  let product=int(1,Math.min(9,Math.max(1,Math.floor(max/(2**(count-1))))));const divisors=[];
  for(let i=0;i<count-1;i++){const room=Math.max(1,Math.floor((max/product)**(1/(count-1-i))+1e-9));const d=int(room>=2?2:1,Math.min(9,room));divisors.push(d);product*=d;}
  const numbers=[product,...divisors],chosen=divisors.map(()=>'geteilt'),solved=evaluate(numbers,chosen,max),expression=text(numbers,chosen);
  return {op:'chain',fmt:'standard',missing:2,a:numbers[0],b:numbers[1],sym:'÷',numbers,ops:chosen,...solved,expression,key:'chain|'+expression};
 }
 const first=ops.length===1&&ops[0]==='minus'?int(Math.ceil(max/2),max):int(1,Math.max(1,Math.floor(max/(count-1))));
 const numbers=[first],chosen=[];
 for(const op of schedule){let n,accepted=false;
  for(let tries=0;tries<80;tries++){
   if(op==='geteilt'){
    let i=chosen.length-1;while(i>=0&&(chosen[i]==='mal'||chosen[i]==='geteilt'))i--;
    const tail=numbers.slice(i+1),tailOps=chosen.slice(i+1),term=tail.length===1?tail[0]:evaluate(tail,tailOps,max).res;
    const divisors=Array.from({length:Math.min(max,Math.max(1,Math.min(term||10,10)))},(_,k)=>k+1).filter(d=>term%d===0);
    const useful=divisors.filter(d=>d>1);n=(useful.length?useful:divisors)[pick(useful.length||divisors.length)];
   }else if(op==='mal')n=int(1,Math.min(max,9));
   else n=int(tries<70?1:0,Math.min(max,Math.max(1,Math.floor(max/(count-1)))));
   try{const result=evaluate([...numbers,n],[...chosen,op],max);if(tries<40&&result.res===0)continue;accepted=true;break;}catch(e){}
  }
  if(!accepted)n=(op==='mal'||op==='geteilt')?1:0;
  numbers.push(n);chosen.push(op);
 }
 const solved=evaluate(numbers,chosen,max),expression=text(numbers,chosen);
 return {op:'chain',fmt:'standard',missing:2,a:numbers[0],b:numbers[1],sym:symbols[chosen[0]],numbers,ops:chosen,...solved,expression,key:'chain|'+expression};
}
const api={generate,evaluate,text,normalizeOps};root.MatheChains=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
