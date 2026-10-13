const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../app/src/main/assets/rechenketten.js');
test('Punkt vor Strich, gleichrangig von links und vollständiger Papierweg',()=>{
 const t=M.evaluate([3,5,6,2],['mal','minus','geteilt'],100);
 assert.equal(t.res,12);assert.deepEqual(t.steps,['3 × 5 − 6 ÷ 2','15 − 6 ÷ 2','15 − 3','12']);
 assert.equal(M.evaluate([24,3,2],['geteilt','mal'],100).res,16);
 assert.equal(M.evaluate([30,10,5],['minus','minus'],100).res,15);
});
test('Ungültige Divisionen, negative und zu große Zwischenergebnisse zurückweisen',()=>{
 assert.throws(()=>M.evaluate([3,0],['geteilt'],100));assert.throws(()=>M.evaluate([3,2],['geteilt'],100));
 assert.throws(()=>M.evaluate([3,5],['minus'],100));assert.throws(()=>M.evaluate([20,10,190],['mal','minus'],100));
 assert.throws(()=>M.generate({max:0}));assert.throws(()=>M.generate({count:11}));
});
test('Alle 15 Zeichenkombinationen, Längen und Grenzen gegen unabhängige Auswertung',()=>{
 let seed=421;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};let cases=0;
 const all=['plus','minus','mal','geteilt'],js={plus:'+',minus:'-',mal:'*',geteilt:'/'};
 for(const max of [1,2,10,20,100,1000,9999])for(let count=2;count<=10;count++)for(let mask=1;mask<16;mask++)for(let k=0;k<10;k++){
  const ops=all.filter((_,i)=>mask&(1<<i)),t=M.generate({max,count,ops,rng});
  assert.equal(t.numbers.length,count);assert.equal(t.ops.length,count-1);assert(t.ops.every(o=>ops.includes(o)));
  assert(t.numbers.every(n=>Number.isInteger(n)&&n>=0&&n<=max));assert(t.intermediates.every(n=>Number.isInteger(n)&&n>=0&&n<=max));
  const expr=t.numbers.map((n,i)=>(i?js[t.ops[i-1]]:'')+n).join('');
  assert.equal(t.res,Function('return '+expr)());assert(t.res>=0&&t.res<=max);assert.equal(t.steps.length,count);
  if(ops.length<=count-1)for(const op of ops)assert(t.ops.includes(op));cases++;
 }
 assert.equal(cases,9450);
});
test('Gemischte Länge und die gewünschten Mal/Geteilt-Blöcke beachten Auswahl und Grenzen',()=>{
 let seed=212;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const lengths=new Set();
 for(const pattern of ['free','terms','startHigh','mixed'])for(const max of [1,20,100,1000])for(let i=0;i<100;i++){
  const task=M.generate({max,count:'mixed',ops:['mal','geteilt','plus','minus'],pattern,rng});lengths.add(task.numbers.length);
  assert(task.numbers.length>=2&&task.numbers.length<=10);assert.equal(M.evaluate(task.numbers,task.ops,max).res,task.res);
  if(pattern==='terms')task.ops.forEach((op,index)=>assert((index%2===0?['mal','geteilt']:['plus','minus']).includes(op)));
  if(pattern==='startHigh'){assert(['mal','geteilt'].includes(task.ops[0]));assert(task.ops.slice(1).every(op=>['plus','minus'].includes(op)));}
 }
 assert.deepEqual([...lengths].sort((a,b)=>a-b),[2,3,4,5,6,7,8,9,10]);
 for(const ops of [['plus'],['mal','geteilt'],['minus','plus']])for(const pattern of ['terms','startHigh','mixed'])assert(M.generate({ops,pattern,count:6,rng}).ops.every(op=>ops.includes(op)));
 assert.throws(()=>M.generate({pattern:'invalid'}));
});
