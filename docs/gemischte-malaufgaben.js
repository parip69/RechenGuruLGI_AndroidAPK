/* Grundschul-Arbeitsblatt A–F; pure offline generator, unique affine unknowns. */
(function(root){
'use strict';
const C=root.MatheChains||(typeof require==='function'?require('./rechenketten.js'):null);
function rowsFor(raw,profile){
 const input=Array.isArray(raw)?raw:String(raw||'mixed').split(','),limit=profile==='table9'?9:10;
 let rows=input.includes('mixed')?Array.from({length:limit},(_,i)=>i+1):[...new Set(input.map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=limit))];
 return {rows,squares:input.includes('squares')};
}
function generate(options={}){
 const {max=100,rows=['mixed'],profile='table9',difficulty='standard',rng=Math.random,recent=[],type:forcedType,variant:forcedVariant}=options;
 if(!Number.isInteger(max)||max<1||max>9999)throw Error('Ungültige Ergebnisgrenze.');
 const selected=rowsFor(rows,profile),factorLimit=profile==='tens'?(difficulty==='hard'?100:difficulty==='easy'?20:50):profile==='free'?(difficulty==='hard'?20:difficulty==='easy'?5:12):Math.min(profile==='table9'?9:10,difficulty==='easy'?5:10);
 const pool=[];
 if(selected.rows.some(row=>row>max))throw Error('Die gewählten Reihen brauchen eine höhere Grenze bei „Zahlen bis“.');
 for(const row of selected.rows)for(let factor=1;factor<=Math.min(factorLimit,Math.floor(max/row));factor++){
  if(profile==='tens'&&factor%10!==0)continue;
  pool.push({a:row,b:factor,row});
 }
 if(selected.squares)for(let r=1;r<=Math.min(factorLimit,Math.floor(Math.sqrt(max)));r++)pool.push({a:r,b:r,row:'squares'});
 if(!pool.length)throw Error('Reihen und Zahlenprofil passen nicht zur Grenze. Bitte „Zahlen bis“ erhöhen oder das Profil ändern.');
 if(selected.rows.some(row=>!pool.some(p=>p.row===row)))throw Error('Nicht alle gewählten Reihen passen mit diesem Zahlenprofil zur Grenze. Bitte „Zahlen bis“ erhöhen.');
 const int=(a,b)=>a+Math.min(b-a,Math.floor(rng()*(b-a+1))),choose=a=>a[int(0,a.length-1)];
 const groups=[...new Set(pool.map(p=>p.row))].map(row=>pool.filter(p=>p.row===row));
 const rawPair=(except)=>choose(choose(groups.filter(g=>groups.length===1||g[0].row!==except)));
 const pair=(except)=>{const p={...rawPair(except)};if(int(0,1))[p.a,p.b]=[p.b,p.a];return p;};
 const types=forcedType?[forcedType]:difficulty==='easy'?['A','D','E']:difficulty==='hard'?['A','B','C','D','E','F','F','F']:['A','B','C','D','E'];
 if(types.some(t=>!['A','B','C','D','E','F'].includes(t)))throw Error('Ungültiger Aufgabentyp.');
 let last=null;
 for(let attempt=0;attempt<180;attempt++){
  let type=choose(types),p=pair(),q=pair(p.row),products=[p],numbers,ops,answerIndex=-1,reverse=false,variant=0,expression,coeff=1,offset=0,paren=false;
  const P=p.a*p.b;
  if(type==='A'){numbers=[p.a,p.b];ops=['mal'];answerIndex=p.row==='squares'?int(0,1):p.a===p.row?1:0;reverse=!!int(0,1);}
  else if(type==='B'||type==='C'){
   if(type==='C'&&P<q.a*q.b)[p,q]=[q,p];products=[p,q];numbers=[p.a,p.b,q.a,q.b];ops=['mal',type==='B'?'plus':'minus','mal'];
  }else if(type==='D'||type==='E'){
   const upper=type==='D'?Math.min(difficulty==='easy'?5:12,max-P):Math.min(difficulty==='easy'?5:12,P);if(upper<0)continue;
   const extra=int(upper?1:0,upper);numbers=[p.a,p.b,extra];ops=['mal',type==='D'?'plus':'minus'];
  }else{
   variant=forcedVariant==null?int(0,3):Number(forcedVariant);
   if(variant===0||variant===1){
    const upper=variant===0?Math.min(difficulty==='easy'?5:12,max-P):Math.min(difficulty==='easy'?5:12,P);if(upper<0)continue;
    const extra=int(upper?1:0,upper),row=p.row==='squares'?p.a:p.row,factor=p.a===row?p.b:p.a;numbers=variant===0?[factor,row,extra]:[row,factor,extra];ops=['mal',variant===0?'plus':'minus'];answerIndex=variant===0?0:1;
   }else if(variant===2){const row=q.row==='squares'?q.a:q.row,factor=q.a===row?q.b:q.a;q={a:factor,b:row,row:q.row};products=[p,q];numbers=[p.a,p.b,q.a,q.b];ops=['mal','plus','mal'];answerIndex=2;}
   else if(variant===3){
    const base=rawPair(),square=base.row==='squares',r=square?base.a:base.row,x=square?int(1,r):base.b;
    const room=Math.min(profile==='tens'?20:9,Math.floor(max/r)-x,factorLimit-x);
    const extra=square?r-x:profile==='tens'?10*int(0,Math.floor(room/10)):int(room?1:0,room);p={a:r,b:x+extra,row:base.row};products=[p];numbers=[r,x,extra];ops=['mal','plus'];answerIndex=1;paren=true;
   }else throw Error('Ungültige Aufgabenvariante.');
  }
  let solved;
  try{solved=paren?C.evaluate([numbers[0],numbers[1]+numbers[2]],['mal'],max):C.evaluate(numbers,ops,max);}catch(e){continue;}
  const rhs=solved.res,answer=answerIndex<0?rhs:numbers[answerIndex];
  const shown=numbers.map((n,i)=>i===answerIndex?'□':String(n));
  if(paren)expression=`${shown[0]} × (${shown[1]} + ${shown[2]}) = ${rhs}`;
  else{
   const left=shown.map((n,i)=>(i?({mal:'×',plus:'+',minus:'−'}[ops[i-1]])+' ':'')+n).join(' ');
   expression=answerIndex<0?left+' = □':reverse?rhs+' = '+left:left+' = '+rhs;
  }
  const solutionLines=[];
  if(answerIndex<0){
   for(const product of products)solutionLines.push(`${product.a} × ${product.b} = ${product.a*product.b}`);
   if(type==='B'||type==='C')solutionLines.push(`${p.a*p.b} ${type==='B'?'+':'−'} ${q.a*q.b} = ${rhs}`);
   else if(type==='D'||type==='E')solutionLines.push(`${P} ${type==='D'?'+':'−'} ${numbers[2]} = ${rhs}`);
  }else{
   if(type==='A'){coeff=numbers[1-answerIndex];offset=0;solutionLines.push(`${rhs} ÷ ${coeff} = ${answer}`);}
   else if(paren){coeff=numbers[0];offset=coeff*numbers[2];solutionLines.push(`${rhs} ÷ ${coeff} = ${numbers[1]+numbers[2]}`,`${numbers[1]+numbers[2]} − ${numbers[2]} = ${answer}`);}
   else if(variant===2){coeff=q.b;offset=P;solutionLines.push(`${p.a} × ${p.b} = ${P}`,`${rhs} − ${P} = ${rhs-P}`,`${rhs-P} ÷ ${coeff} = ${answer}`);}
   else{coeff=numbers[1-answerIndex];offset=ops[1]==='plus'?numbers[2]:-numbers[2];solutionLines.push(`${rhs} ${offset>=0?'−':'+'} ${Math.abs(offset)} = ${rhs-offset}`,`${rhs-offset} ÷ ${coeff} = ${answer}`);}
   solutionLines.push(expression.replace('□',String(answer)));
  }
  if(answerIndex<0)solutionLines.push(expression.replace('□',String(answer)));
  const task={op:'worksheet',type,variant,fmt:'standard',missing:2,a:numbers[0],b:numbers[1],sym:'×',numbers,ops,products,res:answer,rhs,answerIndex,coeff,offset,paren,expression,intermediates:solved.intermediates,steps:solved.steps,solutionLines,hints:answerIndex<0?['Berechne zuerst die einzelnen Malaufgaben. Punktrechnung kommt vor Strichrechnung.','Setze die Produkte ein und rechne danach Plus oder Minus.']:['Rechne zuerst die bekannten Teile der Gleichung aus.','Mache Plus oder Minus mit der Umkehraufgabe rückgängig.','Teile durch den bekannten Faktor. Prüfe deine Zahl durch Einsetzen.']};
  task.key='worksheet|'+type+'|'+expression;last=task;
  if(!recent.includes(task.key))return task;
 }
 if(last)return last;
 // Tight limits can make the requested compound type impossible. Keep selected
 // rows/profile and use a valid factor task; never silently exceed the range.
 if(!forcedType)return generate({...options,type:'A',recent:[]});
 throw Error('Dieser Aufgabentyp passt nicht zur gewählten Grenze.');
}
function accepts(task,answer){return /^\d+$/.test(String(answer))&&Number(answer)===task.res;}
const api={generate,rowsFor,accepts};root.MatheMixedMal=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
