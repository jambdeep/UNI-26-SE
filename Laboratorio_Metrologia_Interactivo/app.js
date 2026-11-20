'use strict';
// Laboratorio de medición: modelo educativo ideal, sin pretensión de simulación SPICE o calibración.
const $ = (id) => document.getElementById(id);
const fmt = (n, digits=3) => Number(n).toFixed(digits);
const circuit = { source: 12, r1: 1000, r2: 2000, on: true, mode: 'V', red: 'B', black: 'C', target: 'R1' };
const measurements = [];
let lastMeasurement = null;
let toastTimer;
let currentBench = 'A';
let currentReading = 0;
let scenarioIndex = 0;
const reference = 5.00;
const benches = {
 A: { readings:[5.00,5.01,4.99,5.00,5.00], conclusion:'El equipo A tiene poca dispersión y un promedio prácticamente igual a 5.00 V. Bajo la hipótesis de una referencia confiable, muestra buena precisión y bajo sesgo aparente. Esto no constituye por sí solo una calibración.' },
 B: { readings:[5.48,5.49,5.50,5.49,5.48], conclusion:'El equipo B muestra lecturas muy agrupadas (buena precisión o repetibilidad), pero su promedio está lejos de 5.00 V (sesgo positivo elevado respecto a la referencia asignada). Preciso no equivale a exacto.' },
 C: { readings:[4.65,5.34,4.80,5.22,4.99], conclusion:'El equipo C tiene lecturas muy dispersas: baja precisión. Su promedio puede acercarse a la referencia aunque las lecturas individuales se aparten bastante. Un promedio cercano no prueba que cada lectura sea exacta.' }
};
const scenarios = [
 { label:'CASO 01 · CONEXIÓN', title:'Un voltaje inesperado', text:'Un circuito serie debería mostrar 8.00 V en R₂. Una persona afirma que la resistencia está dañada porque obtuvo −8.00 V.', data:'Dato: entre B y C se esperan +8.00 V; entre C y B se lee −8.00 V.', solution:'La inversión de las puntas cambia la polaridad de la lectura, no la magnitud real del voltaje. Antes de declarar una falla, hay que verificar dónde están conectadas las puntas y el signo mostrado. El circuito puede encontrarse en buen estado.' },
 { label:'CASO 02 · COMPONENTE', title:'El divisor ya no divide igual', text:'En la configuración de 12 V, R₁ = 1 kΩ y R₂ = 2 kΩ, el valor esperado en R₂ es 8 V. Ahora R₂ cambia a 3.3 kΩ.', data:'Cálculo nuevo: I = 12 V / 4.3 kΩ ≈ 2.791 mA; V₂ ≈ 9.209 V.', solution:'Cambiar R₂ modifica tanto la corriente como la fracción de voltaje en cada resistencia. Un resultado distinto de 8 V no implica por sí solo un instrumento defectuoso. Verifica los valores nominales y reales de los componentes y contrasta con el modelo de circuito.' },
 { label:'CASO 03 · SESGO', title:'Cinco lecturas casi idénticas', text:'Un multímetro siempre marca alrededor de 5.49 V al medir una referencia asignada de 5.00 V.', data:'Equipo B: 5.48, 5.49, 5.50, 5.49, 5.48 V.', solution:'La dispersión es pequeña (buena precisión), pero existe un sesgo respecto a 5.00 V. La exactitud no se establece solo por la repetibilidad. Una calibración real requiere un procedimiento documentado, un patrón apropiado, incertidumbre y trazabilidad metrológica.' }
];
function toast(message){ const el=$('toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),3600); }
function circuitValues(){ const i = (circuit.on ? circuit.source : 0)/(circuit.r1+circuit.r2); return {i, v1:i*circuit.r1, v2:i*circuit.r2, a:circuit.on ? circuit.source:0, b:i*circuit.r2,c:0}; }
const nodeCoords = {A:{x:120,y:90}, B:{x:460,y:90}, C:{x:460,y:295}};
const resistorAnchors = {R1:{box:{x:152,y:54,w:140,h:72}}, R2:{box:{x:425,y:138,w:70,h:120}}};
function setVisibility(id, show){ $(id).setAttribute('visibility', show ? 'visible' : 'hidden'); }
function setAttrs(id, attrs){ const el=$(id); Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k, v)); }
function updateMeasurementOverlay(result){
 setVisibility('voltageOverlay', false);
 setVisibility('resistanceOverlay', false);
 setVisibility('componentHalo', false);
 $('ammeterInline').classList.remove('active-meter');
 $('wireBottomRight').classList.remove('active-branch');
 $('wireBottomLeft').classList.remove('active-branch');
 $('inlineMeterLabel').textContent='A';
 if(circuit.mode==='V'){
  const r=circuit.red, b=circuit.black;
  let d='', bx=290, by=50, cx=290, cy=28;
  if((r==='A' && b==='B') || (r==='B' && b==='A')){
   d='M120 90 V23 H460 V90'; bx=340; by=23; cx=340; cy=62;
  } else if((r==='B' && b==='C') || (r==='C' && b==='B')){
   d='M460 90 H575 V295 H460'; bx=575; by=192.5; cx=570; cy=66;
  } else if((r==='A' && b==='C') || (r==='C' && b==='A')){
   d='M120 90 H78 V295 H460'; bx=78; by=192.5; cx=78; cy=66;
  } else {
   d=`M${nodeCoords[r].x} ${nodeCoords[r].y} L${nodeCoords[b].x} ${nodeCoords[b].y}`; bx=(nodeCoords[r].x+nodeCoords[b].x)/2; by=(nodeCoords[r].y+nodeCoords[b].y)/2; cx=bx; cy=Math.min(nodeCoords[r].y,nodeCoords[b].y)-20;
  }
  setAttrs('voltageLead',{d});
  setAttrs('voltageBadge',{cx:bx,cy:by,r:18});
  setAttrs('voltageBadgeText',{x:bx,y:by+6});
  $('voltageBadgeText').textContent='V';
  setAttrs('voltageCaption',{x:cx,y:cy});
  $('voltageCaption').textContent='V en paralelo';
  setVisibility('voltageOverlay', true);
 } else if(circuit.mode==='A'){
  $('ammeterInline').classList.add('active-meter');
  $('wireBottomRight').classList.add('active-branch');
  $('wireBottomLeft').classList.add('active-branch');
  $('inlineMeterLabel').textContent='A';
 } else if(circuit.mode==='R'){
  let d='', bx=222, by=50, cx=222, cy=28;
  const box = resistorAnchors[circuit.target].box;
  if(circuit.target==='R1'){
   d='M170 90 V22 H275 V90'; bx=222; by=22; cx=325; cy=25;
  } else {
   d='M460 150 H580 V245 H460'; bx=580; by=198; cx=577; cy=128;
  }
  setAttrs('resistanceLead',{d});
  setAttrs('resistanceBadge',{cx:bx,cy:by,r:18});
  setAttrs('resistanceBadgeText',{x:bx,y:by+6});
  $('resistanceBadgeText').textContent='Ω';
  setAttrs('resistanceCaption',{x:cx,y:cy});
  $('resistanceCaption').textContent='Ω · componente aislado';
  setAttrs('componentHighlight',{x:box.x,y:box.y,width:box.w,height:box.h});
  setVisibility('resistanceOverlay', true);
  setVisibility('componentHalo', true);
 }
 if(!circuit.on){ $('baseCircuit').classList.add('circuit-off'); } else { $('baseCircuit').classList.remove('circuit-off'); }
 if(circuit.mode==='R' && circuit.on){ $('resistanceCaption').textContent='apaga la fuente antes de medir Ω'; }
 if(circuit.mode==='A' && !circuit.on){ $('inlineMeterLabel').textContent='0'; }
}
function updateCircuit(){
 const {i,v1,v2}=circuitValues();
 $('svgSource').textContent=`${circuit.source} V`;
 $('svgR1').textContent=`${circuit.r1>=1000 ? fmt(circuit.r1/1000, circuit.r1%1000===0?0:1)+' kΩ' : circuit.r1+' Ω'}`;
 $('svgR2').textContent=`${circuit.r2>=1000 ? fmt(circuit.r2/1000, circuit.r2%1000===0?0:1)+' kΩ' : circuit.r2+' Ω'}`;
 $('svgCurrent').textContent=`I = ${fmt(i*1000,2)} mA`;
 $('theoryI').textContent=`${fmt(i*1000)} mA`;
 $('theoryV1').textContent=`${fmt(v1)} V`;
 $('theoryV2').textContent=`${fmt(v2)} V`;
 $('probeControls').hidden=circuit.mode!=='V';
 $('resistanceControls').hidden=circuit.mode!=='R';
 $('meterMode').textContent=({V:'V⎓ · Voltaje continuo',A:'A⎓ · Corriente continua',R:'Ω · Resistencia'}[circuit.mode]);
 document.querySelectorAll('.node').forEach(n=>n.classList.toggle('selected', circuit.mode==='V' && [circuit.red,circuit.black].includes(n.dataset.node)));
 let result = null;
 if(circuit.mode==='V'){
  const voltages={A:circuitValues().a,B:circuitValues().b,C:0};
  if(circuit.red===circuit.black) result={value:0,unit:'V',status:'Las dos puntas están en el mismo nodo: la diferencia de potencial es 0 V.',valid:false,connection:`${circuit.red}–${circuit.black}`};
  else result={value:voltages[circuit.red]-voltages[circuit.black],unit:'V',status:`Voltímetro en paralelo entre ${circuit.red} (+) y ${circuit.black} (COM).`,valid:true,connection:`${circuit.red} (+) y ${circuit.black} (COM)`};
 } else if(circuit.mode==='A'){
  result={value:i*1000,unit:'mA',status:circuit.on?'Amperímetro insertado en serie en la rama inferior; el circuito permanece cerrado.':'Fuente apagada: la corriente del modelo ideal es 0 mA.',valid:circuit.on,connection:'Amperímetro en serie, rama inferior'};
 } else {
  result=circuit.on ? {value:null,unit:'Ω',status:'¡No medir resistencia con el circuito energizado! Apaga la fuente y aísla el componente.',valid:false,connection:'—'} : {value:circuit.target==='R1'?circuit.r1:circuit.r2,unit:'Ω',status:`Medición conceptual de ${circuit.target} en paralelo, con fuente apagada y componente aislado.`,valid:true,connection:`${circuit.target}, componente aislado`};
 }
 updateMeasurementOverlay(result);
 $('meterReading').textContent=result.value===null?'Err':circuit.mode==='R'?fmt(result.value,0):fmt(result.value,2);
 $('meterUnit').textContent=result.unit;
 $('meterInfo').textContent=circuit.on?'Fuente encendida':'Fuente apagada';
 $('meterStatus').textContent=result.status;
 $('meterStatus').classList.toggle('error',result.value===null);
 lastMeasurement={...result,mode:circuit.mode};
}
function selectNode(node){
 if(circuit.mode!=='V'){toast('Elige V⎓ para seleccionar nodos del circuito.');return;}
 circuit.red=node; $('redProbe').value=node;updateCircuit();toast(`Punta roja colocada en ${node}. Ajusta la negra para completar la medición.`);
}
function registerMeasurement(){
 if(!lastMeasurement || !lastMeasurement.valid || lastMeasurement.value===null){toast('Revisa el modo y la conexión antes de registrar una medición.');return;}
 const labels={V:'Voltaje DC',A:'Corriente DC',R:'Resistencia'};
 measurements.push({magnitude:labels[lastMeasurement.mode], value: lastMeasurement.value,unit:lastMeasurement.unit, range: lastMeasurement.mode==='R'?'Ω (automático, conceptual)':lastMeasurement.mode==='A'?'A⎓ (mA, automático)':'V⎓ (automático)', connection:lastMeasurement.connection});
 renderMeasurements();toast(`Medición #${measurements.length} registrada. Consulta «Mi bitácora».`);
}
function renderMeasurements(){
 const tbody=$('measurementTable');tbody.replaceChildren();
 if(!measurements.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=4;td.textContent='Todavía no hay mediciones. Regresa a la estación 2.';tr.append(td);tbody.append(tr);return;}
 measurements.forEach(m=>{const tr=document.createElement('tr');[m.magnitude,fmt(m.value,m.unit==='Ω'?0:2)+' '+m.unit,m.range,m.connection].forEach(x=>{const td=document.createElement('td');td.textContent=x;tr.append(td);});tbody.append(tr);});
}
function benchStats(readings){const n=readings.length, avg=readings.reduce((a,b)=>a+b,0)/n,sd=Math.sqrt(readings.reduce((s,x)=>s+(x-avg)**2,0)/(n-1));return {avg,sd,bias:avg-reference,err:100*(avg-reference)/reference};}
function svgEl(tag, attributes={}, value=''){
 const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
 Object.entries(attributes).forEach(([k,v])=>el.setAttribute(k,String(v)));
 if(value!==undefined && value!==null)el.textContent=value;
 return el;
}
function renderReadingChart(values){
 const chart=$('readingChart');chart.replaceChildren();
 const scale=$('chartScale').value;
 const minValue=Math.min(...values,reference),maxValue=Math.max(...values,reference);
 // Each detailed chart gets visible Y-axis bounds and a nonzero margin.
 const spread=Math.max(maxValue-minValue,.02);
 const margin=scale==='detail'?Math.max(spread*.24,.01):0;
 const minY=scale==='detail'?Math.floor((minValue-margin)*100)/100:4.4;
 const maxY=scale==='detail'?Math.ceil((maxValue+margin)*100)/100:5.6;
 const svg=svgEl('svg',{viewBox:'0 0 640 310',role:'img','aria-label':`Serie de cinco lecturas del equipo ${currentBench}. Eje Y entre ${fmt(minY,2)} y ${fmt(maxY,2)} voltios. Referencia 5.00 V.`});
 const left=72,right=610,top=39,bottom=260;
 const px=i=>left+42+i*(right-left-84)/4;
 const py=v=>bottom-(v-minY)/(maxY-minY)*(bottom-top);
 for(let j=0;j<=4;j++){
  const val=minY+(maxY-minY)*j/4,y=py(val);
  svg.append(svgEl('line',{x1:left,y1:y,x2:right,y2:y,stroke:'#cbd8e2','stroke-dasharray':j===0?'0':'4 5','stroke-width':'1'}));
  svg.append(svgEl('text',{x:left-12,y:y+5,'text-anchor':'end',class:'axis-value'},fmt(val,2)));
 }
 svg.append(svgEl('text',{x:17,y:25,class:'axis-title'},'Voltios (V)'));
 const refY=py(reference);
 svg.append(svgEl('line',{x1:left,y1:refY,x2:right,y2:refY,stroke:'#c47d20','stroke-width':'2.5','stroke-dasharray':'8 5'}));
 const pts=values.map((v,i)=>`${px(i)},${py(v)}`).join(' ');
 svg.append(svgEl('polyline',{points:pts,fill:'none',stroke:'#087e8b','stroke-width':'3.5','stroke-linejoin':'round','stroke-linecap':'round'}));
 values.forEach((val,i)=>{
  const x=px(i),y=py(val);
  svg.append(svgEl('circle',{cx:x,cy:y,r:6,fill:'#087e8b',stroke:'#fff','stroke-width':'2'}));
  // Values float just above the point except near the top of the plot.
  const nearTop=y<top+23;
  svg.append(svgEl('text',{x,y:nearTop?y+22:y-13,'text-anchor':'middle',class:'point-value'},fmt(val,2)));
  svg.append(svgEl('text',{x,y:bottom+25,'text-anchor':'middle',class:'axis-value'},`#${i+1}`));
 });
 svg.append(svgEl('text',{x:(left+right)/2,y:304,'text-anchor':'middle',class:'axis-title'},'Número de lectura'));
 chart.append(svg);
 $('scaleNote').textContent=scale==='detail'
  ?`Escala ampliada del equipo ${currentBench}: ${fmt(minY,2)} a ${fmt(maxY,2)} V. La ampliación facilita apreciar las variaciones; compara también con la escala general.`
  :'Escala general idéntica para A, B y C: 4.40 a 5.60 V. Úsala para comparar la dispersión y el sesgo entre equipos.';
}
function renderFormulaBreakdown(values,stats){
 const n=values.length,avg=stats.avg;
 const squares=values.map(v=>(v-avg)**2);
 const sumSquares=squares.reduce((a,b)=>a+b,0);
 const lines=[
  ['Promedio aritmético','x̄ = Σxᵢ / n',`x̄ = (${values.map(v=>fmt(v,2)).join(' + ')}) / ${n} = ${fmt(avg,3)} V`],
  ['Sesgo medio respecto a la referencia','b = x̄ − Vref',`b = ${fmt(avg,3)} − ${fmt(reference,2)} = ${stats.bias>=0?'+':''}${fmt(stats.bias,3)} V`],
  ['Desviación estándar muestral','s = √[Σ(xᵢ − x̄)² / (n − 1)]',`s = √[(${values.map(v=>`(${fmt(v,2)} − ${fmt(avg,3)})²`).join(' + ')}) / ${n-1}] = √(${fmt(sumSquares,6)} / ${n-1}) = ${fmt(stats.sd,4)} V`],
  ['Error relativo del promedio (firmado)','Eᵣ = (x̄ − Vref) / Vref × 100 %',`Eᵣ = (${fmt(avg,3)} − ${fmt(reference,2)}) / ${fmt(reference,2)} × 100 = ${stats.err>=0?'+':''}${fmt(stats.err,2)} %`]
 ];
 const target=$('formulaBreakdown');target.replaceChildren();
 lines.forEach(([heading,formula,substitution])=>{
  const block=document.createElement('div');block.className='formula-step';
  const title=document.createElement('h4');title.textContent=heading;
  const eq=document.createElement('div');eq.className='formula-equation';eq.textContent=formula;
  const sub=document.createElement('div');sub.className='formula-substitution';sub.textContent=substitution;
  block.append(title,eq,sub);target.append(block);
 });
}
function renderBench(){
 const obj=benches[currentBench], values=obj.readings, stats=benchStats(values);
 $('benchName').textContent=`DMM · EQUIPO ${currentBench}`;
 $('benchReading').textContent=fmt(values[currentReading],2);$('readingPosition').textContent=currentReading+1;
 $('avgVal').textContent=fmt(stats.avg,3)+' V';$('biasVal').textContent=(stats.bias>=0?'+':'')+fmt(stats.bias,3)+' V';
 $('sdVal').textContent=fmt(stats.sd,3)+' V';$('errVal').textContent=(stats.err>=0?'+':'')+fmt(stats.err,2)+' %';
 document.querySelectorAll('[data-meter]').forEach(btn=>btn.classList.toggle('active',btn.dataset.meter===currentBench));
 const list=$('readingsList');list.replaceChildren();values.forEach((num,i)=>{const div=document.createElement('div');div.className='reading-pill'+(i===currentReading?' active':'');const sm=document.createElement('small');sm.textContent='#'+(i+1);div.append(sm,document.createTextNode(fmt(num,2)+' V'));list.append(div);});
 renderReadingChart(values);
 renderFormulaBreakdown(values,stats);
 $('benchConclusion').textContent=obj.conclusion;$('benchConclusion').hidden=true;document.querySelector('[data-reveal="benchConclusion"]').setAttribute('aria-expanded','false');
}
function renderScenario(){const scenario=scenarios[scenarioIndex];$('scenarioLabel').textContent=scenario.label;$('scenarioTitle').textContent=scenario.title;$('scenarioText').textContent=scenario.text;$('scenarioData').textContent=scenario.data;$('scenarioSolution').textContent=scenario.solution;$('scenarioSolution').hidden=true;$('revealScenario').setAttribute('aria-expanded','false');$('hypothesis').value='';document.querySelectorAll('[data-scenario]').forEach(b=>b.classList.toggle('active',Number(b.dataset.scenario)===scenarioIndex));}
function draftText(){
 const name=$('studentName').value.trim(), instrument=$('instrumentName').value.trim(), check=$('checkNote').value.trim(), reflection=$('reflection').value.trim(), reason=$('finalReason').value.trim(),decision=document.querySelector('input[name="decision"]:checked')?.value||'(sin decisión)';
 const lines=[
 'LABORATORIO VIRTUAL · BORRADOR DE BITÁCORA','Operación de Sistemas Electrónicos | 8.º semestre',`Fecha del registro: ${new Date().toLocaleDateString('es-MX')}`,`Estudiante: ${name||'(sin registrar)'}`,`Instrumento: ${instrument||'(sin registrar)'}`,'',
 'PASO 1 — IDENTIFICACIÓN DEL INSTRUMENTO','Pendiente: fotografía propia con cuatro partes etiquetadas.','',
 'PASO 2 — VERIFICACIÓN PREVIA',check||'(sin registrar)','Pendiente: fotografía de revisión del estado físico, cuando corresponda.','',
 'PASO 3 / 4 — MEDICIONES Y REGISTRO',...(measurements.length?measurements.map((m,i)=>`${i+1}. ${m.magnitude}: ${fmt(m.value,m.unit==='Ω'?0:2)} ${m.unit}; rango/modo: ${m.range}; conexión: ${m.connection}`):['(sin mediciones registradas)']),'Pendiente: imágenes de lectura/contacto y registro escrito a mano, conforme a consigna.','',
 'PASO 5 — REFLEXIÓN PRELIMINAR',reflection||'(sin redactar)','Pendiente: reflexión manuscrita de al menos 80 palabras y su fotografía.','',
 'DICTAMEN',`Decisión: ${decision}`,`Justificación: ${reason||'(sin registrar)'}`,'',
 'ACLARACIÓN: Mediciones y pantallas virtuales: modelos didácticos, no instrumentos calibrados. No acreditan calibración ni trazabilidad real. Este borrador no sustituye el PDF IEO010_E1_[iniciales].pdf ni sus requisitos fotográficos/manuscritos.'
 ];return lines.join('\n');
}
function downloadNotes(){const blob=new Blob([draftText()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='borrador_bitacora_medicion.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('Borrador TXT descargado.');}
function updateWordCount(){const words=$('reflection').value.trim().split(/\s+/).filter(Boolean).length;$('wordCount').textContent=`${words} palabras · ${words>=80?'Alcanza':'No alcanza'} el mínimo solicitado de 80.`;}
function init(){
 for(const [id,key] of [['sourceSelect','source'],['r1Select','r1'],['r2Select','r2']])$(id).addEventListener('change',e=>{circuit[key]=Number(e.target.value);updateCircuit();});
 $('powerSwitch').addEventListener('change',e=>{circuit.on=e.target.checked;updateCircuit();});
 for(const el of document.querySelectorAll('input[name="meterMode"]'))el.addEventListener('change',e=>{circuit.mode=e.target.value;updateCircuit();});
 $('redProbe').addEventListener('change',e=>{circuit.red=e.target.value;updateCircuit();});
 $('blackProbe').addEventListener('change',e=>{circuit.black=e.target.value;updateCircuit();});
 $('resistorTarget').addEventListener('change',e=>{circuit.target=e.target.value;updateCircuit();});
 document.querySelectorAll('.node').forEach(el=>{el.addEventListener('click',()=>selectNode(el.dataset.node));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectNode(el.dataset.node);}});});
 $('currentSpot').addEventListener('click',()=>{document.querySelector('input[name="meterMode"][value="A"]').checked=true;circuit.mode='A';updateCircuit();toast('Amperímetro configurado en serie.');});
 $('currentSpot').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('currentSpot').click();}});
 $('takeMeasurement').addEventListener('click',registerMeasurement);
 document.querySelectorAll('[data-meter]').forEach(b=>b.addEventListener('click',()=>{currentBench=b.dataset.meter;currentReading=0;renderBench();}));
 $('chartScale').addEventListener('change',()=>renderReadingChart(benches[currentBench].readings));
 $('nextReading').addEventListener('click',()=>{currentReading=(currentReading+1)%5;renderBench();});
 $('resetReading').addEventListener('click',()=>{currentReading=0;renderBench();});
 document.querySelectorAll('[data-scenario]').forEach(b=>b.addEventListener('click',()=>{scenarioIndex=Number(b.dataset.scenario);renderScenario();}));
 $('revealScenario').addEventListener('click',()=>{const el=$('scenarioSolution');el.hidden=!el.hidden;$('revealScenario').setAttribute('aria-expanded',String(!el.hidden));});
 document.querySelectorAll('.reveal-trigger').forEach(btn=>btn.addEventListener('click',()=>{const el=$(btn.dataset.reveal);el.hidden=!el.hidden;btn.setAttribute('aria-expanded',String(!el.hidden));}));
 $('teacherToggle').addEventListener('click',()=>{const active=document.body.classList.toggle('teacher-mode');$('teacherToggle').textContent='Modo profesor: '+(active?'activado':'desactivado');$('teacherToggle').setAttribute('aria-pressed',String(active));});
 $('clearMeasurements').addEventListener('click',()=>{measurements.splice(0);renderMeasurements();toast('Registro de mediciones vaciado.');});
 $('reflection').addEventListener('input',updateWordCount);
 $('downloadNotes').addEventListener('click',downloadNotes);
 $('printNotes').addEventListener('click',()=>window.print());
 $('saveDecision').addEventListener('click',()=>{$('saveDecisionMessage').textContent='Dictamen incorporado al borrador; descárgalo desde la estación «Mi bitácora».';toast('Dictamen preparado para descargar.');});
 const nav=[...document.querySelectorAll('#nav a')],sections=[...document.querySelectorAll('main section')];
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(visible)nav.forEach(a=>a.classList.toggle('active',a.dataset.section===visible.target.id));},{rootMargin:'-20% 0px -65% 0px',threshold:[0,.2,.5,1]});sections.forEach(s=>observer.observe(s));}
 updateCircuit();renderBench();renderScenario();renderMeasurements();updateWordCount();
}
document.addEventListener('DOMContentLoaded',init);
