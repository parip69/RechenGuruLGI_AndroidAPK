/* Realschule: pure, dependency-free generators and exact validators. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MatheRealschule=api;})(typeof window==='object'?window:globalThis,function(){
'use strict';
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b];}return a||1;};
function Q(n,d=1){if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||!d)throw Error('Zahl zu groß oder Division durch null.');const g=gcd(n,d),s=d<0?-1:1;return {n:n? n/g*s:0,d:Math.abs(d/g)};}
const add=(a,b)=>Q(a.n*b.d+b.n*a.d,a.d*b.d),neg=a=>Q(-a.n,a.d),mul=(a,b)=>Q(a.n*b.n,a.d*b.d),div=(a,b)=>Q(a.n*b.d,a.d*b.n),eq=(a,b)=>a.n===b.n&&a.d===b.d;
const zero=()=>Q(0),one=()=>Q(1),str=a=>a.d===1?String(a.n):`${a.n}/${a.d}`;
function decimal(s){const parts=s.replace(',','.').split('.');return Q(Number(parts.join('')),10**(parts[1]?.length||0));}
function trim(a){while(a.length>1&&!a[a.length-1].n)a.pop();return a;}
function plus(a,b){return trim(Array.from({length:Math.max(a.length,b.length)},(_,i)=>add(a[i]||zero(),b[i]||zero())));}
function times(a,b){const r=Array.from({length:a.length+b.length-1},zero);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)r[i+j]=add(r[i+j],mul(a[i],b[j]));trim(r);if(r.length>3)throw Error('Hier nur Terme bis x² eingeben.');return r;}
// Recursive descent. No executable input; bounded tokens, nesting and exact fractions.
function parse(input){
 if(typeof input!=='string'||!input.trim())throw Error('Bitte eine Rechnung eingeben.');if(input.length>180)throw Error('Die Eingabe ist zu lang.');
 const s=expandMixedNumbers(input).toLowerCase().replace(/\s/g,'').replace(/[·×]/g,'*').replace(/[÷:]/g,'/').replace(/−/g,'-').replace(/²/g,'^2');
 const tokens=s.match(/(?:\d+(?:[.,]\d+)?|x|[+\-*/^()])/g)||[];if(tokens.join('')!==s||tokens.length>100)throw Error('Erlaubt sind Zahlen, x, +, -, *, / und Klammern.');let i=0,depth=0;
 function atom(){if(++depth>20)throw Error('Zu viele Klammern.');let a;if(tokens[i]==='('){i++;a=sum();if(tokens[i++]!==')')throw Error('Eine schließende Klammer fehlt.');}else if(tokens[i]==='x'){i++;a=[zero(),one()];}else if(/^\d/.test(tokens[i]||'')){a=[decimal(tokens[i++])];}else throw Error('Hier fehlt eine Zahl oder x.');depth--;if(tokens[i]==='^'){i++;const exponent=tokens[i++];if(!/^[012]$/.test(exponent||''))throw Error('Nur die Hochzahlen 0, 1 und 2 sind hier möglich.');let r=[one()];for(let j=0;j<Number(exponent);j++)r=times(r,a);a=r;}return a;}
 function unary(){if(tokens[i]==='+'){i++;return unary();}if(tokens[i]==='-'){i++;return unary().map(neg);}return atom();}
 function product(){let a=unary();while(i<tokens.length){const t=tokens[i],implicit=t==='x'||t==='('||/^\d/.test(t);if(t!=='*'&&t!=='/'&&!implicit)break;if(!implicit)i++;const b=unary();if(t==='/'){if(b.length!==1)throw Error('Division durch einen Term mit x ist hier nicht unterstützt.');a=a.map(v=>div(v,b[0]));}else a=times(a,b);}return trim(a);}
 function sum(){let a=product();while(tokens[i]==='+'||tokens[i]==='-'){const t=tokens[i++],b=product();a=plus(a,t==='-'?b.map(neg):b);}return a;}
 const a=sum();if(i!==tokens.length)throw Error('Die Rechnung ist unvollständig.');return a;
}
// Mixed numbers keep their meaning before whitespace is removed: -2 1/3 = -(2+1/3).
function expandMixedNumbers(input){
 const expanded=input.replace(/(\d+)\s+(\d+)\s*\/\s*(\d+)/g,(_,whole,n,d)=>{
   if(!Number.isSafeInteger(Number(whole))||!Number.isSafeInteger(Number(n))||!Number.isSafeInteger(Number(d))||Number(d)<=0||Number(n)>=Number(d))throw Error('Bei einer gemischten Zahl muss der Bruchanteil kleiner als 1 und der Nenner positiv sein.');
   return `(${whole}+${n}/${d})`;
 });
 if(/\d\s+\d/.test(expanded))throw Error('Zwischen Zahlen fehlt ein Rechenzeichen. Gemischte Zahlen zum Beispiel als 2 1/3 eingeben.');
 return expanded;
}

// Exact affine expressions [constant, x, y]. Products of variable terms are rejected.
// This checks linear consequences reliably, without evaluating arbitrary user code.
function parseLinear2(input){
 if(typeof input!=='string'||!input.trim())throw Error('Bitte einen Term eingeben.');
 if(input.length>180)throw Error('Die Eingabe ist zu lang.');
 const clean=expandMixedNumbers(input).toLowerCase().replace(/\s/g,'').replace(/[·×]/g,'*').replace(/[÷:]/g,'/').replace(/−/g,'-').replace(/²/g,'^2');
 const tokens=clean.match(/(?:\d+(?:[.,]\d+)?|[xy]|[+\-*/^()])/g)||[];
 if(tokens.join('')!==clean||tokens.length>100)throw Error('Erlaubt sind Zahlen, x, y, Rechenzeichen und Klammern.');
 let i=0,depth=0;
 const scalar=q=>[q,zero(),zero()],variable=a=>a[1].n!==0||a[2].n!==0;
 const sumRows=(a,b)=>a.map((v,j)=>add(v,b[j]));
 function multiply(a,b){
   if(variable(a)&&variable(b))throw Error('Hier sind nur lineare Terme erlaubt: kein x*y oder x².');
   return variable(b)?b.map(v=>mul(v,a[0])):a.map(v=>mul(v,b[0]));
 }
 function atom(){
   if(++depth>20)throw Error('Zu viele Klammern.');
   let a;
   if(tokens[i]==='('){i++;a=sum();if(tokens[i++]!==')')throw Error('Eine schließende Klammer fehlt.');}
   else if(tokens[i]==='x'||tokens[i]==='y'){a=scalar(zero());a[tokens[i++]==='x'?1:2]=one();}
   else if(/^\d/.test(tokens[i]||''))a=scalar(decimal(tokens[i++]));
   else throw Error('Hier fehlt eine Zahl, x oder y.');
   depth--;
   if(tokens[i]==='^'){
     i++;const exponent=tokens[i++];
     if(!/^[012]$/.test(exponent||''))throw Error('Hier sind nur Hochzahlen 0, 1 und 2 möglich.');
     if(exponent==='0')a=scalar(one());else if(exponent==='2')a=multiply(a,a);
   }
   return a;
 }
 function unary(){if(tokens[i]==='+'){i++;return unary();}if(tokens[i]==='-'){i++;return unary().map(neg);}return atom();}
 function product(){
   let a=unary();
   while(i<tokens.length){
     const t=tokens[i],implicit=t==='x'||t==='y'||t==='('||/^\d/.test(t);
     if(t!=='*'&&t!=='/'&&!implicit)break;
     if(!implicit)i++;const b=unary();
     if(t==='/'){if(variable(b))throw Error('Variable Nenner sind bei diesen Gleichungssystemen nicht erlaubt.');a=a.map(v=>div(v,b[0]));}
     else a=multiply(a,b);
   }
   return a;
 }
 function sum(){let a=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=product();a=sumRows(a,op==='-'?b.map(neg):b);}return a;}
 const a=sum();if(i!==tokens.length)throw Error('Der Term ist unvollständig.');return a;
}
function linearEquation2(input){
 const parts=input.split('=');if(parts.length!==2)throw Error('Bitte eine Gleichung mit genau einem = eingeben.');
 const lhs=parseLinear2(parts[0]),rhs=parseLinear2(parts[1]);
 const row=[add(lhs[1],neg(rhs[1])),add(lhs[2],neg(rhs[2])),add(rhs[0],neg(lhs[0]))];
 if(!row[0].n&&!row[1].n)throw Error('Der Schritt muss mindestens eine Variable enthalten.');
 let assignment=null;
 for(const [side,other] of [[parts[0],rhs],[parts[1],lhs]]){
   if(/^[xy]$/i.test(side.trim())&&!other[1].n&&!other[2].n)assignment={variable:side.trim().toLowerCase(),value:other[0]};
 }
 return {row,signature:JSON.stringify(row),assignment,eliminated:!assignment&&(!row[0].n||!row[1].n)};
}
function solveSystem(equations){
 if(!Array.isArray(equations)||equations.length!==2)throw Error('Ein System benötigt zwei Gleichungen.');
 const [a,b]=equations.map(e=>linearEquation2(e).row),det=add(mul(a[0],b[1]),neg(mul(a[1],b[0])));
 if(!det.n)throw Error('Das System hat keine eindeutige Lösung.');
 return {x:div(add(mul(a[2],b[1]),neg(mul(a[1],b[2]))),det),y:div(add(mul(a[0],b[2]),neg(mul(a[2],b[0]))),det)};
}
function systemInput(input){
 const parts=input.split(';').map(p=>p.trim());
 if(parts.length>2||parts.some(p=>!p))throw Error('Nutze eine Gleichung oder x = …; y = … .');
 const parsed=parts.map(linearEquation2);
 if(parts.length===2&&(!parsed.every(p=>p.assignment)||parsed[0].assignment.variable===parsed[1].assignment.variable))throw Error('Eine gemeinsame Endantwort muss x und y enthalten, getrennt durch ; .');
 return parsed;
}
function validateSystem(task,text,history){
 const current=systemInput(text),past=history.flatMap(systemInput),solution=task.solution;
 for(const e of current){
   if(!eq(add(mul(e.row[0],solution.x),mul(e.row[1],solution.y)),e.row[2]))return {status:'wrong',message:'Dieser Schritt passt nicht zum ursprünglichen System. Prüfe Vorzeichen und die Rechnung auf beiden Seiten.'};
 }
 const evidence=past.some(p=>p.eliminated);
 if(current.some(p=>p.assignment)&&!evidence)return {status:'incomplete',message:'Die Werte stimmen. Zeige zuerst einen Eliminations- oder Einsetzungsschritt mit nur noch einer Variablen, zum Beispiel 2x = 10.'};
 const originals=task.originals.map(linearEquation2);
 if(current.every(c=>[...originals,...past].some(p=>p.signature===c.signature)))return {status:'invalid',message:'Diese Gleichung steht bereits da. Zeige einen neuen Rechenschritt.'};
 const found={};for(const p of [...past,...current])if(p.assignment)found[p.assignment.variable]=p.assignment.value;
 const complete=found.x&&found.y;
 return {status:complete?'correct':'step',message:complete?'Beide Variablen richtig bestimmt!':current.some(p=>p.assignment)?'Dieser Wert stimmt. Bestimme jetzt auch die andere Variable.':current.some(p=>p.eliminated)?'Richtig: Eine Variable ist eliminiert. Bestimme nun x und y.':'Diese Umformung ist richtig. Eliminiere eine Variable oder setze einen Term ein.'};
}
function constant(s){const p=parse(s);if(p.length!==1)throw Error('Die Antwort muss eine Zahl sein.');return p[0];}
function equation(s){const parts=s.split('=');if(parts.length!==2)throw Error('Bitte eine Gleichung mit genau einem = eingeben.');const a=parse(parts[0]),b=parse(parts[1]),p=plus(a,b.map(neg));if(p.length!==2||!p[1].n)throw Error('Erwartet wird eine lineare Gleichung mit genau einer Lösung.');return {a,b,root:div(neg(p[0]),p[1]),signature:JSON.stringify([a,b]),final:(parts[0].trim().toLowerCase()==='x'&&b.length===1)||(parts[1].trim().toLowerCase()==='x'&&a.length===1)};}
const frac=q=>q.d===1?str(q):`<span class="rs-fraction"><span>${q.n}</span><span>${q.d}</span></span>`;
const random=(lo,hi,rng)=>lo+Math.floor(rng()*(hi-lo+1));
const url=(g,w)=>`https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/${g}/mathematik${g>6?'/'+(w==='I'?'wpfg1':'wpfg2-3'):''}`;
const entry=(id,label,area)=>({id,label,area});
// Only active, implemented exercises appear. Each row cites its official learning area.
// Local SVG: fixed coordinate system, no external resources or executable input.
function lineGraph(slope,intercept){
 const px=x=>150+x*20,py=y=>150-y*20;let grid='';
 for(let i=-6;i<=6;i++){grid+=`<path d="M${px(i)} 30V270 M30 ${py(i)}H270" stroke="#b8c7d5" stroke-width="0.6"/>`;if(i)grid+=`<text x="${px(i)}" y="165" text-anchor="middle">${i}</text><text x="137" y="${py(i)+4}" text-anchor="end">${i}</text>`;}
 const points=[];for(let x=-6;x<=6;x+=0.05){const y=slope.n/slope.d*x+intercept;if(y>=-6&&y<=6)points.push(`${px(x).toFixed(2)},${py(y).toFixed(2)}`);}
 return `<svg class="rs-graph" viewBox="0 0 300 300" role="img" aria-label="Gerade in einem Koordinatensystem von minus sechs bis sechs. Ein Kästchen entspricht einer Einheit." style="display:block;width:100%;max-width:340px;margin:12px auto;background:#f7fbff;color:#152b3b;border-radius:12px;font:11px sans-serif"><title>Gerade im Koordinatensystem</title>${grid}<path d="M30 150H275 M150 275V25" stroke="#152b3b" stroke-width="1.8"/><text x="282" y="146">x</text><text x="157" y="22">y</text><polyline points="${points.join(' ')}" fill="none" stroke="#176ab0" stroke-width="3"/></svg>`;
}
const catalog={
 5:{all:[entry('integers','Ganze Zahlen · Rechenregeln','M5 1/2'),entry('rectangle','Rechteck · Umfang und Fläche','M5 5'),entry('ratio','Größen · direkter Dreisatz','M5 4')]},
 6:{all:[entry('fractions','Brüche · Multiplikation mit Rechenweg','M6 1'),entry('fractionAdd','Brüche · Addition mit Rechenweg','M6 1'),entry('fractionSubtract','Brüche · Subtraktion mit Rechenweg','M6 1'),entry('fractionDivide','Brüche · Division mit Rechenweg','M6 1'),entry('mixedFractions','Gemischte Zahlen · Rechenweg','M6 1'),entry('fractionChain','Brüche · Klammern und Rechenketten','M6 1'),entry('decimals','Rationale Zahlen · Dezimalzahlen','M6 1'),entry('equations','Lineare Gleichungen · Rechenweg','M6 5'),entry('percent','Prozentwert','M6 6'),entry('triangle','Dreieck · Flächeninhalt','M6 3'),entry('cuboid','Quader · Volumen','M6 4')]},
 7:{all:[entry('powers','Potenzen · Rechenregeln','M7 1'),entry('termValue','Klammerterme · Werte berechnen','M7 I 6 / II–III 4'),entry('equations','Gleichungen mit Klammern · Rechenweg','M7 I 6 / II–III 4'),entry('percent','Vermehrter und verminderter Grundwert','M7 I 7 / II–III 5'),entry('mean','Daten · arithmetisches Mittel','M7 I 8 / II–III 6')]},
 8:{all:[entry('equations','Gleichungen mit x auf beiden Seiten','M8 I 4 / II–III 3'),entry('linear','Lineare Funktionen · Funktionswert','M8 I 6 / II–III 5'),entry('linearGraph','Geraden · Graphen ablesen','M8 I 6 / II–III 5'),entry('linearZero','Lineare Funktionen · Nullstellen','M8 I 6 / II–III 5'),entry('frequency','Zufall · relative Häufigkeit','M8 I 7 / II–III 6'),entry('trapezoid','Trapez · Flächeninhalt','M8 1')]},
 9:{all:[entry('roots','Quadratwurzeln','M9 1'),entry('pythagoras','Satz des Pythagoras','M9 3'),entry('circle','Kreis · Flächeninhalt','M9 4'),entry('probability','Zufall · Gegenereignis','M9 I 8 / II–III 7'),entry('systems','Lineare Gleichungssysteme · Rechenweg','M9 I 6 / II–III 6')],I:[entry('quadratic','Quadratische Funktion · Scheitelwert','M9 I 7'),entry('quadraticZero','Quadratische Funktionen · Nullstellen','M9 I 7')],'II/III':[entry('linear','Lineare Funktion · Funktionswert','M9 II–III 5')]},
 10:{all:[entry('trig','Trigonometrie · Kosinussatz','M10 1'),entry('growth','Exponentielles Wachstum','M10 I 4 / II–III 3'),entry('compound','Zufall · Pfadregel','M10 I 5 / II–III 5')],I:[entry('powerFunction','Potenzfunktion · Funktionswert','M10 I 3')],'II/III':[entry('quadratic','Quadratische Funktion · Scheitelwert','M10 II–III 4'),entry('quadraticZero','Quadratische Funktionen · Nullstellen','M10 II–III 4'),entry('cylinder','Zylinder · Volumen','M10 II–III 2')]}
};
const extraTopics={
5:{all:[entry('units','Längen · Einheiten umrechnen','M5 4'),entry('divisionRemainder','Division · Rest bestimmen','M5 1')]},
6:{all:[entry('percentBase','Prozentrechnung · Grundwert','M6 6'),entry('percentRate','Prozentrechnung · Prozentsatz','M6 6'),entry('fractionPercent','Brüche · Prozentdarstellung','M6 1')]},
7:{all:[entry('angles','Winkel · Dreieck und Viereck','M7 I 3 / II–III 3'),entry('inverseRatio','Indirekter Dreisatz · Sachaufgaben','M7 I 7 / II–III 5'),entry('interest','Zinsrechnung · Jahreszinsen','M7 I 7 / II–III 5'),entry('median','Daten · Zentralwert','M7 I 8 / II–III 6'),entry('mode','Daten · Modalwert','M7 I 8 / II–III 6'),entry('wordEquation','Sachaufgaben · Gleichungen','M7 I 6 / II–III 4')]},
8:{all:[entry('rationalEquation','Bruchgleichungen · Definitionsmenge und Rechenweg','M8 I 5 / II–III 4'),entry('linearSlope','Geraden · Steigung aus zwei Punkten','M8 I 6 / II–III 5'),entry('lineIntersection','Geraden · Schnittpunkt-x','M8 I 6 / II–III 5'),entry('prism','Prisma · Volumen','M8 I 3 / II–III 2')]},
9:{all:[entry('similarity','Ähnlichkeit · Seitenlängen','M9 2'),entry('circleCircumference','Kreis · Umfang','M9 4'),entry('pythagoreanLeg','Pythagoras · Fehlende Kathete','M9 3'),entry('trigRight','Rechtwinklige Dreiecke · Sinus','M9 3'),entry('noReplacement','Wahrscheinlichkeit · Ohne Zurücklegen','M9 I 8 / II–III 7')],I:[entry('quadraticEquation','Quadratische Gleichungen · Beide Lösungen','M9 I 7'),entry('quadraticCount','Quadratische Gleichungen · Anzahl Lösungen','M9 I 7'),entry('pyramid','Pyramide · Volumen','M9 I 5'),entry('cone','Kegel · Volumen','M9 I 5'),entry('sphere','Kugel · Volumen','M9 I 5')]},
10:{all:[entry('logarithm','Exponentialgleichungen · Logarithmen','M10 I 4 / II–III 3'),entry('decay','Exponentielle Abnahme · Sachaufgaben','M10 I 4 / II–III 3')],'II/III':[entry('quadraticEquation','Quadratische Gleichungen · Beide Lösungen','M10 II–III 4'),entry('quadraticCount','Quadratische Gleichungen · Anzahl Lösungen','M10 II–III 4'),entry('pyramid','Pyramide · Volumen','M10 II–III 2'),entry('cone','Kegel · Volumen','M10 II–III 2'),entry('sphere','Kugel · Volumen','M10 II–III 2')]}
};
for(const [grade,groups] of Object.entries(extraTopics))for(const [group,rows] of Object.entries(groups)){catalog[grade][group]??=[];catalog[grade][group].push(...rows);}
function topics(grade,group='I'){const c=catalog[grade];return c?[...c.all,...(c[group]||[])].map(t=>({...t,grade:Number(grade),source:url(grade,group)})):[];}
function generate(id,grade,difficulty='medium',rng=Math.random){
 if(!Object.values(catalog).some(c=>Object.values(c).flat().some(t=>t.id===id)))throw Error('Unbekanntes Thema.');
 const level=difficulty==='mixed'?random(1,3,rng):({easy:1,medium:2,hard:3}[difficulty]||2),ri=(a,b)=>random(a,b,rng),n=ri(2,level*5+4),m=ri(2,level*4+3),k=ri(1,8),g=Number(grade);
 const base={id,grade:g,difficulty,level,type:'short',unit:'',tolerance:0,hints:[],steps:[]};
 const task=(prompt,answer,extras={})=>({...base,prompt,answer:typeof answer==='number'?Q(answer):answer,...extras});
 switch(id){
 case 'units':{const cm=level===1?n*100:level===2?n*10:n;return task(`${cm} cm sind wie viele Meter? Gib nur die Zahl ein.`,Q(cm,100),{steps:[`${cm}/100`,str(Q(cm,100))],hints:['Ein Meter entspricht 100 Zentimetern. Teile durch 100.']});}
 case 'divisionRemainder':{const divisor=m+1,rest=ri(0,m),value=n*divisor+rest;return task(`Bestimme den Rest bei ${value} : ${divisor}.`,rest,{facts:{value,divisor},steps:[`${value} - ${n}*${divisor}`,String(rest)],hints:['Finde das größte Vielfache des Divisors, das nicht größer als die Zahl ist.']});}
 case 'percentBase':{const pct=5*m,base=20*n,value=base*pct/100;return task(`${pct} % eines Betrags sind ${value} €. Wie groß ist der Grundwert?`,base,{unit:'€',facts:{pct,value},steps:[`${value}*100/${pct}`,String(base)],hints:['Grundwert = Prozentwert · 100 / Prozentsatz.']});}
 case 'percentRate':{const base=20*n,pct=5*m,value=base*pct/100;return task(`Von ${base} € werden ${value} € gespart. Wie viel Prozent sind das? Gib nur die Zahl ein.`,pct,{facts:{base,value},steps:[`${value}/${base}*100`,String(pct)],hints:['Prozentsatz = Prozentwert / Grundwert · 100.']});}
 case 'fractionPercent':{const a=Q(n,m+1),answer=mul(a,Q(100));return task(`Schreibe ${frac(a)} als Prozentzahl. Gib nur die Zahl ein.`,answer,{facts:{fraction:a},steps:[`${str(a)}*100`,str(answer)],hints:['Multipliziere den Bruch mit 100. Mehr als 100 % ist möglich.']});}
 case 'angles':{const a=ri(20,75),b=ri(20,75),c=ri(50,100),quad=level===3;return task(`Ein ${quad?'Viereck':'Dreieck'} hat Winkel ${a}° und ${b}°${quad?' und '+c+'°':''}. Bestimme den fehlenden Winkel in Grad (nur die Zahl).`,(quad?360:180)-a-b-(quad?c:0),{steps:[`${quad?360:180}-${a}-${b}${quad?'-'+c:''}`,String((quad?360:180)-a-b-(quad?c:0))],hints:[quad?'Die Innenwinkelsumme im Viereck beträgt 360°.':'Die Innenwinkelsumme im Dreieck beträgt 180°.']});}
 case 'inverseRatio':{const workers=m,newWorkers=n,hours=k*n;return task(`${workers} gleich schnell arbeitende Personen brauchen ${hours} Stunden. Wie viele Stunden brauchen ${newWorkers} Personen für dieselbe Arbeit? Gib nur die Zahl ein.`,m*k,{facts:{workers,newWorkers,hours},steps:[`${workers}*${hours}/${newWorkers}`,String(m*k)],hints:['Bei gleicher Arbeit bleibt Personenanzahl · Zeit konstant.']});}
 case 'interest':{const capital=100*n,pct=level*k;return task(`${capital} € werden ein Jahr zu ${pct} % verzinst. Wie hoch sind die Jahreszinsen?`,n*pct,{unit:'€',steps:[`${capital}*${pct}/100`,String(n*pct)],hints:['Jahreszinsen = Kapital · Zinssatz / 100.']});}
 case 'median':{const values=Array.from({length:level===1?5:6},()=>ri(-n,n)),sorted=[...values].sort((a,b)=>a-b),len=sorted.length,answer=len%2?Q(sorted[(len-1)/2]):Q(sorted[len/2-1]+sorted[len/2],2);return task(`Bestimme den Zentralwert (Median): ${values.join('; ')}.`,answer,{facts:{values},steps:['Sortiert: '+sorted.join('; '),str(answer)],hints:['Sortiere die Zahlen. Bei gerader Anzahl bilde den Mittelwert der beiden mittleren Zahlen.']});}
 case 'mode':{const repeated=n,values=[n,m+n+1,n,k+n+m+2,n];return task(`Bestimme den Modalwert: ${values.join('; ')}.`,repeated,{facts:{values},steps:[`${n} kommt dreimal vor.`,String(n)],hints:['Der Modalwert ist die Zahl, die am häufigsten vorkommt.']});}
 case 'wordEquation':{const x=Q(level===3?-k:k),right=n*x.n+m,original=`${n}x + ${m} = ${right}`;return task(`Das ${n}-Fache einer Zahl, vermehrt um ${m}, ist ${right}. Löse mit einem Umformungsschritt: <span class="rs-equation">${original}</span>`,x,{type:'equationSteps',original,steps:[`${n}x = ${n*x.n}`,`x = ${x.n}`],hints:['Ziehe die zusätzliche Zahl auf beiden Seiten ab.','Teile anschließend beide Seiten durch den Faktor.']});}
 case 'rationalEquation':{const excluded=ri(-5,5),solution=excluded+(level===3?-k:k),factor=m,numerator=factor*(solution-excluded),cleared=`${numerator} = ${factor}(x - (${excluded}))`;return task(`Löse die Bruchgleichung <span class="rs-fraction"><span>${numerator}</span><span>x − (${excluded})</span></span> = ${factor}. Gib zuerst die Definitionsmenge als D: x != ${excluded} ein, dann einen Schritt ohne Nenner und zuletzt x = … .`,Q(solution),{type:'rationalSteps',excluded:Q(excluded),numerator:Q(numerator),factor:Q(factor),cleared,steps:[`D: x != ${excluded}`,cleared,`x = ${solution}`],hints:['Ein Nenner darf nicht null werden. Welcher x-Wert ist deshalb ausgeschlossen?','Multipliziere beide Seiten mit dem Nenner. Das ist nur für zulässige x-Werte erlaubt.','Löse die entstandene lineare Gleichung.']});}
 case 'linearSlope':{const x1=-k,x2=x1+n,y1=m,y2=y1+(level===3?-1:1)*k*m;return task(`Eine Gerade geht durch A(${x1} | ${y1}) und B(${x2} | ${y2}). Bestimme die Steigung.`,Q(y2-y1,x2-x1),{facts:{x1,x2,y1,y2},steps:[`(${y2}-${y1})/(${x2}-${x1})`,str(Q(y2-y1,x2-x1))],hints:['Steigung = (y₂ − y₁) / (x₂ − x₁).']});}
 case 'lineIntersection':{const x=level===3?-k:k,a=n,c=n+m,b=m,d=(a-c)*x+b;return task(`f(x) = ${a}x + ${b}, g(x) = ${c}x + (${d}). Bestimme den x-Wert des Schnittpunkts.`,x,{facts:{a,b,c,d},steps:[`${a}x + ${b} = ${c}x + (${d})`,`${a-c}x = ${d-b}`,`x = ${x}`],hints:['Am Schnittpunkt sind die Funktionswerte gleich. Setze f(x) = g(x).']});}
 case 'prism':return task(`Ein gerades Prisma hat eine dreieckige Grundfläche mit Grundseite ${n} cm und zugehöriger Höhe ${m} cm. Die Körperhöhe beträgt ${k} cm. Berechne das Volumen.`,Q(n*m*k,2),{unit:'cm³',steps:[`${n}*${m}/2`,`${n*m}/2*${k}`,str(Q(n*m*k,2))],hints:['Berechne erst die Dreiecksfläche. Volumen = Grundfläche · Körperhöhe.']});
 case 'similarity':return task(`Zwei ähnliche Dreiecke haben den Streckungsfaktor ${k}. Eine Seite des kleinen Dreiecks ist ${n} cm lang. Wie lang ist die entsprechende Seite des großen Dreiecks?`,n*k,{unit:'cm',steps:[`${n}*${k}`,String(n*k)],hints:['Entsprechende Längen werden mit dem Streckungsfaktor multipliziert.']});
 case 'circleCircumference':return task(`Ein Kreis hat Radius ${n} cm. Bestimme den Umfang mit π = 3,14.`,Q(628*n,100),{unit:'cm',steps:[`2*3,14*${n}`,str(Q(628*n,100))],hints:['Umfang = 2 · π · r.']});
 case 'pythagoreanLeg':return task(`Ein rechtwinkliges Dreieck hat Hypotenuse ${5*k} cm und eine Kathete ${3*k} cm. Bestimme die andere Kathete.`,4*k,{unit:'cm',steps:[`${5*k}^2-${3*k}^2`,String(16*k*k),`Quadratwurzel: ${4*k}`],hints:['a² = c² − b². Ziehe danach die positive Quadratwurzel.']});
 case 'trigRight':{const angle=[30,45,60][level-1],hyp=n*2,answer=decimal((hyp*Math.sin(angle*Math.PI/180)).toFixed(2));return task(`Ein rechtwinkliges Dreieck hat Hypotenuse ${hyp} cm. Der Winkel gegenüber der gesuchten Kathete ist ${angle}°. Berechne die Kathete, auf zwei Nachkommastellen.`,answer,{unit:'cm',tolerance:0.005000001,facts:{hyp,angle},steps:[`${hyp} · sin(${angle}°)`,str(answer)],hints:['sin(α) = Gegenkathete / Hypotenuse.']});}
 case 'noReplacement':{const total=n+m,answer=Q(n*(n-1),total*(total-1));return task(`Eine Urne enthält ${n} rote und ${m} blaue Kugeln. Zwei Kugeln werden ohne Zurücklegen gezogen. Bestimme die Wahrscheinlichkeit für zweimal rot als Bruch.`,answer,{facts:{red:n,blue:m},steps:[`(${n}/${total})*((${n}-1)/(${total}-1))`,str(answer)],hints:['Nach einer roten Kugel gibt es eine rote Kugel und insgesamt eine Kugel weniger. Multipliziere die Pfadwahrscheinlichkeiten.']});}
 case 'pyramid':return task(`Eine Pyramide hat quadratische Grundfläche mit Seitenlänge ${n} cm und Körperhöhe ${m} cm. Berechne das Volumen.`,Q(n*n*m,3),{unit:'cm³',steps:[`${n}^2*${m}/3`,str(Q(n*n*m,3))],hints:['Volumen = Grundfläche · Körperhöhe / 3.']});
 case 'cone':return task(`Ein gerader Kreiskegel hat Radius ${k} cm und Höhe ${n} cm. Berechne sein Volumen mit π = 3,14 als genaue Zahl oder Bruch.`,Q(314*k*k*n,300),{unit:'cm³',steps:[`3,14*${k}^2*${n}/3`,str(Q(314*k*k*n,300))],hints:['Volumen = π · r² · Höhe / 3.']});
 case 'sphere':return task(`Eine Kugel hat Radius ${k} cm. Berechne ihr Volumen mit π = 3,14 als genaue Zahl oder Bruch.`,Q(4*314*k*k*k,300),{unit:'cm³',steps:[`4/3*3,14*${k}*${k}*${k}`,str(Q(4*314*k*k*k,300))],hints:['Volumen = 4/3 · π · r³.']});
 case 'logarithm':{const base=ri(2,5),exponent=ri(1,level+3),value=base**exponent;return task(`Löse ${base} hoch x = ${value}. Gib den x-Wert ein.`,exponent,{facts:{base,value},steps:[`x = log(${value}) / log(${base})`,`x = ${exponent}`],hints:['Logarithmiere beide Seiten. x = log(Zielwert) / log(Basis).']});}
 case 'decay':{const start=100*n,pct=5*level,years=level+1,answer=decimal((start*(1-pct/100)**years).toFixed(2));return task(`Ein Bestand von ${start} sinkt jährlich um ${pct} %. Wie groß ist er nach ${years} Jahren? Runde auf zwei Nachkommastellen.`,answer,{facts:{start,pct,years},tolerance:0.005000001,steps:[`${start} · (1 - ${pct}/100) hoch ${years}`,str(answer)],hints:['Bei Abnahme ist der jährliche Faktor 1 − p/100.']});}
 case 'quadraticCount':{const count=ri(0,2),h=ri(-5,5),c=count===0?m:count===1?0:-m;return task(`Wie viele verschiedene reelle Lösungen hat (x − (${h}))² + (${c}) = 0? Gib 0, 1 oder 2 ein.`,count,{facts:{c,h},steps:[`(x − (${h}))² = ${-c}`,`${count} reelle Lösung${count===1?'':'en'}`],hints:['Ein Quadrat ist nicht negativ. Ein positiver rechter Wert liefert zwei Lösungen, null eine, ein negativer keine.']});}
 case 'quadraticEquation':{const left=ri(-7,1),right=left+ri(1,7),a=level===3?-m:level===2?m:1,b=-a*(left+right),c=a*left*right,original=`${a}x^2 + (${b})x + (${c}) = 0`,normalized=`x^2 + (${-(left+right)})x + (${left*right}) = 0`;return task(`Löse die quadratische Gleichung mit einem Umformungsschritt und beiden Lösungen: <span class="rs-equation">${original.replace(/\^2/g,'²')}</span> Endwerte als x = …; x = … eingeben.`,Q(right),{type:'quadraticSteps',roots:[Q(left),Q(right)],coefficients:[Q(c),Q(b),Q(a)],original,steps:[level===1?`(x - (${left}))(x - (${right})) = 0`:normalized,`x = ${left}; x = ${right}`],hints:['Bringe die Gleichung auf die Form ax² + bx + c = 0. Teile bei Bedarf durch a.','Faktorisiere oder nutze die Lösungsformel. Bestimme beide Lösungen.']});}
 case 'integers':{const a=level>1?-n:n,b=level>1?-m:m;return task(`Berechne: ${a} + (${b}) · ${k}`,a+b*k,{hints:['Punktrechnung geht vor Strichrechnung.']});}
 case 'rectangle':return task(`Ein Rechteck ist ${n} cm lang und ${m} cm breit. ${level===1?'Bestimme den Umfang.':'Bestimme die Fläche.'}`,level===1?2*(n+m):n*m,{unit:level===1?'cm':'cm²',hints:[level===1?'Addiere alle vier Seiten.':'Multipliziere Länge und Breite.']});
 case 'ratio':return task(`${k} Hefte kosten ${k*m} €. Wie viel kosten ${n} Hefte?`,n*m,{unit:'€',hints:['Berechne zuerst den Preis für ein Heft.']});
 case 'fractions':{const a=Q(level===3?-n:n,n+1),b=Q((n+1)*k,n+2),result=mul(a,b);return task(`Berechne mit einem Zwischenschritt und kürze vollständig: ${frac(a)} · ${frac(b)}`,result,{type:'fractionSteps',original:`${str(a)}*${str(b)}`,steps:[`${a.n*b.n}/${a.d*b.d}`,str(result)],hints:['Du darfst vor dem Multiplizieren kürzen.','Multipliziere die Zähler und die Nenner. Danach vollständig kürzen.']});}
 case 'fractionAdd':
 case 'fractionSubtract':{
   const a=Q(level===3?-n:n,m+2),b=Q(k,level===1?m+2:n+3),subtract=id==='fractionSubtract',sign=subtract?'−':'+',op=subtract?'-':'+',common=a.d*b.d;
   const answer=add(a,subtract?neg(b):b),intermediate=`(${a.n*b.d} ${op} ${b.n*a.d})/${common}`;
   return task(`Berechne mit einem Zwischenschritt und kürze vollständig: ${frac(a)} ${sign} ${frac(b)}`,answer,{type:'fractionSteps',original:`${str(a)}${op}${str(b)}`,steps:[intermediate,str(answer)],hints:['Bringe beide Brüche auf einen gemeinsamen Nenner.','Erweitere die Zähler passend. Addiere oder subtrahiere dann die Zähler; der Nenner bleibt gleich.']});
 }
 case 'fractionDivide':{
   const a=Q(level===3?-n:n,m+2),b=Q(k,n+3),answer=div(a,b);
   return task(`Dividiere mit einem Zwischenschritt und kürze vollständig: ${frac(a)} : ${frac(b)}`,answer,{type:'fractionSteps',original:`(${str(a)})/(${str(b)})`,steps:[`(${str(a)}) * (${b.d}/${b.n})`,str(answer)],hints:['Multipliziere mit dem Kehrwert des zweiten Bruchs.','Vertausche beim zweiten Bruch Zähler und Nenner. Kürze danach das Produkt.']});
 }
 case 'mixedFractions':{
   const denominator=m+2,whole=level===3?-k:k,numerator=ri(1,denominator-1),a=Q((Math.abs(whole)*denominator+numerator)*(whole<0?-1:1),denominator),b=Q(1,n+3),subtract=level>1,op=subtract?'-':'+';
   const mixed=`${whole} ${numerator}/${denominator}`,answer=add(a,subtract?neg(b):b);
   return task(`Rechne mit Zwischenschritt. Schreibe das Ergebnis als vollständig gekürzten Bruch (bei ganzen Zahlen genügt die Zahl): <span class="rs-mixed">${whole} ${frac(Q(numerator,denominator))}</span> ${subtract?'−':'+'} ${frac(b)}`,answer,{type:'fractionSteps',original:`${mixed} ${op} ${str(b)}`,steps:[`(${str(a)}) ${op} (${str(b)})`,str(answer)],hints:['Wandle zuerst die gemischte Zahl in einen Bruch um: Ganze · Nenner + Zähler.','Bei einer negativen gemischten Zahl gehört das Minus zur gesamten Zahl. Nutze danach einen gemeinsamen Nenner.']});
 }
 case 'fractionChain':{
   const a=Q(n,m+2),b=Q(k,n+3),c=Q(level===3?-m:m,k+2),subtract=level>1,inner=add(a,subtract?neg(b):b),divide=level===2,extra=level===3?Q(k,5):Q(0);
   const answer=add(divide?div(inner,c):mul(inner,c),extra),operation=divide?'/':'*',suffix=level===3?` + (${str(extra)})`:'';
   return task(`Berechne mit Rechenweg und kürze vollständig: (${frac(a)} ${subtract?'−':'+'} ${frac(b)}) ${divide?':':'·'} (${frac(c)})${level===3?' + '+frac(extra):''}`,answer,{type:'fractionSteps',original:`(${str(a)} ${subtract?'-':'+'} ${str(b)}) ${operation} (${str(c)})${suffix}`,steps:[`(${str(inner)}) ${operation} (${str(c)})${suffix}`,str(answer)],hints:['Berechne zuerst die Klammer mit einem gemeinsamen Nenner.','Danach folgt Multiplikation oder Division. Bei Division verwende den Kehrwert.','Kürze das Ergebnis vollständig. Bei der schweren Aufgabe addiere zuletzt den übrigen Bruch.']});
 }
 case 'termValue':{
   const x=level===3?-k:k,a=n,b=m,c=ri(2,8),d=ri(1,6),expression=level===1?`${a}(x + ${b})`:`${a}(x + ${b}) − ${c}(x − ${d})${level===3?` − ${n}x`:''}`;
   const answer=a*(x+b)-(level>1?c*(x-d):0)-(level===3?n*x:0);
   return task(`Berechne den Wert des Terms für x = ${x}: <span class="rs-equation">${expression}</span>`,answer,{hints:['Setze den angegebenen Wert überall für x ein.','Berechne zuerst die Klammern, dann die Produkte und zuletzt Plus und Minus.']});
 }
 case 'systems':{
   const x=Q(level===3?-k:k,level===3?2:1),y=Q(level>1?-ri(1,8):ri(1,8),level===3?3:1),a=n,b=level===1?1:m,c=level===1?1:k+1,d=-ri(2,level*4+3);
   const right1=add(mul(Q(a),x),mul(Q(b),y)),right2=add(mul(Q(c),x),mul(Q(d),y)),det=a*d-b*c;
   const originals=[`${a}x + ${b}y = ${str(right1)}`,`${c}x − ${-d}y = ${str(right2)}`];
   return task(`Löse das Gleichungssystem mit Eliminations- oder Einsetzungsschritt und bestimme beide Variablen:<span class="rs-system"><span>I: ${originals[0]}</span><span>II: ${originals[1]}</span></span>`,x,{type:'systemSteps',solution:{x,y},originals,steps:[`${det}x = ${str(mul(Q(det),x))}`,`x = ${str(x)}`,`y = ${str(y)}`],hints:['Eliminiere eine Variable durch Addieren/Subtrahieren der passend multiplizierten Gleichungen oder setze einen freigestellten Term ein.',`Zum Eliminieren von y kannst du ${d} · I − ${b} · II bilden.`,`Bestimme aus der Gleichung mit nur noch x den x-Wert. Setze ihn danach in eine ursprüngliche Gleichung ein, um y zu bestimmen.`]});
 }
 case 'decimals':return task(`Berechne: ${(n/10).toFixed(1).replace('.',',')} ${level===3?'−':'+'} ${(m/10).toFixed(1).replace('.',',')}`,Q(n+(level===3?-m:m),10),{hints:['Achte auf gleiche Stellenwerte.']});
 case 'equations':{const x=Q(level===3?-k:k),a=n,b=m,c=g>=8?ri(1,n-1):0;let original,intermediate,final=`x = ${str(x)}`;
 if(g>=8){original=`${a}x + ${b} = ${c}x + ${str(add(mul(Q(a-c),x),Q(b)))}`;intermediate=`${a-c}x + ${b} = ${str(add(mul(Q(a-c),x),Q(b)))}`;}
 else if(g>=7||level===3){original=`${a}(x + ${b}) = ${str(mul(Q(a),add(x,Q(b))))}`;intermediate=`x + ${b} = ${str(add(x,Q(b)))}`;}
 else{original=`${a}x + ${b} = ${str(add(mul(Q(a),x),Q(b)))}`;intermediate=`${a}x = ${str(mul(Q(a),x))}`;}
 original=original.replace(/\+ -/g,"− ");intermediate=intermediate.replace(/\+ -/g,"− ");
 return task(`Löse mit mindestens einem Umformungsschritt: <span class="rs-equation">${original}</span>`,x,{type:'equationSteps',original,steps:[intermediate,final],hints:['Wende auf beiden Seiten dieselbe Rechenoperation an.','Fasse die x-Terme zusammen und entferne die Zahl neben dem x-Term.']});}
 case 'percent':{const amount=20*n,pct=5*m;if(g>=7){const decrease=level===3;return task(`Ein Preis von ${amount} € wird um ${pct} % ${decrease?'gesenkt':'erhöht'}. Wie hoch ist der neue Preis?`,Q(amount*(100+(decrease?-pct:pct)),100),{unit:'€',hints:['Berechne erst die Preisänderung und addiere oder subtrahiere sie.']});}return task(`Wie viel sind ${pct} % von ${amount} €?`,Q(amount*pct,100),{unit:'€',hints:['Prozentwert = Grundwert · Prozentsatz / 100.']});}
 case 'triangle':return task(`Ein Dreieck hat Grundseite ${n} cm und zugehörige Höhe ${m} cm. Bestimme die Fläche.`,Q(n*m,2),{unit:'cm²',hints:['Fläche = Grundseite · zugehörige Höhe / 2.']});
 case 'cuboid':return task(`Ein Quader hat Kanten ${n} cm, ${m} cm und ${k} cm. Bestimme sein Volumen.`,n*m*k,{unit:'cm³',hints:['Volumen = Länge · Breite · Höhe.']});
 case 'powers':return task(`Berechne mithilfe der Potenzregel: 2<sup>${k}</sup> · 2<sup>${level}</sup>`,2**(k+level),{hints:['Bei gleicher Basis werden beim Multiplizieren die Exponenten addiert.']});
 case 'mean':{const values=[n,m,k,level*2];return task(`Bestimme das arithmetische Mittel von ${values.join('; ')}.`,Q(values.reduce((a,b)=>a+b,0),4),{hints:['Addiere die Werte und teile durch die Anzahl der Werte.']});}
 case 'linearGraph':{
   const slope=Q((ri(0,1)?1:-1)*ri(1,3),level===3?2:1),intercept=ri(-3,3),x=ri(-1,1),reading=level===1?'intercept':level===2?'value':'slope';
   const answer=reading==='intercept'?Q(intercept):reading==='value'?add(mul(slope,Q(x)),Q(intercept)):slope;
   const question=reading==='intercept'?'Lies den y-Achsenabschnitt ab.':reading==='value'?`Lies den Funktionswert f(${x}) ab.`:'Bestimme die Steigung der Geraden. Gib bei Bedarf einen Bruch ein.';
   return task(question+lineGraph(slope,intercept),answer,{graph:{slope,intercept,x,reading},hints:[reading==='slope'?'Steigung = Änderung in y / Änderung in x. Wähle zwei Gitterpunkte auf der Geraden.':reading==='intercept'?'Wo schneidet die Gerade die y-Achse?':`Gehe auf der x-Achse zu ${x} und lies an der Geraden den y-Wert ab.`]});
 }
 case 'linearZero':{
   const slope=level===3?-m:m,root=Q(level===1?n:ri(-9,9),level===3?2:1),intercept=neg(mul(Q(slope),root));
   return task(`f(x) = ${slope}x ${intercept.n<0?'−':'+'} ${str(Q(Math.abs(intercept.n),intercept.d))}. Bestimme die Nullstelle (nur den x-Wert).`,root,{coefficients:[intercept,Q(slope)],hints:['An einer Nullstelle ist f(x) = 0.','Bringe den konstanten Term auf die andere Seite und teile durch die Steigung.']});
 }
 case 'quadraticZero':{
   const left=ri(-6,1),right=left+ri(1,7),a=level===3?-ri(1,3):1,b=-a*(left+right),c=a*left*right;
   const expression=level===1?`(x − (${left}))(x − (${right}))`:`${a}x² ${b<0?'−':'+'} ${Math.abs(b)}x ${c<0?'−':'+'} ${Math.abs(c)}`;
   return task(`f(x) = ${expression}. Die Funktion hat zwei verschiedene Nullstellen. Bestimme die größere Nullstelle (nur den x-Wert).`,right,{coefficients:[Q(c),Q(b),Q(a)],roots:[Q(left),Q(right)],hints:['Setze f(x) = 0. Suche zwei Lösungen und wähle den größeren x-Wert.',level===1?'Ein Produkt ist null, wenn mindestens ein Faktor null ist.':'Teile durch den Koeffizienten von x². Nutze anschließend Faktorisieren oder die Lösungsformel.']});
 }
 case 'linear':return task(`f(x) = ${level===3?-m:m}x + ${k}. Berechne f(${level===3?-n:n}).`,(level===3?-m:m)*(level===3?-n:n)+k,{hints:['Setze den angegebenen x-Wert in die Funktion ein.']});
 case 'trapezoid':return task(`Ein Trapez hat parallele Seiten ${n} cm und ${m} cm sowie Höhe ${k} cm. Bestimme die Fläche.`,Q((n+m)*k,2),{unit:'cm²',hints:['Fläche = (a + c) · h / 2.']});
 case 'frequency':return task(`Bei ${n+m} Würfen wurde ${n}-mal eine Sechs beobachtet. Bestimme die relative Häufigkeit als Bruch.`,Q(n,n+m),{hints:['Relative Häufigkeit = beobachtete Treffer / Anzahl der Versuche.']});
 case 'probability':{const red=n,blue=m;return task(`In einer Urne sind ${red} rote und ${blue} blaue Kugeln. Eine Kugel wird gezogen. Bestimme P(${g>=9?'nicht rot':'rot'}) als Bruch.`,Q(g>=9?blue:red,red+blue),{hints:['Wahrscheinlichkeit = günstige Ergebnisse / alle Ergebnisse.']});}
 case 'roots':return task(`Berechne √${n*n} ${level>1?`+ √${m*m}`:''}.`,n+(level>1?m:0),{hints:['Die Quadratwurzel ist die nichtnegative Zahl, deren Quadrat unter der Wurzel steht.']});
 case 'pythagoras':return task(`Ein rechtwinkliges Dreieck hat Katheten ${3*k} cm und ${4*k} cm. Bestimme die Hypotenuse.`,5*k,{unit:'cm',hints:['c² = a² + b². Ziehe danach die Quadratwurzel.']});
 case 'circle':return task(`Ein Kreis hat Radius ${k} cm. Bestimme die Fläche mit π = 3,14.`,Q(314*k*k,100),{unit:'cm²',hints:['Fläche = π · r².']});
 case 'quadratic':return task(`f(x) = ${level===3?-m:m}(x − ${n})² + ${k}. Bestimme den y-Wert des Scheitelpunkts.`,k,{hints:['In der Scheitelpunktsform f(x) = a(x − h)² + s liegt der Scheitel bei (h | s).']});
 case 'trig':{const angle=[30,45,60][level-1],length=Number(Math.sqrt(n*n+m*m-2*n*m*Math.cos(angle*Math.PI/180)).toFixed(2));return task(`Zwei Dreiecksseiten sind ${n} cm und ${m} cm lang; der eingeschlossene Winkel ist ${angle}°. Berechne die dritte Seite mit dem Kosinussatz. Runde auf zwei Nachkommastellen.`,decimal(length.toFixed(2)),{unit:'cm',tolerance:0.005000001,hints:['c² = a² + b² − 2ab · cos(γ).']});}
 case 'growth':return task(`Ein Bestand von ${100*n} wächst jährlich um ${5*level} %. Wie groß ist er nach ${level+1} Jahren? Runde auf zwei Nachkommastellen.`,decimal((100*n*(1+5*level/100)**(level+1)).toFixed(2)),{tolerance:0.005000001,hints:['Bestand = Anfangswert · (1 + p/100)^Jahre.']});
 case 'compound':return task(`Eine Urne enthält ${n} rote und ${m} blaue Kugeln. Du ziehst zweimal mit Zurücklegen. Bestimme P(zweimal rot) als Bruch.`,Q(n*n,(n+m)**2),{hints:['Mit Zurücklegen bleiben die Wahrscheinlichkeiten gleich. Multipliziere die beiden Pfadwahrscheinlichkeiten.']});
 case 'powerFunction':return task(`f(x) = ${m}x<sup>${level+1}</sup>. Berechne f(${level===3?-k:k}).`,m*(level===3?-k:k)**(level+1),{hints:['Berechne zuerst die Potenz und multipliziere danach.']});
 case 'cylinder':return task(`Ein Zylinder hat Radius ${k} cm und Höhe ${n} cm. Berechne sein Volumen mit π = 3,14.`,Q(314*k*k*n,100),{unit:'cm³',hints:['Volumen = π · r² · h.']});
 default:throw Error('Dieser Generator ist noch nicht verfügbar.');
 }
}
function quadraticRow(text){const sides=text.split('=');if(sides.length!==2)throw Error('Gib eine Gleichung mit genau einem = ein.');return plus(parse(sides[0]),parse(sides[1]).map(neg));}
function validateQuadratic(task,text,history){
 const parts=text.split(';').map(s=>s.trim());if(parts.some(p=>!p))throw Error('Zwischen den Lösungen fehlt ein Wert.');
 const evidence=history.some(h=>{try{return quadraticRow(h).length===3;}catch(e){return false;}}),found=[];
 for(const part of parts){let assignment;try{const e=equation(part);if(e.final)assignment=e.root;}catch(e){}
 if(assignment){if(!task.roots.some(r=>eq(r,assignment)))return {status:'wrong',message:'Dieser Wert ist keine Lösung der ursprünglichen Gleichung.'};found.push(assignment);}
 else {const row=quadraticRow(part);if(parts.length!==1||row.length!==3)throw Error('Zeige eine quadratische Umformung oder gib x = … ein.');const scale=div(row[2],task.coefficients[2]);if(!scale.n||!row.every((v,i)=>eq(v,mul(task.coefficients[i],scale))))return {status:'wrong',message:'Diese Gleichung ist nicht äquivalent zur ursprünglichen Gleichung.'};if(part.replace(/\s/g,'')===task.original.replace(/\s/g,'')||history.includes(part))return {status:'invalid',message:'Zeige einen neuen Rechenschritt.'};return {status:'step',message:'Richtige Umformung. Bestimme nun beide Lösungen.'};}}
 if(!evidence)return {status:'incomplete',message:'Die Werte stimmen. Zeige zuerst einen quadratischen Umformungsschritt.'};
 for(const h of history)try{for(const p of h.split(';')){const e=equation(p);if(e.final)found.push(e.root);}}catch(e){}
 const complete=task.roots.every(r=>found.some(v=>eq(r,v)));return {status:complete?'correct':'step',message:complete?'Beide Lösungen richtig bestimmt!':'Eine Lösung stimmt. Bestimme auch die andere.'};
}
function validateRational(task,text,history){
 const declaration=text.match(/^D\s*:\s*x\s*(?:!=|≠)\s*(.+)$/i);if(declaration){if(!eq(constant(declaration[1]),task.excluded))return {status:'wrong',message:'Dieser ausgeschlossene Wert stimmt nicht. Setze den Nenner gleich null.'};if(history.some(h=>/^D\s*:/i.test(h)))return {status:'invalid',message:'Die Definitionsmenge steht bereits da.'};return {status:'step',message:'Richtig: Dieser Wert ist ausgeschlossen. Multipliziere nun mit dem Nenner.'};}
 if(!history.some(h=>/^D\s*:/i.test(h)))return {status:'incomplete',message:'Bestimme zuerst die Definitionsmenge: D: x != … .'};
 const e=equation(text);if(eq(e.root,task.excluded)||!eq(e.root,task.answer))return {status:'wrong',message:'Diese Gleichung hat nicht die zulässige Lösung.'};if(e.final&&!history.some(h=>!/^D\s*:/i.test(h)))return {status:'incomplete',message:'Zeige zuerst einen Umformungsschritt ohne Nenner.'};if(history.includes(text))return {status:'invalid',message:'Zeige einen neuen Schritt.'};return {status:e.final?'correct':'step',message:e.final?'Richtig gelöst und Definitionsmenge beachtet!':'Richtige Umformung. Löse nun nach x auf.'};
}
function validate(task,input,history=[]){try{
 const text=String(input||'').trim();if(text.length>180)throw Error('Die Eingabe ist zu lang.');if(!text)throw Error('Bitte eine Antwort oder einen Schritt eingeben.');
 if(task.type==='quadraticSteps')return validateQuadratic(task,text,history);
 if(task.type==='rationalSteps')return validateRational(task,text,history);
 if(task.type==='systemSteps')return validateSystem(task,text,history);
 if(task.type==='equationSteps'){
 const e=equation(text);if(!eq(e.root,task.answer))return {status:'wrong',message:'Diese Gleichung hat nicht dieselbe Lösung. Prüfe Vorzeichen und beide Seiten.'};
 const originals=[equation(task.original),...history.map(equation)];if(!(e.final&&history.length)&&originals.some(o=>o.signature===e.signature||JSON.stringify([o.b,o.a])===e.signature))return {status:'invalid',message:'Diese Gleichung steht bereits da. Gib einen neuen Umformungsschritt ein.'};
 if(e.final&&!history.length)return {status:'incomplete',message:'Das Ergebnis stimmt. Zeige zuerst mindestens eine Umformung.'};
 return {status:e.final?'correct':'step',message:e.final?'Richtig gelöst!':'Diese Umformung ist richtig.'};
 }
 if(task.type==='fractionSteps'){
 const q=constant(text);if(!eq(q,task.answer))return {status:'wrong',message:'Der Wert stimmt noch nicht. Prüfe Zähler, Nenner und Vorzeichen.'};
 const normalize=s=>s.replace(/(\d+)\s+(\d+)\s*\/\s*(\d+)/g,'$1~$2/$3').replace(/\s/g,'').replace(/[·×]/g,'*').replace(/[÷:]/g,'/').replace(/−/g,'-').replace(/[()]/g,'');const compact=normalize(text);if(compact===normalize(task.original)||history.some(h=>normalize(h)===compact))return {status:'invalid',message:'Zeige einen neuen Rechenschritt.'};
 const match=text.replace(/−/g,'-').replace(/-\s+(?=\d)/g,'-').match(/^(-?\d+)\s*(?:\/\s*(-?\d+))?$/),reduced=match&&Number(match[2]||1)>0&&gcd(Number(match[1]),Number(match[2]||1))===1;
 if(reduced&&!history.length)return {status:'incomplete',message:'Der Wert stimmt. Zeige zuerst einen Zwischenschritt (Umwandeln, Erweitern, Kehrwert oder Kürzen).'};
 return {status:reduced?'correct':'step',message:reduced?'Richtig und vollständig gekürzt!':'Der Wert stimmt. Schreibe als vollständig gekürzten Bruch.'};
 }
 let numeric=text;const unit=task.unit.replace(/²/g,'2').replace(/³/g,'3');const suffix=text.match(/\s*(cm(?:[²³23])?|€)\s*$/i);if(suffix){if(!task.unit||suffix[1].replace(/²/g,'2').replace(/³/g,'3').toLowerCase()!==unit.toLowerCase())throw Error('Die Einheit passt nicht zur Aufgabe.');numeric=text.slice(0,suffix.index);}
 const q=constant(numeric),difference=Math.abs(q.n/q.d-task.answer.n/task.answer.d);return eq(q,task.answer)||(task.tolerance>0&&difference<=task.tolerance)?{status:'correct',message:'Richtig!'}:{status:'wrong',message:'Noch nicht richtig. Prüfe die Rechnung und gegebenenfalls die Rundung.'};
 }catch(e){return {status:'invalid',message:e.message};}}
return {Q,add,mul,div,eq,str,parse,constant,equation,parseLinear2,linearEquation2,solveSystem,frac,catalog,topics,generate,validate};
});
