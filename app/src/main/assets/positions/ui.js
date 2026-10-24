/* Tile-local settings; profiles, ordinary controls and special generators stay shared. */
(function () {
  'use strict';
  const B = window.MatheBuilder;
  const $ = id => document.getElementById(id);
  const families = [
    {id:'sum', title:'Plus & Minus', modes:['plus','minus','mix'], labels:['Nur Plus','Nur Minus','Gemischt']},
    {id:'product', title:'Mal & Geteilt', modes:['mal','geteilt','mixMD','mixedMal'], labels:['Nur Mal','Nur Geteilt','Gemischt','Besondere Malaufgaben']},
    {id:'chain', title:'Rechenketten', modes:['chain','mixALL'], labels:['Rechenketten','Alle Rechenarten']},
    {id:'square', title:'Quadratzahlen', modes:['squareMal','squareDiv'], labels:['Mal','Geteilt']},
    {id:'pyramid', title:'Zahlenpyramiden', modes:['pyramide'], labels:['Plus-Pyramide']},
    {id:'grapes', title:'Rechentrauben', modes:['traube'], labels:['Minus-Traube']},
    {id:'double', title:'Verdoppeln', modes:['double'], labels:['Verdoppeln'], small:true},
    {id:'half', title:'Halbieren', modes:['half'], labels:['Halbieren'], small:true},
    {id:'errors', title:'Fehler üben', modes:['fehler'], labels:['Fehler üben'], small:true}
  ];
  const supported = new Set(['plus','minus','mix','mal','geteilt','mixMD','mixALL','chain','squareMal','squareDiv']);
  const mode = () => $('viewSelect').value;
  const family = () => families.find(f => f.modes.includes(mode())) || families[0];
  let selected = null, draft = null, dialog, anchor, restoring = false;
  function el(tag, text, cls) {
    const node = document.createElement(tag);
    if (text != null) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  }
  function button(text, action, active = false) {
    const b = el('button', text); b.type = 'button';
    b.setAttribute('aria-pressed', String(active)); b.onclick = e => {e.stopPropagation();action();}; return b;
  }
  function snapshot() {
    return Object.fromEntries(getAllControlsInArea().filter(e => e.id !== 'positionConfig').map(e => [e.id,e.type === 'checkbox' ? e.checked : e.value]));
  }
  function config() {
    const base = B.fromLegacy(mode(), snapshot(), activeGrade);
    const raw = $('positionConfig').value;
    if (!raw) return base;
    let saved;
    try { saved = JSON.parse(raw); } catch (_) { throw Error('Die gespeicherten Kästchen sind beschädigt. Bitte die Einstellungen dieser Aufgabenart zurücksetzen.'); }
    if(!saved || saved.schema!==1 || !Array.isArray(saved.numbers) || !Array.isArray(saved.operators) ||
       saved.numbers.some(n=>!n || typeof n.id!=='string') ||
       saved.operators.some(o=>!o || typeof o.id!=='string' || !Array.isArray(o.allowed)))
      throw Error('Die gespeicherten Kästchen haben ein ungültiges Format. Bitte die Einstellungen dieser Aufgabenart zurücksetzen.');
    // Only position-specific properties override the current common controls.
    const c = {...base, ...saved};
    for (const key of ['max','intermediateMax','difficulty','carry','rows','requireAllRows','profile','taskCount','legacy','format','square']) c[key] = base[key];
    c.family = mode(); c.grade = String(activeGrade);
    if (mode() === 'chain') { c.pattern = $('chainPattern').value; c.lengthMode = $('chainLength').value === 'mixed' ? 'mixed' : 'fixed'; }
    return c;
  }
  function usesCustom(m) { return supported.has(m) && !!$('positionConfig')?.value; }
  function generate(m) {
    const c = config();
    const diff = getDifficulty();
    return B.generate(c, {effectiveDifficulty:diff === 'mixed' ? getAdaptiveDifficulty(m, diff) : diff});
  }
  function quietKeyboard() {
    clearTimeout(window._autoNextTimeout); window._autoNextTimeout = null;
    if (document.activeElement?.matches('input,textarea')) document.activeElement.blur();
    if (typeof mgHideKeypad === 'function') mgHideKeypad();
  }
  function pick(m, open) {
    quietKeyboard(); closeViewSelectPopup();
    selected = null;
    $('viewSelect').value = m; wechselAnsicht(false);
    appStorage.setItem('mathTileLast:' + family().id, m);
    if (open) openSettings(); else { closeSettings(false); scrollToTasks(); focusFirstTaskInput(true); }
  }
  function last(f) {
    if (f.modes.includes(mode())) return mode();
    const saved = appStorage.getItem('mathTileLast:' + f.id);
    return f.modes.includes(saved) ? saved : f.modes[0];
  }
  function tileSummary(f, m, s) {
    const max = Math.max(5,Math.min(1000,Number(s.maxWert) || getDefaultMaxForMode(m)));
    let c = null;
    try { if (s.positionConfig) c = JSON.parse(s.positionConfig); } catch (_) {}
    if(c && (!Array.isArray(c.numbers)||!Array.isArray(c.operators)||c.operators.some(o=>!Array.isArray(o?.allowed))))c=null;
    const ops = c?.operators?.flatMap(o=>o.allowed || []);
    let selection = f.labels[f.modes.indexOf(m)];
    if (ops?.length) {
      const unique=[...new Set(ops)];
      selection=unique.length===1?({plus:'Nur Plus',minus:'Nur Minus',mal:'Nur Mal',geteilt:'Nur Geteilt'}[unique[0]]||selection):'Gemischt';
    }
    let query = s.taskFormat === 'faktor' ? 'Zahl gesucht' : s.taskFormat === 'operator' ? 'Zeichen gesucht' :
      s.taskFormat === 'wahrfalsch' ? 'Richtig / Falsch' : s.taskFormat === 'compare' ? 'Vergleichen' : 'Ergebnis gesucht';
    if(c && !['wahrfalsch','compare'].includes(s.taskFormat)) {
      const ns=(c.numbers || []).flatMap((n,i)=>n?.query?[(i+1)+'. Zahl']:[]);
      const operators=(c.operators || []).filter(o=>o.query).length;
      if(c.resultQuery)ns.push('Ergebnis'); if(operators)ns.push('Zeichen');
      query=ns.length===1?ns[0]+' gesucht':ns.length===2?ns.join(' / '):ns.length>2?'Lücken gemischt':'Lücke auswählen';
    }
    let detail=selection;
    if(m==='mixedMal'){detail='Malaufgaben A–F';query='Lücken gemischt';}
    if(m==='fehler'){detail='Gespeicherte Fehler';query='Fehler wiederholen';}
    if(f.id==='sum')detail+=' · '+(c?.numbers?.length || (Number(s.operandCount)===3?3:2))+' Zahlen';
    if(f.id==='chain') {
      const count=c?.numbers?.length || (s.chainLength==='mixed'?10:Number(s.chainLength)||4);
      detail=(s.chainLength==='mixed'?'2–'+count:count)+' Zahlen · '+(ops?.length?selection.toLowerCase():m==='mixALL'?'alle Zeichen':'Rechenketten');
    }
    if(['product','square'].includes(f.id)) {
      let rows;
      try { rows=JSON.parse(s.rowTrain || '"mixed"'); } catch (_) { rows=String(s.rowTrain || 'mixed').split(','); }
      rows=Array.isArray(rows)?rows:[rows];
      const numeric=rows.map(Number).filter(n=>n>=1&&n<=10);
      if(!rows.includes('mixed') && numeric.length)detail+=' · '+(numeric.length===1?numeric[0]+'er-Reihe':numeric.length<=3?'Reihen '+numeric.join(','):numeric.length+' Reihen');
      else if(f.id==='product' && c?.table===false)detail+=' · eigene Bereiche';
      else if(f.id==='product' && m!=='mixedMal')detail+=' · alle Reihen';
    }
    let limits='Bis '+max;
    if(c?.resultRule==='fixed')limits+=' · Ergebnis '+c.resultValue;
    else if(c?.resultRule==='max' && String(c.resultValue)!==String(max))limits+=' · Ergebnis bis '+c.resultValue;
    if(!['pyramid','grapes'].includes(f.id))limits+=' · '+query;
    return [detail,limits];
  }
  function renderTiles() {
    const list = $('viewSelectPopupList'); list.replaceChildren();
    let extras = false;
    for (const f of families) {
      if (f.small && !extras) { list.append(el('div','Weitere Übungen','selectPopupGroup')); extras = true; }
      const m = last(f), s = m===mode()?{...snapshot(),positionConfig:$('positionConfig').value}:loadModeSettings(m) || {};
      const tile = el('div', null, 'position-tile' + (f.modes.includes(mode()) ? ' selected' : '') + (f.small ? ' small' : ''));
      tile.dataset.family = f.id;
      const select = button('', () => pick(m, false),f.modes.includes(mode())); select.className = 'position-tile-pick';
      const [detail,limits]=tileSummary(f,m,s);
      select.append(el('strong',f.title),el('span',detail,'position-tile-detail'),el('span',limits,'position-tile-limits'));
      const gear = button('⚙', () => pick(m, true)); gear.className = 'position-tile-gear';
      gear.setAttribute('aria-label', 'Einstellungen: ' + f.title);
      gear.setAttribute('aria-haspopup','dialog');gear.setAttribute('aria-controls','tileSettingsDialog');
      tile.append(select, gear); list.append(tile);
    }
  }
  function openSettings() {
    quietKeyboard();
    if (!dialog.open) { anchor.after(dialog); dialog.querySelector('.position-dialog-body').append($('settingsDetails')); $('settingsDetails').open = true; refresh(); dialog.showModal(); syncNativeSettingsDialog(); }
  }
  function syncNativeSettingsDialog() {
    const bridge = typeof getAndroidBridge === 'function' ? getAndroidBridge() : null;
    if (typeof bridge?.setSettingsDialogOpen === 'function') bridge.setSettingsDialogOpen(dialog.open);
  }
  function finish(practice) {
    if (practice && supported.has(mode())) {
      try { B.generate(config()); } catch(e) { message(e.message); return; }
    }
    saveModeSettings(mode());
    dialog.close(); syncNativeSettingsDialog(); restoring = true;
    $('settingsDetails').open = false; anchor.after($('settingsDetails')); restoring = false;
    if (practice) { initGame(true); focusFirstTaskInput(true); }
  }
  function message(text) {
    const target = $('positionMessage'); if (!target) return;
    target.textContent = text || ''; target.hidden = !text;
    $('positionPractice').disabled = !!text;
  }
  function commit(redraw = true) {
    $('positionConfig').value = JSON.stringify(draft);
    try { appStorage.setItem(modeSettingsKey(mode()), JSON.stringify({...snapshot(), positionConfig:$('positionConfig').value})); }
    catch (_) { message('Die Einstellungen konnten nicht gespeichert werden. Bitte Speicherplatz prüfen.'); return; }
    if (redraw) refresh();
    else {
      const c = config(), errors = B.validate(c);
      for (const n of c.numbers) {
        const b = Array.from(document.querySelectorAll('.position-slot')).find(e=>e.dataset.slot===n.id)?.querySelector('.position-box');
        if(b)b.textContent=n.kind==='fixed'?String(n.value):n.min+'–'+n.max;
      }
      showErrors(errors);
    }
  }
  function setGap(slot, checked) {
    if (slot === 'result') draft.resultQuery = checked; else slot.query = checked;
    $('taskFormat').value = 'positions'; draft.format = 'gap'; commit();
  }
  function checkbox(label, checked, action, disabled = false) {
    const wrap = el('label', null, 'position-check'), c = document.createElement('input');
    c.type = 'checkbox'; c.checked = checked; c.disabled = disabled; c.dataset.mgGlobal = '1';
    c.onclick = e => e.stopPropagation();
    c.onchange = () => action(c.checked); wrap.append(c, document.createTextNode(label)); return wrap;
  }
  function numberInput(label, value, action) {
    const wrap = el('label',label), input = document.createElement('input');
    input.type = 'number'; input.inputMode = 'numeric'; input.min = '0'; input.max = '1000'; input.value = value ?? '';
    input.dataset.mgGlobal = '1'; input.setAttribute('aria-label', label);
    input.oninput = () => { action(input.value === '' ? null : Number(input.value)); commit(false); };
    input.onchange = () => commit(false); wrap.append(input); return wrap;
  }
  function resize(count, preserveMixed = false) {
    count = Math.max(2, Math.min(10, count));
    const allowed = draft.operators.at(-1)?.allowed || ['plus'];
    while (draft.numbers.length < count) {
      draft.numbers.push(B.numberSlot('n' + cryptoId(),0, Math.min(9,draft.max)));
      draft.operators.push({id:'o'+cryptoId(),allowed:allowed.slice(),query:false});
    }
    draft.numbers.length = count; draft.operators.length = count-1;
    if (mode() === 'chain' && !preserveMixed) $('chainLength').value = String(count);
    if (['plus','minus','mix'].includes(mode()) && count <= 3) $('operandCount').value = String(count);
    selected = null; commit();
  }
  const cryptoId = () => Math.random().toString(36).slice(2,10);
  function renderEditor() {
    const host = $('positionEditor'); host.replaceChildren();
    if (!supported.has(mode())) { host.hidden = true; return; } host.hidden = false;
    try { draft = config(); } catch(e) { host.append(el('p', e.message)); message(e.message); return; }
    host.append(el('h3','Aufbau der Aufgabe'));
    if (mode() === 'chain') {
      const count = el('div',null,'position-count'); count.append(el('span','Zahlen pro Aufgabe'));
      const minus = button('−',() => resize(draft.numbers.length-1)); minus.disabled = draft.numbers.length <= 2; minus.setAttribute('aria-label','Eine Zahl weniger');
      const plus = button('+',() => resize(draft.numbers.length+1)); plus.disabled = draft.numbers.length >= 10; plus.setAttribute('aria-label','Eine Zahl mehr');
      count.append(minus,el('strong',String(draft.numbers.length)),plus); host.append(count);
    }
    if (['mal','geteilt','mixMD'].includes(mode())) {
      const row = el('div',null,'position-buttons');
      row.append(button('Einmaleinsreihen',()=>{draft.table=true;commit();},draft.table),button('Eigene Bereiche',()=>{draft.table=false;commit();},!draft.table)); host.append(row);
    }
    const equation = el('div',null,'position-equation');
    const gapEnabled = draft.format === 'gap';
    const box = (key, title, text, slot) => {
      const group = el('div',null,'position-slot'); group.dataset.slot = key;
      group.append(el('small',title));
      const b = button(text,()=>{selected=selected===key?null:key;refresh();}, selected === key); b.className = 'position-box'; b.setAttribute('aria-label',title+' einstellen'); group.append(b);
      if (slot) group.append(checkbox('Lücke',slot === 'result' ? draft.resultQuery : slot.query, checked=>setGap(slot,checked),!gapEnabled));
      return group;
    };
    draft.numbers.forEach((n,i) => {
      const part = el('div',null,'position-term');
      if (i) {
        const o = draft.operators[i-1];
        const operator = box(o.id,'Zeichen '+i,o.allowed.map(op=>B.symbols[op]).join(' '), null);
        if (o.query) operator.append(el('small','Lücke')); part.append(operator);
      }
      part.append(box(n.id,(i+1)+'. Zahl',n.kind === 'fixed' ? String(n.value) : n.kind === 'rows' ? 'Reihen' : n.min+'–'+n.max,n));
      equation.append(part);
    });
    const resultPart = el('div',null,'position-term'); resultPart.append(el('span','=','position-equals'),box('result','Ergebnis',draft.resultRule === 'fixed' ? String(draft.resultValue) : draft.resultRule === 'max' ? 'bis '+draft.resultValue : 'Ergebnis','result')); equation.append(resultPart); host.append(equation);
    const gaps = draft.numbers.flatMap((n,i)=>n.query?[(i+1)+'. Zahl']:[]);
    if(draft.resultQuery) gaps.push('Ergebnis'); if(draft.operators.some(o=>o.query)) gaps.push('Rechenzeichen');
    host.append(el('p',gapEnabled ? 'Lücke: '+(gaps.join(' oder ') || 'Bitte mindestens eine wählen') : 'Abfrage: '+(draft.format === 'compare' ? 'Vergleichen' : 'Richtig oder falsch'),'position-summary'));
    if (selected) renderSlot(host);
    const previewButton = button('5 Beispielaufgaben', () => {
      const list = el('div',null,'position-examples');
      try { const samples = Array.from({length:5},()=>B.generate(config())); samples.forEach(t=>list.append(el('p',t.expression))); message(''); }
      catch(e) { list.textContent = e.message; message(e.message); }
      $('positionExamples')?.remove(); list.id='positionExamples'; host.append(list);
    }); host.append(previewButton);
    showErrors(B.validate(draft));
    applyVisibility();
  }
  function showErrors(errors) {
    message([...new Set(errors.map(e=>e.message))].join(' '));
    document.querySelectorAll('.position-slot').forEach(slot=>{
      const invalid=errors.some(e=>e.field===slot.dataset.slot || (slot.dataset.slot==='result'&&e.field==='query'));
      slot.querySelector('button').setAttribute('aria-invalid',String(invalid));
    });
  }
  function renderSlot(host) {
    const panel = el('section',null,'position-detail');
    if (selected === 'result') {
      panel.append(el('h4','Ergebnis einstellen'));
      const choices = [['auto','Aus der Rechnung berechnen'],['max','Höchstens'],['fixed','Genau']];
      choices.forEach(([value,label])=>panel.append(button(label,()=>{draft.resultRule=value;draft.resultValue??=draft.max;commit();},(draft.resultRule||'auto')===value)));
      if (draft.resultRule && draft.resultRule !== 'auto') panel.append(numberInput('Ergebnis',draft.resultValue,v=>draft.resultValue=v));
    } else {
      const i = draft.numbers.findIndex(n=>n.id===selected), n = draft.numbers[i];
      if (n) {
        panel.append(el('h4',(i+1)+'. Zahl einstellen'));
        const choices=el('div',null,'position-buttons');
        for(const [min,max] of [[0,9],[1,9],[10,99]]) choices.append(button(min+'–'+max,()=>{Object.assign(n,{kind:'range',min,max,allowZero:min===0});commit();},n.kind==='range'&&n.min===min&&n.max===max));
        choices.append(button('Feste Zahl',()=>{n.kind='fixed';n.value=n.min;commit();},n.kind==='fixed'));
        choices.append(button('Eigener Bereich',()=>{n.kind='range';commit();},n.kind==='range'));
        if(['chain','mixALL'].includes(mode()))choices.append(button('Aus Reihen',()=>{n.kind='rows';n.min=1;n.max=10;n.allowZero=false;commit();},n.kind==='rows'));
        panel.append(choices);
        const inputs=el('div',null,'position-inputs');
        if(n.kind==='fixed')inputs.append(numberInput('Zahl',n.value,v=>n.value=v));
        else inputs.append(numberInput('Von',n.min,v=>{n.min=v;n.allowZero=v===0;}),numberInput('Bis',n.max,v=>n.max=v));
        panel.append(inputs,checkbox('Null erlauben',n.allowZero,v=>{n.allowZero=v;commit();}));
        if(mode()==='chain'&&draft.numbers.length>2)panel.append(button('Dieses Rechenglied entfernen',()=>{
          draft.numbers.splice(i,1); draft.operators.splice(i===0?0:i-1,1); if($('chainLength').value!=='mixed')$('chainLength').value=String(draft.numbers.length);selected=null;commit();
        }));
        if(mode()==='chain'&&draft.numbers.length<10)panel.append(button('Rechenglied dahinter einfügen',()=>{
          draft.numbers.splice(i+1,0,B.numberSlot('n'+cryptoId(),1,9));draft.operators.splice(i,0,{id:'o'+cryptoId(),allowed:['plus'],query:false});if($('chainLength').value!=='mixed')$('chainLength').value=String(draft.numbers.length);commit();
        }));
      } else {
        const o=draft.operators.find(o=>o.id===selected); if(!o)return;
        panel.append(el('h4','Erlaubte Rechenzeichen'));
        const options=el('div',null,'position-buttons');
        const allowed=['chain','mixALL'].includes(mode())?Object.keys(B.symbols):B.fromLegacy(mode(),snapshot(),activeGrade).operators.flatMap(o=>o.allowed);
        for(const [op,symbol] of Object.entries(B.symbols).filter(([op])=>allowed.includes(op)))options.append(button(symbol,()=>{
          if(o.allowed.includes(op)){if(o.allowed.length===1)return;o.allowed=o.allowed.filter(x=>x!==op);}else o.allowed.push(op);
          commit();
        },o.allowed.includes(op)));
        panel.append(options,checkbox('Dieses Zeichen darf fehlen',!!o.query,v=>{o.query=v;$('taskFormat').value='positions';commit();}));
        if(new Set(allowed).size===1)panel.append(el('small','Für mehrere Rechenarten oben die gemischte Aufgabenart wählen.'));
        if(draft.table)panel.append(el('small','Reihentraining verwendet Mal und Geteilt. Für Plus/Minus bitte „Eigene Bereiche“ wählen.'));
      }
    }
    host.append(panel);
  }
  function applyVisibility() {
    const custom = supported.has(mode());
    for(const id of ['onesOnlyGroup','operandCountGroup']) if(custom) $(id).style.display='none';
    if(mode()==='chain') { $('chainGroup').style.display=''; $('chainGroup').querySelector('.chain-options').hidden=true; $('chainGroup').querySelector('label').hidden=true; }
    if(['mal','geteilt','mixMD'].includes(mode())) {
      $('rowGroup').style.display=draft?.table?'':'none'; $('mulProfileGroup').style.display=draft?.table?'':'none';
    }
    if(['chain','mixALL'].includes(mode()) && usesCustom(mode())){
      const rows=draft.numbers.some(n=>n.kind==='rows');
      $('rowGroup').style.display=rows?'':'none';$('mulProfileGroup').style.display=rows?'':'none';
    }
  }
  function refresh() {
    if (!$('tileFamilyOptions')) return;
    const f=family(); appStorage.setItem('mathTileLast:'+f.id,mode());
    if($('positionDialogTitle'))$('positionDialogTitle').textContent=f.title;
    if($('positionLegacyOptions'))$('positionLegacyOptions').open=!supported.has(mode());
    const host=$('tileFamilyOptions');host.replaceChildren();
    f.modes.forEach((m,i)=>host.append(button(f.labels[i],()=>pick(m,true),m===mode())));
    message(''); renderEditor();
  }
  function init() {
    anchor = document.createComment('original exercise selector'); $('settingsDetails').before(anchor);
    dialog = document.createElement('dialog');dialog.id='tileSettingsDialog';dialog.setAttribute('aria-labelledby','positionDialogTitle');
    dialog.innerHTML='<header><h2 id="positionDialogTitle"></h2><button type="button" aria-label="Einstellungen schließen" data-close>×</button></header><div class="position-dialog-body"></div><footer><p id="positionMessage" role="alert" hidden></p><button type="button" id="positionPractice">Üben</button></footer>';
    $('grundschulePanel').append(dialog);
    const more=document.createElement('details');more.id='positionLegacyOptions';
    more.innerHTML='<summary>Weitere Einstellungen</summary><div class="position-legacy-body"></div>';
    const keep=new Set(['positionConfig','tileFamilyOptions','positionEditor','maxValueGroup','rowGroup']);
    for(const child of Array.from($('controlsArea').children))if(!keep.has(child.id))more.lastElementChild.append(child);
    $('controlsArea').append(more);
    dialog.querySelector('[data-close]').onclick=()=>finish(false);$('positionPractice').onclick=()=>finish(true);
    dialog.addEventListener('cancel',e=>{e.preventDefault();finish(false);});
    dialog.addEventListener('close',syncNativeSettingsDialog);
    const originalClose=window.closeSettings; window.closeSettings=function(focus=true){if(dialog.open){finish(focus);return;}originalClose(focus);};
    const originalApply=window.applyModeSettings;window.applyModeSettings=function(m){originalApply(m);if(!restoring)refresh();};
    window.renderViewSelectPopup=renderTiles;
    const originalOpen=window.openViewSelectPopup;window.openViewSelectPopup=function(e){quietKeyboard();originalOpen(e);};
    // Existing listeners captured the original function before this module loaded.
    $('viewSelectOverlay').addEventListener('click',quietKeyboard,true);
    const summary=$('settingsDetails').querySelector('summary');
    summary.addEventListener('click',e=>{if(!dialog.open){e.preventDefault();if(!e.target.closest('#viewSelectOverlay'))openViewSelectPopup(e);}});
    summary.addEventListener('keydown',e=>{if(!dialog.open&&['Enter',' '].includes(e.key)&&e.target===summary){e.preventDefault();openViewSelectPopup(e);}});
    const option = document.createElement('option');option.value='positions';option.textContent='Lücken aus den Kästchen';$('taskFormat').append(option);
    $('controlsArea').addEventListener('change',e=>{
      if(e.target.closest('#positionEditor'))return;
      if(!supported.has(mode()))return;
      if(e.target.id==='taskFormat'&&usesCustom(mode())) {
        draft=config();const f=e.target.value;
        if(['standard','faktor','operator'].includes(f)){
          draft.resultQuery=f==='standard';draft.numbers.forEach(n=>n.query=f==='faktor');draft.operators.forEach(o=>o.query=f==='operator');commit();
        }
      } else if(e.target.id==='chainLength'&&usesCustom(mode())){draft=config();resize(e.target.value==='mixed'?10:Number(e.target.value),e.target.value==='mixed');}
      else if(e.target.tagName!=='INPUT') refresh();
      else {const errors=B.validate(config());message(errors.map(x=>x.message).join(' '));}
    });
    document.addEventListener('click',e=>{if(e.target.closest('.row-chip'))setTimeout(refresh,0);});
    const reset=window.resetSelectedModeSettings;window.resetSelectedModeSettings=function(){reset();refresh();};
    refresh();
  }
  window.MathePositions={usesCustom,generate,config,refresh,openSettings,families};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
