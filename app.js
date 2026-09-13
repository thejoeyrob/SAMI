(() => {
'use strict';
const $=q=>document.querySelector(q), $$=q=>[...document.querySelectorAll(q)];
const LS_KEY='sami.project.v1';
const state={map:null,base:'street',layers:{},activeTool:'select',activeDraw:null,selected:null,photos:[],dirty:false,lastCenter:null,recognition:null,listening:false,history:[],future:[]};
const styles={
  access:{color:'#26e7c8',weight:6,opacity:.9,dashArray:null},
  egress:{color:'#8cff72',weight:6,opacity:.9,dashArray:'12 8'},
  route:{color:'#ffffff',weight:4,opacity:.92,dashArray:'5 7'},
  area:{color:'#19d7de',weight:3,opacity:.9,fillColor:'#19d7de',fillOpacity:.12},
  measure:{color:'#f5f5f5',weight:2,opacity:.95,dashArray:'4 6'},
  service:{color:'#ffb347',weight:5,opacity:.9,dashArray:'8 5'},
  hazard:{color:'#ff6b6b',weight:3,opacity:.95,fillColor:'#ff6b6b',fillOpacity:.15}
};
const SERVICE_COLOURS={electric:'#ff3b30',gas:'#ffd60a',water:'#00a8ff',telecom:'#ff8c42',drainage:'#8e8e93',other:'#d0d0d0'};
const trustedSources=[
 {keys:['railway','rail line','network rail','rail boundary','rail'],org:'Network Rail',title:'Asset Protection & Optimisation — working on or near the railway',url:'https://www.networkrail.co.uk/our-work/looking-after-the-railway/asset-protection-and-optimisation/',desc:'Official Network Rail route for third-party work on or near railway infrastructure.'},
 {keys:['underground','buried service','services','excavat','digging','cable','utility'],org:'HSE',title:'HSG47 — Avoiding danger from underground services',url:'https://www.hse.gov.uk/pubns/books/hsg47.htm',desc:'HSE guidance for planning work, locating buried services and safe excavation.'},
 {keys:['overhead line','power line','ohl','electric line'],org:'HSE',title:'GS6 — Avoiding danger from overhead power lines',url:'https://www.hse.gov.uk/pubns/gs6.htm',desc:'Official HSE guidance for planning and controlling work near overhead power lines.'},
 {keys:['cdm','construction design management','principal designer','principal contractor'],org:'HSE',title:'Construction (Design and Management) Regulations 2015',url:'https://www.hse.gov.uk/construction/cdm/2015/index.htm',desc:'Official HSE CDM 2015 guidance and dutyholder information.'},
 {keys:['lifting','loler','crane','lift plan'],org:'HSE',title:'LOLER — Lifting Operations and Lifting Equipment Regulations',url:'https://www.hse.gov.uk/work-equipment-machinery/loler.htm',desc:'Official HSE information on LOLER and lifting operations.'},
 {keys:['vehicle','traffic','workplace transport','reversing','site access'],org:'HSE',title:'Workplace transport safety',url:'https://www.hse.gov.uk/workplacetransport/index.htm',desc:'Official HSE workplace transport guidance.'},
 {keys:['flood','flood zone','surface water'],org:'GOV.UK / Environment Agency',title:'Flood map for planning',url:'https://flood-map-for-planning.service.gov.uk/',desc:'Official flood risk information for planning in England.'}
];

function init(){
  const street=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'© OpenStreetMap contributors'});
  const satellite=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,attribution:'Tiles © Esri'});
  state.map=L.map('map',{zoomControl:false,layers:[street],preferCanvas:true}).setView([54.5,-3.5],6);
  state.layers={street,satellite,features:L.featureGroup().addTo(state.map)};
  L.control.zoom({position:'bottomright'}).addTo(state.map);
  state.map.on('mousemove click',e=>{state.lastCenter=e.latlng;$('#coordReadout').text(`${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`)});
  state.map.on(L.Draw.Event.CREATED,onDrawCreated);
  state.map.on('draw:edited draw:deleted',()=>{snapshot(); markDirty(); refreshProjectDrawerIfOpen();});
  bindUI(); loadProject();
  setTimeout(()=>{ $('#splash').style.opacity='0'; setTimeout(()=>{$('#splash').remove();$('#app').setAttribute('aria-hidden','false');state.map.invalidateSize();},450);},850);
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
  setTimeout(()=>snapshot(true),500);
}

function bindUI(){
  $('#projectName').addEventListener('input',()=>{markDirty();saveProjectDebounced();});
  $('#homeBtn').onclick=()=>openDrawer('project'); $('#projectBtn').onclick=()=>openDrawer('project'); $('#layersBtn').onclick=()=>openDrawer('layers'); $('#searchBtn').onclick=()=>openDrawer('search'); $('#exportBtn').onclick=()=>openExport();
  $('#closeDrawer').onclick=closeDrawer; $('#closeSami').onclick=()=>$('#samiPanel').classList.remove('open');
  $('#locateBtn').onclick=locate; $('#fitBtn').onclick=fitProject; $('#northBtn').onclick=()=>state.map.setBearing?.(0);
  $$('.tool').forEach(b=>b.onclick=()=>activateTool(b.dataset.tool));
  $('#sendBtn').onclick=sendAsk; $('#askInput').addEventListener('keydown',e=>{if(e.key==='Enter')sendAsk();}); $('#micBtn').onclick=toggleVoice;
  $('#photoInput').onchange=handlePhoto;
  $('#modalClose').onclick=closeModal; $('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){cancelDraw();closeDrawer();}});
}

function activateTool(tool){
  cancelDraw(); state.activeTool=tool; $$('.tool').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool));
  if(tool==='select'){ enableEdit(); return; }
  disableEdit();
  if(['access','egress','route','measure','service'].includes(tool)) startPolyline(tool);
  else if(['area','hazard'].includes(tool)) startPolygon(tool);
  else if(tool==='note') addNoteAtCenter();
  else if(tool==='photo') $('#photoInput').click();
}
function startPolyline(type){
  const opts={shapeOptions:{...styles[type]}};
  if(type==='service'){
    const service=prompt('Service type: electric, gas, water, telecom, drainage or other','electric')||'other';
    state.pendingService=service.toLowerCase(); opts.shapeOptions.color=SERVICE_COLOURS[state.pendingService]||SERVICE_COLOURS.other;
  }
  state.activeDraw=new L.Draw.Polyline(state.map,opts); state.activeDraw.enable(); toast(`${labelType(type)}: tap points on the map. Finish with the final-point control.`);
}
function startPolygon(type){state.activeDraw=new L.Draw.Polygon(state.map,{shapeOptions:{...styles[type]},allowIntersection:false,showArea:true});state.activeDraw.enable();toast(`${labelType(type)}: tap around the boundary, then close the shape.`);}
function cancelDraw(){if(state.activeDraw){try{state.activeDraw.disable();}catch{} state.activeDraw=null;} disableEdit();}
let editHandler=null; function enableEdit(){if(!editHandler)editHandler=new L.EditToolbar.Edit(state.map,{featureGroup:state.layers.features});try{editHandler.enable();}catch{}} function disableEdit(){if(editHandler){try{editHandler.disable();}catch{}}}

function onDrawCreated(e){
  const layer=e.layer, type=state.activeTool;
  layer.samiMeta={type,label:labelType(type),created:new Date().toISOString()};
  if(type==='service'){layer.samiMeta.serviceType=state.pendingService||'other';layer.setStyle({color:SERVICE_COLOURS[layer.samiMeta.serviceType]||SERVICE_COLOURS.other,weight:5,dashArray:'8 5'});}
  if(type==='measure'){
    const d=polylineDistance(layer.getLatLngs()); layer.samiMeta.distance=d; const mid=middleLatLng(layer.getLatLngs()); const lab=L.marker(mid,{interactive:false,icon:L.divIcon({className:'',html:`<div class="measure-label">${formatDistance(d)}</div>`,iconSize:null})}); lab.samiMeta={type:'measure-label',parentStamp:L.stamp(layer)}; layer._samiLabel=lab; state.layers.features.addLayer(lab);
  }
  bindLayer(layer); state.layers.features.addLayer(layer); snapshot(); markDirty(); activateTool('select'); refreshProjectDrawerIfOpen();
}
function bindLayer(layer){
  layer.on('click',()=>{state.selected=layer;showFeaturePopup(layer)});
  if(layer.setStyle){const t=layer.samiMeta?.type;if(styles[t])layer.setStyle({...styles[t],...(t==='service'?{color:SERVICE_COLOURS[layer.samiMeta.serviceType]||SERVICE_COLOURS.other}:{})});}
}
function showFeaturePopup(layer){
  const m=layer.samiMeta||{}; const center=layer.getLatLng?layer.getLatLng():layer.getBounds().getCenter();
  const extra=m.type==='measure'?`<small>${formatDistance(m.distance||polylineDistance(layer.getLatLngs()))}</small>`:m.serviceType?`<small>Service: ${escapeHtml(m.serviceType)}</small>`:m.text?`<small>${escapeHtml(m.text)}</small>`:'';
  L.popup().setLatLng(center).setContent(`<div class="popup-card"><strong>${escapeHtml(m.label||'Site item')}</strong>${extra}<br><button onclick="window.SAMI_deleteSelected()">Delete</button></div>`).openOn(state.map);
}
window.SAMI_deleteSelected=()=>{if(state.selected){state.layers.features.removeLayer(state.selected);state.selected=null;state.map.closePopup();snapshot();markDirty();}};

function addNoteAtCenter(text){
  const value=text||prompt('Site note',''); if(!value){activateTool('select');return;} const p=state.lastCenter||state.map.getCenter();
  const icon=L.divIcon({className:'',html:'<div class="marker-note">N</div>',iconSize:[31,31],iconAnchor:[15,15]});
  const m=L.marker(p,{icon});m.samiMeta={type:'note',label:'Site note',text:value,created:new Date().toISOString()};bindLayer(m);state.layers.features.addLayer(m);snapshot();markDirty();activateTool('select');toast('Note added to map.');
}
function addHazardMarker(text){const p=state.lastCenter||state.map.getCenter();const icon=L.divIcon({className:'',html:'<div class="marker-hazard">!</div>',iconSize:[32,28],iconAnchor:[16,14]});const m=L.marker(p,{icon});m.samiMeta={type:'hazard-marker',label:'Concern',text:text||'Site concern',created:new Date().toISOString()};bindLayer(m);state.layers.features.addLayer(m);snapshot();markDirty();}
function handlePhoto(ev){const f=ev.target.files?.[0];if(!f){activateTool('select');return;}const reader=new FileReader();reader.onload=()=>{const p=state.lastCenter||state.map.getCenter();const data=reader.result;const icon=L.divIcon({className:'',html:`<div class="marker-photo"><img src="${data}" alt="site photo"></div>`,iconSize:[34,34],iconAnchor:[17,17]});const m=L.marker(p,{icon});m.samiMeta={type:'photo',label:'Site photo',name:f.name,data,created:new Date().toISOString()};bindLayer(m);state.layers.features.addLayer(m);state.photos.push(m);snapshot();markDirty();toast('Photo attached to map.');ev.target.value='';activateTool('select');};reader.readAsDataURL(f);}

function openDrawer(kind){$('#drawer').classList.add('open');$('#drawer').setAttribute('aria-hidden','false');renderDrawer(kind);}
function closeDrawer(){$('#drawer').classList.remove('open');$('#drawer').setAttribute('aria-hidden','true');}
function renderDrawer(kind){
  const box=$('#drawerContent'); const title=$('#drawerTitle');
  if(kind==='project'){title.textContent='Project'; box.innerHTML=projectHTML(); bindProjectDrawer();}
  if(kind==='layers'){title.textContent='Layers & intelligence';box.innerHTML=layersHTML();bindLayersDrawer();}
  if(kind==='search'){title.textContent='Find a site';box.innerHTML=searchHTML();bindSearchDrawer();}
}
function projectHTML(){const c=countTypes();return `
 <div class="section-title">Project summary</div><div class="card"><div class="row between"><span>Mapped items</span><strong class="count">${c.total}</strong></div><div class="subtle" style="margin-top:8px">${c.routes} routes · ${c.areas} areas · ${c.services} services · ${c.notes} notes/photos</div></div>
 <div class="section-title">Site details</div><div class="card"><label class="subtle">Project / site reference</label><input id="siteRef" class="field" placeholder="e.g. Project 2403 / Plot A"><label class="subtle" style="display:block;margin-top:9px">Client / contractor</label><input id="clientName" class="field" placeholder="Organisation"><label class="subtle" style="display:block;margin-top:9px">Site notes</label><textarea id="siteNotes" class="field" rows="4" placeholder="Key constraints, access notes, contacts…"></textarea></div>
 <div class="section-title">Quick actions</div><button class="wide-btn primary" data-quick="access">Draw access route</button><button class="wide-btn" data-quick="egress">Draw egress route</button><button class="wide-btn" data-quick="hazard">Mark concern area</button><button class="wide-btn" id="addPointConcern">Drop concern pin</button>
 <div class="section-title">Ask SAMI</div><div class="card"><label class="switch-row"><span><strong>Spoken responses</strong><div class="subtle">Read SAMI responses aloud when supported</div></span><span class="switch"><input type="checkbox" id="voiceOutput"></span></label><div class="subtle" style="margin-top:8px">Voice commands are handled in-app. Safety-critical information is always presented with a source route for verification.</div></div>
 <div class="section-title">Project data</div><button class="wide-btn" id="saveNow">Save locally</button><button class="wide-btn" id="newProject">New project</button>`;}
function bindProjectDrawer(){const meta=getSavedMeta();['siteRef','clientName','siteNotes'].forEach(id=>{const el=$('#'+id);el.value=meta[id]||'';el.oninput=()=>{meta[id]=el.value;saveMeta(meta);markDirty();}});const vo=$('#voiceOutput');vo.checked=localStorage.getItem('sami.voice.output')==='on';vo.onchange=()=>{localStorage.setItem('sami.voice.output',vo.checked?'on':'off');toast(vo.checked?'Spoken SAMI responses enabled.':'Spoken SAMI responses disabled.');};$$('[data-quick]').forEach(b=>b.onclick=()=>{closeDrawer();activateTool(b.dataset.quick)});$('#addPointConcern').onclick=()=>{const t=prompt('Describe the concern','');if(t)addHazardMarker(t)};$('#saveNow').onclick=()=>saveProject(true);$('#newProject').onclick=()=>{if(confirm('Clear the current local project and start a new one?'))clearProject();};}
function layersHTML(){return `
 <div class="section-title">Base map</div><div class="card"><div class="row"><button class="mini-btn grow" data-base="street">Street</button><button class="mini-btn grow" data-base="satellite">Satellite</button></div></div>
 <div class="section-title">Project layers</div><div class="card">${['access','egress','route','area','measure','service','hazard','hazard-marker','note','photo'].map(t=>`<label class="switch-row"><span>${labelType(t)}</span><span class="switch"><input type="checkbox" data-layer-toggle="${t}" checked></span></label>`).join('')}</div>
 <div class="section-title">Connected intelligence</div><div class="card"><div class="row between"><div><strong>Underground services</strong><div class="subtle">NUAR / utility / project records</div></div><span class="count">CONNECT</span></div></div><div class="card"><div class="row between"><div><strong>Environmental sensitivity</strong><div class="subtle">Flood, ecology, heritage and planning layers</div></div><span class="count">CONNECT</span></div></div><div class="card"><div class="row between"><div><strong>Company GIS / CAD</strong><div class="subtle">WMS/WFS, GeoJSON, DXF/DWG ingestion</div></div><span class="count">CONNECT</span></div></div>
 <div class="subtle">The prototype separates live connectors from manually verified field observations. Production data layers require licensed/API access and provenance controls.</div>`;}
function bindLayersDrawer(){$$('[data-base]').forEach(b=>b.onclick=()=>switchBase(b.dataset.base));$$('[data-layer-toggle]').forEach(ch=>ch.onchange=()=>toggleType(ch.dataset.layerToggle,ch.checked));}
function searchHTML(){return `<div class="section-title">Search location</div><div class="card"><div class="row"><input id="placeQuery" class="field grow" placeholder="Address, postcode or place"><button id="placeGo" class="mini-btn">Find</button></div><div id="placeResults" style="margin-top:10px"></div></div><button class="wide-btn primary" id="useLocSearch">Use current location</button><div class="section-title">Coordinates</div><div class="card"><div class="row"><input id="latInput" class="field" placeholder="Latitude"><input id="lngInput" class="field" placeholder="Longitude"></div><button id="goCoords" class="wide-btn">Go to coordinates</button></div><div class="subtle">Production: add what3words, OS Places / UPRN and enterprise gazetteer connectors.</div>`;}
function bindSearchDrawer(){$('#placeGo').onclick=findPlace;$('#placeQuery').addEventListener('keydown',e=>{if(e.key==='Enter')findPlace()});$('#useLocSearch').onclick=locate;$('#goCoords').onclick=()=>{const a=parseFloat($('#latInput').value),b=parseFloat($('#lngInput').value);if(Number.isFinite(a)&&Number.isFinite(b))state.map.setView([a,b],18);};}
async function findPlace(){const q=$('#placeQuery').value.trim();if(!q)return;const out=$('#placeResults');out.innerHTML='<div class="subtle">Searching…</div>';try{const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`,{headers:{'Accept':'application/json'}});const data=await r.json();out.innerHTML=data.map((x,i)=>`<button class="wide-btn" data-place="${i}">${escapeHtml(x.display_name)}</button>`).join('')||'<div class="subtle">No matches found.</div>';$$('[data-place]').forEach(b=>b.onclick=()=>{const x=data[+b.dataset.place];state.map.setView([+x.lat,+x.lon],18);closeDrawer();});}catch{out.innerHTML='<div class="subtle">Search service unavailable. Enter coordinates or use current location.</div>';}}

function switchBase(which){if(which===state.base)return;state.map.removeLayer(state.layers[state.base]);state.layers[which].addTo(state.map);state.base=which;$('#sourceChip').innerHTML=`<span class="status-light"></span>${which==='satellite'?'Satellite · Esri imagery':'Base map · OpenStreetMap'}`;}
function toggleType(type,on){state.layers.features.eachLayer(l=>{if(l.samiMeta?.type===type){if(on){if(!state.map.hasLayer(l))l.addTo(state.map)}else{if(state.map.hasLayer(l))state.map.removeLayer(l)}}});}
function locate(){if(!navigator.geolocation){toast('Location is not available in this browser.');return;}toast('Finding your location…');navigator.geolocation.getCurrentPosition(p=>{const ll=[p.coords.latitude,p.coords.longitude];state.map.setView(ll,18);const icon=L.divIcon({className:'',html:'<div class="marker-pin"></div>',iconSize:[30,30],iconAnchor:[15,28]});const m=L.marker(ll,{icon}).addTo(state.map).bindPopup('Current location');setTimeout(()=>state.map.removeLayer(m),12000);closeDrawer();},()=>toast('Location permission was not granted.'),{enableHighAccuracy:true,timeout:10000});}
function fitProject(){const ls=state.layers.features.getLayers().filter(l=>state.map.hasLayer(l));if(!ls.length){state.map.setZoom(Math.max(state.map.getZoom(),15));return;}const g=L.featureGroup(ls);try{state.map.fitBounds(g.getBounds().pad(.15),{maxZoom:19});}catch{}}

function sendAsk(){const input=$('#askInput');const q=input.value.trim();if(!q)return;input.value='';addMessage('user',q);$('#samiPanel').classList.add('open');handleCommand(q);}
async function handleCommand(q){const n=q.toLowerCase().trim();
  const source=findTrustedSource(n);
  if(/zoom in/.test(n)){state.map.zoomIn();return samiSay('Zoomed in.');}
  if(/zoom out/.test(n)){state.map.zoomOut();return samiSay('Zoomed out.');}
  if(/my location|current location|where am i/.test(n)){locate();return samiSay('Opening your current location on the map.');}
  if(/fit (the )?(site|plan|project|map)/.test(n)){fitProject();return samiSay('Project fitted to screen.');}
  if(/draw|create|start/.test(n)&&/access/.test(n)){activateTool('access');return samiSay('Access-route drawing is active. Tap the route points on the map.');}
  if(/draw|create|start/.test(n)&&/egress|exit/.test(n)){activateTool('egress');return samiSay('Egress-route drawing is active. Tap the route points on the map.');}
  if(/draw|create|start/.test(n)&&/route|haul road|vehicle path/.test(n)){activateTool('route');return samiSay('Route drawing is active.');}
  if(/measure|distance/.test(n)){activateTool('measure');return samiSay('Measure mode is active. Tap along the distance you want to check.');}
  if(/service line|utility line|underground line/.test(n)){activateTool('service');return samiSay('Service-line drawing is active. Choose the service type, then map its known or observed route.');}
  let m=n.match(/(?:add|create|record|make) (?:a )?note(?: saying| that|:)?\s*(.*)/); if(m&&m[1]){addNoteAtCenter(q.substring(q.toLowerCase().indexOf(m[1])));return samiSay('I added that note at the current map position.');}
  m=n.match(/(?:mark|add|record) (?:a )?(?:hazard|concern)(?: saying| that|:)?\s*(.*)/); if(m){addHazardMarker(m[1]||'Site concern');return samiSay('Concern pin added at the current map position.');}
  if(/export/.test(n)&&/dxf/.test(n)){exportDXF();return samiSay('DXF export created.');}
  if(/export/.test(n)&&/geojson/.test(n)){exportGeoJSON();return samiSay('GeoJSON export created.');}
  if(/export/.test(n)&&/kml/.test(n)){exportKML();return samiSay('KML export created.');}
  if(source){return showSourceAnswer(q,source);}
  if(window.SAMI_CONFIG?.aiEndpoint){try{return await callAI(q);}catch(e){console.error(e)}}
  return showSourceSearch(q);
}
function findTrustedSource(n){let best=null,score=0;for(const s of trustedSources){const sc=s.keys.filter(k=>n.includes(k)).length;if(sc>score){score=sc;best=s}}return best;}
function showSourceAnswer(q,s){addMessage('sami',`I found an authoritative source relevant to that request. For safety-critical information I’m linking the governing/official material rather than generating a distance or rule from memory.`,s);speakOptional(`I found an official ${s.org} source for that. I have linked it on screen.`);}
function showSourceSearch(q){const links=[{org:'HSE',title:'Search HSE for this question',url:`https://www.google.com/search?q=${encodeURIComponent('site:hse.gov.uk '+q)}`,desc:'Restricted search targeting Health and Safety Executive material.'},{org:'GOV.UK',title:'Search GOV.UK for this question',url:`https://www.google.com/search?q=${encodeURIComponent('site:gov.uk '+q)}`,desc:'Restricted search targeting UK Government material.'}];addMessage('sami','I do not have a verified local reference for that exact question yet. Use one of these restricted official-source searches. In the production build, this is where the grounded retrieval service will search, rank and cite official material inside SAMI.',links);}
async function callAI(q){const project=serializeProject(false);const r=await fetch(window.SAMI_CONFIG.aiEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q,project,policy:'official-source-grounded',allowMapActions:true})});if(!r.ok)throw new Error('AI service unavailable');const data=await r.json();if(data.action)executeAIAction(data.action);addMessage('sami',data.answer||'Response received.',data.sources||null);}
function executeAIAction(a){if(a.type==='activateTool'&&a.tool)activateTool(a.tool);if(a.type==='setView'&&a.lat&&a.lng)state.map.setView([a.lat,a.lng],a.zoom||18);}
function addMessage(who,text,sources){const d=document.createElement('div');d.className=`msg ${who}`;let html=`<p>${escapeHtml(text)}</p>`;const arr=Array.isArray(sources)?sources:(sources?[sources]:[]);for(const s of arr)html+=`<a class="source-card" href="${s.url}" target="_blank" rel="noopener"><div class="org">${escapeHtml(s.org||'Official source')}</div><strong>${escapeHtml(s.title||s.url)}</strong><small>${escapeHtml(s.desc||'Open source')}</small></a>`;if(arr.length)html+=`<div class="source-warning">Verify the source content, project-specific requirements and latest revision before relying on it for safety-critical work.</div>`;d.innerHTML=html;$('#samiMessages').appendChild(d);$('#samiMessages').scrollTop=$('#samiMessages').scrollHeight;}
function samiSay(text){addMessage('sami',text);speakOptional(text);}
function speakOptional(text){if(localStorage.getItem('sami.voice.output')!=='on')return;if('speechSynthesis'in window){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(text));}}
function toggleVoice(){
  if(state.listening){try{state.recognition.stop()}catch{}return;}
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){toast('Voice recognition is not supported here. Type the command instead.');return;}
  const r=new SR();state.recognition=r;r.lang='en-GB';r.interimResults=false;r.continuous=false;r.onstart=()=>{state.listening=true;$('#micBtn').classList.add('listening');$('#voiceHint').textContent='Listening…'};r.onend=()=>{state.listening=false;$('#micBtn').classList.remove('listening');$('#voiceHint').textContent='Tap the mic for voice command. Safety-critical guidance is source-linked, not invented.'};r.onerror=()=>toast('Voice command could not be captured.');r.onresult=e=>{const q=e.results[0][0].transcript;$('#askInput').value=q;sendAsk();};r.start();
}

function openExport(){
  showModal('Export project',`<div class="subtle" style="margin-bottom:13px">Exchange formats are generated from mapped geometry. DXF is intended for CAD import; GeoJSON/KML for GIS; CSV for schedules/coordinates. Native DWG/IFC needs a production conversion connector.</div><div class="modal-grid"><button class="wide-btn primary" data-exp="dxf">DXF · CAD</button><button class="wide-btn" data-exp="geojson">GeoJSON · GIS</button><button class="wide-btn" data-exp="kml">KML · mapping</button><button class="wide-btn" data-exp="csv">CSV · schedule</button><button class="wide-btn" data-exp="json">SAMI project backup</button><button class="wide-btn" data-exp="print">Print / PDF</button></div>`);$$('[data-exp]').forEach(b=>b.onclick=()=>{({dxf:exportDXF,geojson:exportGeoJSON,kml:exportKML,csv:exportCSV,json:exportProjectJSON,print:()=>window.print()})[b.dataset.exp]?.();});
}
function exportGeoJSON(){download(`${safeName()}_SAMI.geojson`,JSON.stringify(projectGeoJSON(),null,2),'application/geo+json');}
function projectGeoJSON(includePhotos=false){const features=[];state.layers.features.eachLayer(l=>{if(l.samiMeta?.type==='measure-label')return;const f=layerToFeature(l,includePhotos);if(f)features.push(f)});return{type:'FeatureCollection',name:$('#projectName').value,features};}
function layerToFeature(l,includePhotos=false){const m=safeMeta(l.samiMeta||{},includePhotos);if(l instanceof L.Marker){const p=l.getLatLng();return{type:'Feature',properties:m,geometry:{type:'Point',coordinates:[p.lng,p.lat]}}}if(l instanceof L.Polyline&&! (l instanceof L.Polygon)){return{type:'Feature',properties:m,geometry:{type:'LineString',coordinates:l.getLatLngs().map(p=>[p.lng,p.lat])}}}if(l instanceof L.Polygon){const pts=l.getLatLngs()[0].map(p=>[p.lng,p.lat]);if(pts.length&&JSON.stringify(pts[0])!==JSON.stringify(pts[pts.length-1]))pts.push(pts[0]);return{type:'Feature',properties:m,geometry:{type:'Polygon',coordinates:[pts]}}}return null;}
function exportKML(){const gj=projectGeoJSON();let out=`<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${xml($('#projectName').value)}</name>`;for(const f of gj.features){const n=xml(f.properties.label||f.properties.type||'SAMI item');if(f.geometry.type==='Point')out+=`<Placemark><name>${n}</name><Point><coordinates>${f.geometry.coordinates.join(',')},0</coordinates></Point></Placemark>`;if(f.geometry.type==='LineString')out+=`<Placemark><name>${n}</name><LineString><tessellate>1</tessellate><coordinates>${f.geometry.coordinates.map(c=>`${c[0]},${c[1]},0`).join(' ')}</coordinates></LineString></Placemark>`;if(f.geometry.type==='Polygon')out+=`<Placemark><name>${n}</name><Polygon><outerBoundaryIs><LinearRing><coordinates>${f.geometry.coordinates[0].map(c=>`${c[0]},${c[1]},0`).join(' ')}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>`}out+='</Document></kml>';download(`${safeName()}_SAMI.kml`,out,'application/vnd.google-earth.kml+xml');}
function exportCSV(){let rows=[['type','label','latitude','longitude','detail']];state.layers.features.eachLayer(l=>{if(l.samiMeta?.type==='measure-label')return;const m=l.samiMeta||{};const p=l.getLatLng?l.getLatLng():l.getBounds?.().getCenter();if(p)rows.push([m.type||'',m.label||'',p.lat,p.lng,m.text||m.serviceType||m.distance||'']);});download(`${safeName()}_SAMI.csv`,rows.map(r=>r.map(csv).join(',')).join('\n'),'text/csv');}
function exportDXF(){const gj=projectGeoJSON();const pts=[];gj.features.forEach(f=>{const g=f.geometry;if(g.type==='Point')pts.push(g.coordinates);if(g.type==='LineString')pts.push(...g.coordinates);if(g.type==='Polygon')pts.push(...g.coordinates[0]);});const origin=pts[0]||[0,0];const lat0=origin[1]*Math.PI/180;const xy=c=>[(c[0]-origin[0])*111320*Math.cos(lat0),(c[1]-origin[1])*110540];let d='0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n6\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n';for(const f of gj.features){const g=f.geometry,n=(f.properties.type||'SAMI').toUpperCase().slice(0,30);if(g.type==='Point'){const [x,y]=xy(g.coordinates);d+=`0\nPOINT\n8\n${n}\n10\n${x.toFixed(3)}\n20\n${y.toFixed(3)}\n30\n0\n`;if(f.properties.text||f.properties.label)d+=`0\nTEXT\n8\n${n}\n10\n${(x+1).toFixed(3)}\n20\n${(y+1).toFixed(3)}\n40\n2.5\n1\n${dxfText(f.properties.text||f.properties.label)}\n`;}else{const coords=g.type==='Polygon'?g.coordinates[0]:g.coordinates;d+=`0\nLWPOLYLINE\n8\n${n}\n90\n${coords.length}\n70\n${g.type==='Polygon'?1:0}\n`;coords.forEach(c=>{const [x,y]=xy(c);d+=`10\n${x.toFixed(3)}\n20\n${y.toFixed(3)}\n`;});}}d+='0\nENDSEC\n0\nEOF\n';download(`${safeName()}_SAMI.dxf`,d,'application/dxf');}
function exportProjectJSON(){download(`${safeName()}_SAMI_project.json`,JSON.stringify(serializeProject(true),null,2),'application/json');}

function serializeProject(includePhotos=true){const gj=projectGeoJSON(includePhotos);if(!includePhotos)gj.features.forEach(f=>{if(f.properties.data)delete f.properties.data});return{format:'SAMI-PROJECT-1',name:$('#projectName').value,meta:getSavedMeta(),base:state.base,map:{center:state.map.getCenter(),zoom:state.map.getZoom()},geojson:gj,exported:new Date().toISOString()};}
function saveProject(show=false){try{localStorage.setItem(LS_KEY,JSON.stringify(serializeProject(false)));state.dirty=false;$('#saveState').textContent='Saved locally';if(show)toast('Project saved locally.');}catch{toast('Local storage is full. Export a SAMI project backup.');}}
let saveTimer;function saveProjectDebounced(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveProject(false),550)}
function markDirty(){state.dirty=true;$('#saveState').textContent='Unsaved changes';saveProjectDebounced();}
function loadProject(){const raw=localStorage.getItem(LS_KEY);if(!raw)return;try{const p=JSON.parse(raw);$('#projectName').value=p.name||'Untitled site';if(p.base)switchBase(p.base);if(p.geojson)loadGeoJSON(p.geojson);if(p.map?.center)state.map.setView([p.map.center.lat,p.map.center.lng],p.map.zoom||15);}catch(e){console.warn(e)}}
function loadGeoJSON(gj){L.geoJSON(gj,{pointToLayer:(f,ll)=>{const m=f.properties||{};let icon;if(m.type==='note')icon=L.divIcon({className:'',html:'<div class="marker-note">N</div>',iconSize:[31,31],iconAnchor:[15,15]});else if(m.type==='hazard-marker')icon=L.divIcon({className:'',html:'<div class="marker-hazard">!</div>',iconSize:[32,28],iconAnchor:[16,14]});else icon=L.divIcon({className:'',html:'<div class="marker-pin"></div>',iconSize:[30,30],iconAnchor:[15,28]});return L.marker(ll,{icon});},style:f=>{const m=f.properties||{};return {...(styles[m.type]||{}),...(m.type==='service'?{color:SERVICE_COLOURS[m.serviceType]||SERVICE_COLOURS.other}:{})};},onEachFeature:(f,l)=>{l.samiMeta=f.properties||{};bindLayer(l);state.layers.features.addLayer(l);if(l.samiMeta.type==='measure'){const d=l.samiMeta.distance||polylineDistance(l.getLatLngs());const lab=L.marker(middleLatLng(l.getLatLngs()),{interactive:false,icon:L.divIcon({className:'',html:`<div class="measure-label">${formatDistance(d)}</div>`,iconSize:null})});lab.samiMeta={type:'measure-label'};state.layers.features.addLayer(lab);}}});}
function clearProject(){localStorage.removeItem(LS_KEY);localStorage.removeItem('sami.meta');state.layers.features.clearLayers();$('#projectName').value='Untitled site';state.map.setView([54.5,-3.5],6);closeDrawer();toast('New SAMI project started.');}

function snapshot(initial=false){if(initial){state.history=[JSON.stringify(projectGeoJSON())];return;}const s=JSON.stringify(projectGeoJSON());if(state.history[state.history.length-1]!==s){state.history.push(s);if(state.history.length>30)state.history.shift();state.future=[];}}
function getSavedMeta(){try{return JSON.parse(localStorage.getItem('sami.meta')||'{}')}catch{return{}}}function saveMeta(m){localStorage.setItem('sami.meta',JSON.stringify(m));}
function refreshProjectDrawerIfOpen(){if($('#drawer').classList.contains('open')&&$('#drawerTitle').textContent==='Project')renderDrawer('project');}
function countTypes(){let c={total:0,routes:0,areas:0,services:0,notes:0};state.layers.features.eachLayer(l=>{const t=l.samiMeta?.type;if(!t||t==='measure-label')return;c.total++;if(['access','egress','route'].includes(t))c.routes++;if(['area','hazard'].includes(t))c.areas++;if(t==='service')c.services++;if(['note','photo','hazard-marker'].includes(t))c.notes++;});return c;}
function polylineDistance(ps){let d=0;for(let i=1;i<ps.length;i++)d+=ps[i-1].distanceTo(ps[i]);return d;}function middleLatLng(ps){if(!ps.length)return state.map.getCenter();return ps[Math.floor(ps.length/2)];}function formatDistance(m){return m>=1000?`${(m/1000).toFixed(2)} km`:`${m.toFixed(m<100?1:0)} m`;}
function labelType(t){return({select:'Select',access:'Access route',egress:'Egress route',route:'Site route',area:'Site area',measure:'Measurement',service:'Service line',hazard:'Concern area','hazard-marker':'Concern',note:'Site note',photo:'Site photo','measure-label':'Measurement label'})[t]||t;}
function safeMeta(m,includePhotos=false){const o={};for(const [k,v] of Object.entries(m||{})){if(k==='data'&&!includePhotos)continue;if(['string','number','boolean'].includes(typeof v)||v===null)o[k]=v;}return o;}
function safeName(){return ($('#projectName').value||'SAMI_Project').replace(/[^a-z0-9_-]+/gi,'_').replace(/^_+|_+$/g,'')||'SAMI_Project';}
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);}
function showModal(title,html){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;$('#modal').classList.remove('hidden');}function closeModal(){$('#modal').classList.add('hidden');}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2300);}
function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}function xml(s=''){return escapeHtml(s)}function csv(v){v=String(v??'');return /[",\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v;}function dxfText(s=''){return String(s).replace(/[\r\n]/g,' ').replace(/[^\x20-\x7E]/g,'');}

init();
})();
