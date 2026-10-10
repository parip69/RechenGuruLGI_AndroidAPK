(function(){
'use strict';
const M=window.MatheRealschule,KEY='MatheKids_Realschule_v1',TAB='MatheKids_SchoolSection_v1',root=document.getElementById('realschulePanel');
if(!M||!root)return;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaults=()=>({settings:{grade:6,group:'I',difficulty:'medium',limit:10,basics:false,all:true,selected:[]},choices:{},progress:{},errors:[],session:null});
let data=defaults(),task=null,storageWarning=false,gsRemaining=null,gsNextPending=false;
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&saved.settings&&saved.progress&&saved.choices&&Array.isArray(saved.errors))data={...data,...saved};}catch(e){}
const s=data.settings;if(![5,6,7,8,9,10].includes(Number(s.grade)))s.grade=6;if(!['I','II/III'].includes(s.group))s.group='I';if(!['easy','medium','hard','mixed'].includes(s.difficulty))s.difficulty='medium';if(![0,10,20,30].includes(Number(s.limit)))s.limit=10;if(!Array.isArray(s.selected))s.selected=[];
function save(){try{localStorage.setItem(KEY,JSON.stringify(data));storageWarning=false;}catch(e){storageWarning=true;const note=root.querySelector('#rsStorage');if(note)note.textContent='Speichern ist gesperrt oder der Speicher ist voll. Diese Sitzung bleibt nur bis zum Schließen erhalten.';}}
function list(){if(!s.basics)return M.topics(s.grade,s.group);return Array.from({length:s.grade-5},(_,i)=>M.topics(i+5,s.group)).flat().filter((t,i,a)=>a.findIndex(v=>v.id===t.id)===i);}
function selected(){const available=list();return s.all?available:available.filter(t=>s.selected.includes(`${t.grade}:${t.id}`));}
function seeded(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function restoreTask(){const d=data.session?.current;if(!d)return;const valid=[...M.topics(d.grade,'I'),...M.topics(d.grade,'II/III')].find(t=>t.id===d.id);if(!valid||!Number.isInteger(d.seed)){data.session=null;return;}try{task=M.generate(d.id,d.grade,d.difficulty,seeded(d.seed));}catch(e){data.session=null;task=null;}}
restoreTask();
root.innerHTML=`<h2>Realschule Bayern</h2><p class="rs-subtitle">Klassen 5–10 · erste Übungsauswahl nach LehrplanPLUS</p>
<details class="rs-settings" open><summary>Einstellungen</summary><div class="rs-config">
<label>Klasse<select id="rsGrade">${[5,6,7,8,9,10].map(g=>`<option value="${g}">${g}</option>`).join('')}</select></label>
<label id="rsGroupLabel">Wahlpflichtfächergruppe<select id="rsGroup"><option value="I">I · mathematisch-technisch</option><option value="II/III">II / III</option></select></label>
<label>Schwierigkeit<select id="rsDifficulty"><option value="easy">Leicht</option><option value="medium">Mittel</option><option value="hard">Schwer</option><option value="mixed">Gemischt</option></select></label>
<label>Aufgaben<select id="rsLimit"><option value="10">10</option><option value="20">20</option><option value="30">30</option><option value="0">Unbegrenzt</option></select></label></div>
<label class="rs-check"><input type="checkbox" id="rsBasics"> Grundlagen früherer Realschulklassen wiederholen</label>
<label class="rs-check"><input type="checkbox" id="rsAll"> Alle verfügbaren Themen</label><fieldset id="rsTopics"><legend>Themen</legend></fieldset>
<p id="rsCoverage" class="rs-note"></p><p class="rs-note">Die Auswahl ist ein ausbaufähiger Einstieg, kein vollständiger Lehrplan. Schwierigkeit bleibt innerhalb der gewählten Klasse. Ändere Einstellungen für die nächste Übungsrunde.</p>
<button type="button" id="rsStart">Neue Übungsrunde</button><p id="rsConfigMessage" role="status"></p></details>
<div id="rsSession"></div><details class="rs-progress"><summary>Fortschritt und Wiederholung</summary><div id="rsProgress"></div><button type="button" id="rsReview">Fehlerthemen mit neuen Zahlen üben</button></details><p class="rs-note" id="rsStorage">Realschul-Daten werden getrennt auf diesem Gerät gespeichert.</p>`;
const el=id=>root.querySelector('#'+id);
function config(){el('rsGrade').value=s.grade;el('rsGroup').value=s.group;el('rsDifficulty').value=s.difficulty;el('rsLimit').value=s.limit;el('rsBasics').checked=s.basics;el('rsBasics').disabled=s.grade===5;if(s.grade===5)s.basics=false;el('rsGroupLabel').hidden=s.grade<7;el('rsAll').checked=s.all;
 el('rsTopics').innerHTML='<legend>Themen</legend>'+list().map(t=>`<label class="rs-check"><input type="checkbox" data-topic="${t.grade}:${t.id}" ${s.all||s.selected.includes(`${t.grade}:${t.id}`)?'checked':''} ${s.all?'disabled':''}><span>${esc(t.label)}${s.basics?` · Klasse ${t.grade}`:''}<small>${esc(t.area)}</small></span></label>`).join('');
 el('rsCoverage').innerHTML=`${list().length} aktive Übungsthemen. <a href="${M.topics(s.grade,s.group)[0].source}" target="_blank" rel="noopener">Offizieller Lehrplan Klasse ${s.grade}${s.grade>6?' · Gruppe '+esc(s.group):''}</a>`;
}
function remember(){data.choices[`${s.grade}:${s.group}:${s.basics?'basics':'grade'}`]={all:s.all,selected:s.selected};save();}
for(const id of ['rsGrade','rsGroup','rsBasics'])el(id).addEventListener('change',()=>{remember();s.grade=Number(el('rsGrade').value);s.group=el('rsGroup').value;s.basics=el('rsBasics').checked&&s.grade>5;const choice=data.choices[`${s.grade}:${s.group}:${s.basics?'basics':'grade'}`];s.all=choice?.all??true;s.selected=Array.isArray(choice?.selected)?choice.selected:[];config();save();});
for(const [id,key] of [['rsDifficulty','difficulty'],['rsLimit','limit']])el(id).addEventListener('change',()=>{s[key]=key==='limit'?Number(el(id).value):el(id).value;save();});
el('rsAll').addEventListener('change',()=>{s.all=el('rsAll').checked;if(!s.all&&!s.selected.length)s.selected=list().map(t=>`${t.grade}:${t.id}`);config();remember();});el('rsTopics').addEventListener('change',()=>{s.selected=Array.from(root.querySelectorAll('[data-topic]:checked')).map(e=>e.dataset.topic);remember();});
function start(review=false){const chosen=selected();if(!chosen.length){el('rsConfigMessage').textContent='Wähle mindestens ein Thema.';return;}const queue=review?data.errors.filter(e=>chosen.some(t=>t.id===e.id&&t.grade===e.grade)):[];if(review&&!queue.length){el('rsConfigMessage').textContent='Für diese Auswahl gibt es keine Fehlerthemen.';return;}
 if(data.session&&!data.session.finished&&!window.confirm('Die laufende Realschulrunde ersetzen? Der bisherige Themenfortschritt bleibt erhalten.'))return;
 data.session={pool:chosen.map(t=>({id:t.id,grade:t.grade,label:t.label})),difficulty:s.difficulty,limit:review?queue.length:s.limit,queue,review,count:0,correct:0,attempts:0,wrong:0,assisted:0,skipped:0,byTopic:{},finished:false,current:null};el('rsConfigMessage').textContent='';nextTask();root.querySelector('.rs-settings').open=false;render();}
function nextTask(){const session=data.session;if(session.limit&&session.count>=session.limit){session.finished=true;session.current=null;task=null;save();render();return;}const t=session.review?session.queue[session.count]:session.pool[session.count%session.pool.length],seed=new Uint32Array(1);
 const previous=session.review?t:session.current;
 let previousPrompt=null;
 if(previous?.id===t.id&&previous.grade===t.grade&&Number.isInteger(previous.seed))previousPrompt=M.generate(t.id,t.grade,previous.difficulty||session.difficulty,seeded(previous.seed)).prompt;
 let candidate;
 for(let retry=0;retry<8;retry++){
   if(window.crypto?.getRandomValues)crypto.getRandomValues(seed);else seed[0]=Math.random()*4294967295;
   candidate=M.generate(t.id,t.grade,session.difficulty,seeded(seed[0]));
   if(candidate.prompt!==previousPrompt)break;
 }
 session.current={id:t.id,grade:t.grade,label:t.label||M.topics(t.grade,s.group).find(v=>v.id===t.id)?.label||t.id,difficulty:session.difficulty,seed:seed[0],history:[],input:'',hints:0,assisted:false,done:false,hadError:false};task=candidate;save();}
function progress(){el('rsReview').disabled=!data.errors.length;const rows=Object.values(data.progress);el('rsProgress').innerHTML=rows.length?`<p>${data.errors.length} Fehlerthemen vorgemerkt. Sie werden mit neuen Zahlen wiederholt.</p><ul>${rows.map(t=>`<li>${esc(t.label)} · Klasse ${t.grade}: ${t.correct} richtig, ${t.wrong} Fehler, ${t.attempts} Prüfversuche, ${t.assisted} mit Lösung, ${t.skipped} übersprungen</li>`).join('')}</ul>`:'<p>Dein Fortschritt erscheint nach der ersten Prüfung.</p>';}
function record(status){const ss=data.session,c=ss.current,key=`${c.grade}:${c.id}`,initial={label:c.label,grade:c.grade,correct:0,wrong:0,attempts:0,assisted:0,skipped:0};data.progress[key]??={...initial};ss.byTopic[key]??={...initial};for(const row of [data.progress[key],ss.byTopic[key]]){row[status]++;}if(status==='wrong'){c.hadError=true;if(!data.errors.some(e=>e.id===c.id&&e.grade===c.grade))data.errors.push({id:c.id,grade:c.grade,seed:c.seed,difficulty:c.difficulty});}if(status==='correct'&&ss.review)data.errors=data.errors.filter(e=>e.id!==c.id||e.grade!==c.grade);}
function finish(status){const ss=data.session,c=ss.current;if(c.done)return;c.done=true;ss.count++;ss[status]++;record(status);save();}
function render(){const ss=data.session;progress();if(!ss){el('rsSession').innerHTML='<p class="rs-empty">Wähle Klasse und Themen. Starte dann deine Übungsrunde.</p>';return;}
 if(ss.finished){el('rsSession').innerHTML=`<article class="rs-card"><h3>Runde abgeschlossen</h3><p>${ss.correct} von ${ss.count} Aufgaben selbst gelöst · ${ss.wrong} Fehlversuche · ${ss.assisted} mit Lösung · ${ss.skipped} übersprungen</p><ul>${Object.values(ss.byTopic).map(t=>`<li>${esc(t.label)}: ${t.correct} richtig, ${t.wrong} Fehler, ${t.attempts} Prüfversuche</li>`).join('')}</ul><button id="rsAgain" type="button">Noch eine Runde</button></article>`;el('rsAgain').onclick=()=>start();return;}
 const c=ss.current;if(!c||!task)return;const multi=task.type!=='short';el('rsSession').innerHTML=`<article class="rs-card"><p class="rs-note">${ss.count+(c.done?0:1)}${ss.limit?' / '+ss.limit:''} · Klasse ${c.grade} · ${esc(c.label)}${ss.review?' · Fehlerwiederholung':''}</p><h3 class="rs-prompt">${task.prompt}</h3><ol class="rs-history">${c.history.map(h=>`<li>${esc(h)}</li>`).join('')}</ol>
 <form id="rsAnswerForm"><label for="rsAnswer">${multi?'Nächster Rechenschritt':'Deine Antwort'}${task.unit?' (in '+task.unit+')':''}</label><div class="rs-answer-row"><input id="rsAnswer" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="180" value="${esc(c.input)}" ${c.done?'disabled':''}><button id="rsCheck" ${c.done?'disabled':''}>${multi?'Schritt prüfen':'Prüfen'}</button></div></form><p class="rs-note">${task.type==='equationSteps'?'Zum Beispiel 3x = 15. Nutze x, =, +, -, *, / und Klammern.':task.type==='fractionSteps'?'Brüche als 6/12 eingeben. Auch vorheriges Kürzen ist möglich.':'Dezimalkomma oder Brüche sind möglich. Die angezeigte Einheit musst du nicht eintippen.'}</p><p id="rsFeedback" role="status" aria-live="polite">${c.done?(c.assisted?'Lösung angezeigt. Gehe zur nächsten Aufgabe.':'Aufgabe abgeschlossen.'):''}</p><div class="rs-actions"><button id="rsHint" type="button" ${c.done?'disabled':''}>Hinweis</button><button id="rsSolution" type="button" ${c.done?'disabled':''}>Lösung anzeigen</button><button id="rsNext" type="button">${c.done?'Nächste Aufgabe':'Überspringen'}</button></div></article>`;
 el('rsAnswer').addEventListener('input',()=>{c.input=el('rsAnswer').value;save();});
 el('rsAnswerForm').onsubmit=e=>{e.preventDefault();if(c.done)return;const answer=el('rsAnswer').value,v=M.validate(task,answer,c.history);if(v.status==='invalid'||v.status==='incomplete'){el('rsFeedback').textContent=v.message;return;}ss.attempts++;record('attempts');if(v.status==='wrong'){ss.wrong++;record('wrong');save();progress();el('rsFeedback').textContent=v.message;return;}if(c.history.length>=50)c.history.shift();c.history.push(answer);c.input='';if(v.status==='correct')finish('correct');else save();render();el('rsFeedback').textContent=v.message;if(!c.done)el('rsAnswer').focus();};
 el('rsHint').onclick=()=>{el('rsFeedback').textContent=task.hints[Math.min(c.hints++,task.hints.length-1)]||'Gehe Schritt für Schritt vor.';save();};
 el('rsSolution').onclick=()=>{c.assisted=true;finish('assisted');render();el('rsFeedback').textContent=(task.steps.length?task.steps.join(' → '):M.str(task.answer)+(task.unit?' '+task.unit:''))+' · Als Aufgabe mit Lösung erfasst.';};
 el('rsNext').onclick=()=>{if(!c.done)finish('skipped');nextTask();render();};
}
el('rsStart').onclick=()=>start();el('rsReview').onclick=()=>start(true);
function switchSection(section){const rs=section==='realschule';window.__schoolSection=section;document.getElementById('grundschulePanel').hidden=rs;root.hidden=!rs;document.querySelectorAll('[data-school-tab]').forEach(b=>{b.setAttribute('aria-selected',String((b.dataset.schoolTab==='realschule')===rs));b.tabIndex=(b.dataset.schoolTab===section)?0:-1;});
 if(rs){document.activeElement?.blur();if(typeof mgHideKeypad==='function')mgHideKeypad();if(window._roundTimerTimeout){gsRemaining=Math.max(0,(window._roundTimerDeadline||Date.now())-Date.now());clearRoundTimer();}}
 else {if(gsNextPending){gsNextPending=false;initGame(false,false);}else if(gsRemaining!==null){const remaining=gsRemaining;gsRemaining=null;window._roundTimerDeadline=Date.now()+remaining;window._roundTimerTimeout=setTimeout(()=>{window._roundTimerTimeout=null;onRoundTimeout();},remaining);}}
 try{localStorage.setItem(TAB,section);}catch(e){}save();}
window.RealschuleUI={getState:()=>data,pauseGrundschuleTimer:ms=>{gsRemaining=ms;},pausePendingGrundschule:()=>{gsNextPending=true;},switchSection};
const tabs=Array.from(document.querySelectorAll('[data-school-tab]'));tabs.forEach((b,i)=>{b.onclick=()=>switchSection(b.dataset.schoolTab);b.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const target=tabs[1-i];switchSection(target.dataset.schoolTab);target.focus();}});});
config();render();let section='grundschule';try{if(localStorage.getItem(TAB)==='realschule')section='realschule';}catch(e){}switchSection(section);
})();
