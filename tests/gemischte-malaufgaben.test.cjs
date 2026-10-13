const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../app/src/main/assets/gemischte-malaufgaben.js');
let seed=79;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
function check(t,max,rows){
 assert.equal((t.expression.match(/□/g)||[]).length,1);assert(t.numbers.every(n=>Number.isInteger(n)&&n>=0&&n<=max));assert(t.intermediates.every(n=>Number.isInteger(n)&&n>=0&&n<=max));
 assert(t.res>=0&&t.res<=max);assert(t.rhs>=0&&t.rhs<=max);assert(t.products.every(p=>rows.includes(p.row)));assert(t.solutionLines.length>=1);
 assert(M.accepts(t,t.res));for(const wrong of [t.res-1,t.res+1,'','x','3.5'])assert(!M.accepts(t,wrong));
 if(t.answerIndex>=0){let solutions=0;for(let x=0;x<=max;x++)if(t.coeff*x+t.offset===t.rhs){solutions++;assert.equal(x,t.res);}assert.equal(solutions,1);}
 const completed=t.expression.replace('□',t.res).replaceAll('×','*').replaceAll('−','-');const [a,b]=completed.split('=');assert.equal(Function('return '+a)(),Function('return '+b)());
}
test('Alle sechs Typen, Faktorenpositionen, vertauschte Gleichungen und Reihen',()=>{
 const seen=new Set(),positions=new Set(),reverse=new Set(),variants=new Set(),rowsSeen=new Set();
 for(const type of 'ABCDEF')for(let i=0;i<180;i++){
  const t=M.generate({type,max:1000,rows:[2,7,9],profile:'free',difficulty:'hard',rng});check(t,1000,[2,7,9]);seen.add(t.type);t.products.forEach(p=>rowsSeen.add(p.row));
  if(type==='A'){positions.add(t.answerIndex);reverse.add(/^\d+ =/.test(t.expression));}if(type==='F')variants.add(t.variant);
 }
 assert.equal(seen.size,6);assert.equal(positions.size,2);assert.equal(reverse.size,2);assert.equal(variants.size,4);assert.deepEqual([...rowsSeen].sort(),[2,7,9]);
});
test('Grenzen und Schwierigkeitsstufen, auch bei engen Zahlenräumen',()=>{
 let count=0;
 for(const max of [1,10,20,100,1000])for(const difficulty of ['easy','standard','hard'])for(let i=0;i<80;i++){
  const t=M.generate({max,rows:[1],difficulty,rng});check(t,max,[1]);
  if(difficulty==='easy')assert(['A','D','E'].includes(t.type));if(difficulty!=='hard')assert.notEqual(t.type,'F');count++;
 }
 assert.equal(count,1200);assert.throws(()=>M.generate({max:5,rows:[9]}),/höhere Grenze/);assert.throws(()=>M.generate({max:20,rows:[2,9],profile:'tens'}),/Nicht alle/);
});
test('Reihen werden nicht auf 6 festgelegt; Quadrate und Zehnerprofil gelten',()=>{
 for(const row of [1,2,3,4,5,6,7,8,9,10])for(let i=0;i<20;i++)check(M.generate({max:1000,rows:[row],profile:'table',difficulty:'hard',rng}),1000,[row]);
 for(let i=0;i<30;i++){const t=M.generate({max:1000,rows:['squares'],difficulty:'standard',rng});assert(t.products.every(p=>p.a===p.b&&p.row==='squares'));check(t,1000,['squares']);}
 for(let i=0;i<30;i++){const t=M.generate({max:1000,rows:[3,8],profile:'tens',difficulty:'hard',rng});assert(t.products.every(p=>p.a%10===0||p.b%10===0));check(t,1000,[3,8]);}
});
test('Möglichst keine direkten Wiederholungen bei ausreichendem Aufgabenraum',()=>{
 const recent=[];for(let i=0;i<80;i++){const t=M.generate({max:100,rows:['mixed'],difficulty:'hard',rng,recent});assert(!recent.includes(t.key));recent.push(t.key);}
});

test('Schwere Klammern respektieren das Zahlenprofil und die Quadratauswahl',()=>{
 for(const profile of ['table9','table','tens','free'])for(let i=0;i<60;i++){
  const t=M.generate({type:'F',variant:3,rows:[3,8],profile,max:1000,difficulty:'hard',rng});check(t,1000,[3,8]);
  if(profile==='table9')assert(t.products.every(p=>p.a<=9&&p.b<=9));if(profile==='table')assert(t.products.every(p=>p.a<=10&&p.b<=10));if(profile==='tens')assert(t.products.every(p=>p.b%10===0));
 }
 for(let i=0;i<40;i++){const t=M.generate({type:'F',variant:3,rows:['squares'],max:1000,difficulty:'hard',rng});check(t,1000,['squares']);assert(t.products.every(p=>p.a===p.b));}
});

test('Die ausgewählte Reihe bleibt bei fehlenden Faktoren bekannt',()=>{
 const answers=new Set(),positions=new Set();for(let i=0;i<80;i++){const t=M.generate({type:'A',max:100,rows:[7],rng});assert.equal(t.numbers[1-t.answerIndex],7);answers.add(t.res);positions.add(t.answerIndex+'|'+(/^\d+ =/.test(t.expression)));}
 assert(answers.size>=5);assert.equal(positions.size,4);
 for(const variant of [0,1,2])for(let i=0;i<20;i++){const t=M.generate({type:'F',variant,max:1000,rows:[7],difficulty:'hard',rng});assert.equal(t.coeff,7);check(t,1000,[7]);}
});
