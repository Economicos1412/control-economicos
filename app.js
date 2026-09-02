const seedRecords = [
  [121941,'ALTEC','DM45THD','0125JZ1652',3,101,'ORIZABA','2026-03-14','En condiciones de operación'],[109622,'MC','EH100-10','EH100100S2A3231095',3,102,'ORIZABA','2026-03-14','En condiciones de operación'],[118485,'MC','EH100-10','EH100100S2A3232289',3,103,'ORIZABA','2026-03-14','En condiciones de operación'],[108499,'HI RANGER','5FB-50PBRI','39217739',3,104,'ORIZABA','2026-03-14','En condiciones de operación'],[86923,'VERSALIFT','VST2361','GE070007',3,105,'ORIZABA','2026-03-14','En condiciones de operación'],[105887,'ALTEC','AN543','1114-U3614',3,106,'ORIZABA','2026-03-14','En condiciones de operación'],[105061,'ALTEC','DM45BR','1212DV5968',3,107,'ORIZABA','2026-03-14','En condiciones de operación'],[88501,'ALTEC','AN543','0691U0647',2,108,'ORIZABA','2026-03-14','Válvula selectora de controles inferiores/superiores no opera adecuadamente; revisar controles superiores.'],[86952,'VERSALIFT','VST2361','GE070017',3,109,'ORIZABA','2026-03-16','En condiciones de operación'],[108500,'ALTEC','AN543','0997-U1853',3,110,'ORIZABA','2026-03-16','En condiciones de operación'],[93520,'VERSALIFT','V029PI','J9925',3,111,'ORIZABA','2026-03-16','En condiciones de operación'],[122443,'MC','EH100-10','EH100100S2A3257137',2,112,'ORIZABA','2026-03-16','Pistola de mandos de los controles superiores no opera.'],[88612,'TEREX TELELECT','XL4045','2071035230',3,113,'ORIZABA','2026-03-16','En condiciones de operación'],[88502,'ALTEC','AN543','0692-U0938',2,114,'ORIZABA','2026-03-16','Función para bajar brazo superior opera sin oprimir gatillo.'],[87122,'VERSALIFT','1991','J91111',3,115,'ORIZABA','2026-03-16','En condiciones de operación']
].map(([economico,marca,modelo,serie,categoria,folio,area,fecha,observaciones])=>({id:crypto.randomUUID(),economico:String(economico),marca,modelo,serie:String(serie),categoria:String(categoria),folio:String(folio),area,fecha,observaciones}));
const storageKey='control-economicos-records-v1';
const sourceAmounts={86923:'54570.00',88501:'133580.00',108500:'11280.00',105887:'48700.00',105061:'17560.00'};
let records=JSON.parse(localStorage.getItem(storageKey)||'null')||seedRecords, editingId=null, photoRecordId=null, selectedIds=new Set(), viewerScale=1, viewerX=0, viewerY=0, dragStart=null;
records=records.map(record=>({...record,monto:(record.monto==null||record.monto==='')?(sourceAmounts[record.economico]||''):record.monto,estado:record.estado||(/en condiciones/i.test(record.observaciones)?'operativo':'mantenimiento'),mantenimientos:Array.isArray(record.mantenimientos)?record.mantenimientos:[],historialCambios:Array.isArray(record.historialCambios)?record.historialCambios:[]}));
const $=s=>document.querySelector(s), body=$('#recordsBody'), dialog=$('#recordDialog'), form=$('#recordForm');
const esc=v=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const addHistory=(record,titulo,detalle)=>{record.historialCambios=[...(record.historialCambios||[]),{id:crypto.randomUUID(),fecha:new Date().toISOString(),titulo,detalle}]};
const historyValue=(key,value)=>key==='monto'?formatMoney(value):key==='estado'?(value==='operativo'?'En condiciones para trabajar':'En mantenimiento'):String(value??'—');
const save=()=>{localStorage.setItem(storageKey,JSON.stringify(records));if(location.protocol!=='file:')fetch('/api/economicos',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(records)}).then(response=>{if(!response.ok)throw new Error('No se pudo sincronizar')}).catch(()=>toast('Cambios guardados localmente; no se pudo sincronizar con la base de datos.'))};
const formatDate=v=>new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${v}T00:00:00`));
const formatMoney=v=>v===''||v==null?'—':new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(v));
const statusMarkup=r=>r.estado==='operativo'?'<span class="status status-ok">En condiciones para trabajar</span>':`<span class="status status-maintenance">En mantenimiento</span><span class="status-note">${esc(r.observaciones)}</span>`;
function renderFilters(){const options=(arr,selected,label)=>`<option value="">${label}</option>`+[...new Set(arr)].sort().map(v=>`<option ${v===selected?'selected':''}>${esc(v)}</option>`).join('');const formOptions=(arr,sorter)=>`<option value="" disabled>Selecciona una opción</option>`+[...new Set(arr)].sort(sorter).map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('')+`<option value="__new__">Agregar otro…</option>`;$('#areaFilter').innerHTML=options(records.map(r=>r.area),$('#areaFilter').value,'Todas las áreas');$('#categoryFilter').innerHTML=options(records.map(r=>r.categoria),$('#categoryFilter').value,'Todas las categorías');$('#unitSelect').innerHTML=formOptions(records.map(r=>r.marca));$('#modelSelect').innerHTML=formOptions(records.map(r=>r.modelo));$('#categorySelect').innerHTML='<option value="" disabled>Selecciona una categoría</option><option value="1">1</option><option value="2">2</option><option value="3">3</option>'}
function render(){const q=$('#searchInput').value.trim().toLowerCase(),area=$('#areaFilter').value,cat=$('#categoryFilter').value;const visible=records.filter(r=>!q||[r.economico,r.marca,r.modelo,r.serie].join(' ').toLowerCase().includes(q)).filter(r=>!area||r.area===area).filter(r=>!cat||r.categoria===cat);body.innerHTML=visible.map(r=>`<tr><td data-label="Seleccionar"><input class="record-check" type="checkbox" data-id="${r.id}" ${selectedIds.has(r.id)?'checked':''} aria-label="Seleccionar económico ${esc(r.economico)}" /></td><td class="unit" data-label="Económico">${esc(r.economico)}</td><td class="unit" data-label="Unidad">${esc(r.marca)}<small>${esc(r.modelo)}</small></td><td data-label="Serie">${esc(r.serie)}</td><td data-label="Categoría"><span class="category">${esc(r.categoria)}</span></td><td data-label="Folio">${esc(r.folio)}</td><td data-label="Monto">${formatMoney(r.monto)}</td><td data-label="Área">${esc(r.area)}</td><td data-label="Prueba">${formatDate(r.fecha)}</td><td class="observation" data-label="Estado">${statusMarkup(r)}</td><td data-label="Acciones"><button class="edit-button" data-action="history" data-id="${r.id}">Historial</button> <button class="edit-button" data-action="photos" data-id="${r.id}">Ficha / fotos (${r.photos?.length||0})</button> <button class="edit-button" data-action="edit" data-id="${r.id}">Editar</button> <button class="edit-button" data-action="delete" data-id="${r.id}" style="color:#b63735">Eliminar</button></td></tr>`).join('');$('#resultsLabel').textContent=`${visible.length} de ${records.length} registros`;$('#emptyState').hidden=visible.length!==0;$('#totalMetric').textContent=records.length;$('#areasMetric').textContent=new Set(records.map(r=>r.area)).size;$('#attentionMetric').textContent=records.filter(r=>r.estado==='mantenimiento').length;$('#selectAll').checked=visible.length>0&&visible.every(r=>selectedIds.has(r.id));$('#selectAll').indeterminate=visible.some(r=>selectedIds.has(r.id))&&!$('#selectAll').checked;$('#deleteSelected').disabled=selectedIds.size===0;$('#deleteSelected').textContent=selectedIds.size?`Eliminar seleccionados (${selectedIds.size})`:'Eliminar seleccionados'}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2500)}
function toggleOther(select){const input=$(`#${select.id.replace('Select','Other')}`),isNew=select.value==='__new__';input.hidden=!isNew;input.required=isNew;if(!isNew)input.value=''}
function toggleObservations(){const maintenance=$('#statusSelect').value==='mantenimiento',field=$('#observationsField'),input=form.elements.observaciones;field.hidden=!maintenance;input.required=maintenance;if(!maintenance)input.value=''}
function openForm(record){editingId=record?.id||null;form.reset();['#unitOther','#modelOther'].forEach(s=>$(s).hidden=true);$('#dialogEyebrow').textContent=record?'ACTUALIZAR REGISTRO':'NUEVO REGISTRO';$('#dialogTitle').textContent=record?'Editar económico':'Agregar económico';if(record)Object.entries(record).forEach(([key,value])=>{if(form.elements[key])form.elements[key].value=value});toggleObservations();dialog.showModal()}
$('#newButton').onclick=()=>openForm();$('#closeDialog').onclick=$('#cancelButton').onclick=()=>dialog.close();
form.onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form));for(const [field,other] of [['marca','marcaOther'],['modelo','modeloOther']]){if(data[field]==='__new__')data[field]=data[other].trim();delete data[other]}if(data.estado==='operativo')data.observaciones='En condiciones para trabajar';const duplicate=records.find(r=>r.economico===data.economico&&r.id!==editingId);if(duplicate){toast('Ese número económico ya está registrado.');return}if(editingId)records=records.map(r=>{if(r.id!==editingId)return r;const changed=Object.keys(data).filter(key=>String(r[key]??'')!==String(data[key]??''));const updated={...r,...data,id:editingId};if(changed.length){const labels={economico:'Número económico',marca:'Unidad / marca',modelo:'Modelo',serie:'Número de serie',categoria:'Categoría',folio:'Folio',monto:'Monto',area:'Área',fecha:'Fecha de prueba',estado:'Estado',observaciones:'Observaciones'};const detail=changed.map(key=>`${labels[key]||key}: ${historyValue(key,r[key])} → ${historyValue(key,data[key])}`).join(' · ');addHistory(updated,'Datos actualizados',detail)}return updated});else{const record={...data,id:crypto.randomUUID(),historialCambios:[]};addHistory(record,'Económico registrado','Se creó el expediente de la unidad.');records.unshift(record)}save();renderFilters();render();dialog.close();toast(editingId?'Registro actualizado.':'Económico agregado.');};
['#unitSelect','#modelSelect'].forEach(s=>$(s).addEventListener('change',e=>toggleOther(e.target)));
$('#statusSelect').onchange=toggleObservations;
function openPhotos(record){photoRecordId=record.id;$('#photoTitle').textContent=`Económico ${record.economico}`;$('#photoData').innerHTML=`<div><span>Unidad / marca</span><strong>${esc(record.marca)}</strong></div><div><span>Modelo</span><strong>${esc(record.modelo)}</strong></div><div><span>No. de serie</span><strong>${esc(record.serie)}</strong></div><div><span>Área</span><strong>${esc(record.area)}</strong></div><div><span>Categoría</span><strong>${esc(record.categoria)}</strong></div><div><span>Folio</span><strong>${esc(record.folio)}</strong></div><div><span>Monto</span><strong>${formatMoney(record.monto)}</strong></div><div><span>Fecha de prueba</span><strong>${formatDate(record.fecha)}</strong></div>`;renderPhotos();$('#photoDialog').showModal()}
function openHistory(record){const events=[...(record.historialCambios||[])].sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))),labels={economico:'Número económico',marca:'Unidad / marca',modelo:'Modelo',serie:'Número de serie',categoria:'Categoría',folio:'Folio',monto:'Monto',area:'Área',fecha:'Fecha de prueba',estado:'Estado',observaciones:'Observaciones'},detail=item=>{if(!item.detalle?.startsWith('Campos modificados:'))return item.detalle||'';const fields=item.detalle.replace('Campos modificados:','').replace('.','').split(',').map(field=>field.trim());return fields.map(field=>`${labels[field]||field}: ${historyValue(field,record[field])}`).join(' · ')},detailList=item=>detail(item).split(' · ').filter(Boolean).map(value=>`<li>${esc(value)}</li>`).join('');$('#historyTitle').textContent=`Historial · Económico ${record.economico}`;$('#historyList').innerHTML=events.length?events.map(item=>`<article class="history-item" tabindex="0"><div><h3>${esc(item.titulo)}</h3><ul class="history-details">${detailList(item)}</ul><time>${new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date(item.fecha))}</time></div></article>`).join(''):'<div class="history-empty">Aún no hay cambios registrados para este económico.<br />Los próximos movimientos quedarán guardados aquí.</div>';$('#historyDialog').showModal()}
function renderPhotos(){const record=records.find(r=>r.id===photoRecordId),photos=record?.photos||[];$('#photoGrid').innerHTML=photos.length?photos.map((photo,index)=>`<div class="photo-card"><img src="${photo.dataUrl}" data-view-photo="${index}" alt="Foto ${index+1} del económico ${esc(record.economico)}" /><button class="remove-photo" data-photo-index="${index}" aria-label="Eliminar foto">×</button></div>`).join(''):'<div class="no-photos">Aún no hay fotos para este económico.<br />Usa <strong>Agregar fotos</strong> para crear su ficha visual.</div>'}
async function compressPhoto(file){const image=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=reader.result};reader.onerror=reject;reader.readAsDataURL(file)});const maxSide=1280,scale=Math.min(1,maxSide/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);return new Promise(resolve=>canvas.toBlob(blob=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob)},'image/jpeg',.8))}
body.onclick=e=>{const {id,action}=e.target.dataset;if(!id)return;const record=records.find(r=>r.id===id);if(action==='delete'){if(confirm(`¿Eliminar el económico ${record.economico}? Esta acción no se puede deshacer.`)){records=records.filter(r=>r.id!==id);selectedIds.delete(id);save();renderFilters();render();toast(`Económico ${record.economico} eliminado.`)}return}if(action==='edit')openForm(record);if(action==='photos')openPhotos(record);if(action==='history')openHistory(record)};
$('#closePhotoDialog').onclick=()=>$('#photoDialog').close();
$('#closeHistoryDialog').onclick=()=>$('#historyDialog').close();
function updateViewer(){const image=$('#viewerImage');image.style.transform=`translate(${viewerX}px,${viewerY}px) scale(${viewerScale})`}
function openViewer(index){const record=records.find(r=>r.id===photoRecordId),photo=record.photos[Number(index)];viewerScale=1;viewerX=0;viewerY=0;$('#viewerImage').src=photo.dataUrl;$('#viewerCaption').textContent=`Económico ${record.economico} · ${photo.name||`Foto ${Number(index)+1}`}`;updateViewer();$('#imageViewer').showModal()}
$('#photoGrid').onclick=e=>{const removeIndex=e.target.dataset.photoIndex,viewIndex=e.target.dataset.viewPhoto;if(removeIndex!==undefined){const record=records.find(r=>r.id===photoRecordId);record.photos.splice(Number(removeIndex),1);addHistory(record,'Evidencia eliminada','Se eliminó una fotografía de la ficha.');save();renderPhotos();render();toast('Foto eliminada.');return}if(viewIndex!==undefined)openViewer(viewIndex)};
$('#closeViewer').onclick=()=>$('#imageViewer').close();$('#zoomIn').onclick=()=>{viewerScale=Math.min(4,viewerScale+.25);updateViewer()};$('#zoomOut').onclick=()=>{viewerScale=Math.max(.5,viewerScale-.25);updateViewer()};$('#zoomReset').onclick=()=>{viewerScale=1;viewerX=0;viewerY=0;updateViewer()};
$('#viewerStage').onwheel=e=>{e.preventDefault();viewerScale=Math.max(.5,Math.min(4,viewerScale+(e.deltaY<0?.15:-.15)));updateViewer()};
$('#viewerStage').onpointerdown=e=>{dragStart={x:e.clientX,y:e.clientY,offsetX:viewerX,offsetY:viewerY};e.currentTarget.classList.add('dragging');e.currentTarget.setPointerCapture(e.pointerId)};
$('#viewerStage').onpointermove=e=>{if(!dragStart)return;viewerX=dragStart.offsetX+e.clientX-dragStart.x;viewerY=dragStart.offsetY+e.clientY-dragStart.y;updateViewer()};
$('#viewerStage').onpointerup=e=>{dragStart=null;e.currentTarget.classList.remove('dragging')};
$('#photoInput').onchange=async e=>{const files=[...e.target.files].filter(file=>file.type.startsWith('image/'));if(!files.length)return;try{const photos=await Promise.all(files.map(async file=>({dataUrl:await compressPhoto(file),name:file.name})));const record=records.find(r=>r.id===photoRecordId);record.photos=[...(record.photos||[]),...photos];addHistory(record,'Evidencias agregadas',`Se agregaron ${photos.length} fotografía${photos.length===1?'':'s'} a la ficha.`);save();renderPhotos();render();toast(`${photos.length} foto${photos.length===1?'':'s'} agregada${photos.length===1?'':'s'}.`)}catch{toast('No se pudo procesar alguna de las fotos.')}finally{e.target.value=''}};
body.onchange=e=>{if(e.target.classList.contains('record-check')){e.target.checked?selectedIds.add(e.target.dataset.id):selectedIds.delete(e.target.dataset.id);render()}};
$('#selectAll').onchange=e=>{const visibleIds=[...body.querySelectorAll('.record-check')].map(input=>input.dataset.id);visibleIds.forEach(id=>e.target.checked?selectedIds.add(id):selectedIds.delete(id));render()};
$('#deleteSelected').onclick=()=>{const count=selectedIds.size;if(!count||!confirm(`¿Eliminar los ${count} económicos seleccionados? Esta acción no se puede deshacer.`))return;records=records.filter(r=>!selectedIds.has(r.id));selectedIds.clear();save();renderFilters();render();toast(`${count} económicos eliminados.`)};
['input','change'].forEach(event=>{['#searchInput','#areaFilter','#categoryFilter'].forEach(s=>$(s).addEventListener(event,render))});
$('#clearFilters').onclick=()=>{$('#searchInput').value='';$('#areaFilter').value='';$('#categoryFilter').value='';render()};
function csvEscape(v){return `"${String(v).replaceAll('"','""')}"`};
$('#exportButton').onclick=()=>{const headers=['Número eco.','Marca','Modelo','No. de serie','Categoría','Folio no.','Monto','Área','Fecha de prueba','Observaciones'];const rows=records.map(r=>[r.economico,r.marca,r.modelo,r.serie,r.categoria,r.folio,r.monto||'',r.area,r.fecha,r.observaciones]);const blob=new Blob([[headers,...rows].map(row=>row.map(csvEscape).join(',')).join('\n')],{type:'text/csv;charset=utf-8'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`economicos-${new Date().toISOString().slice(0,10)}.csv`;link.click();URL.revokeObjectURL(link.href)};
const expectedHeaders=['numeroeco','marca','modelo','nodeserie','categoria','foliono','area','fechadeprueba','observaciones'];
const normalizeHeader=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const excelDate=value=>{if(/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return String(value);const serial=Number(value);if(!Number.isFinite(serial))return '';const date=new Date(Date.UTC(1899,11,30)+serial*86400000);return date.toISOString().slice(0,10)};
function rowsToRecords(rows){const headerIndex=rows.findIndex(row=>expectedHeaders.every(header=>row.map(normalizeHeader).includes(header)));if(headerIndex<0)throw new Error('No encontré las nueve columnas requeridas.');const map=expectedHeaders.map(header=>rows[headerIndex].map(normalizeHeader).indexOf(header)),amountIndex=rows[headerIndex].map(normalizeHeader).indexOf('monto');const result=rows.slice(headerIndex+1).filter(row=>map.some(index=>String(row[index]??'').trim())).map(row=>({id:crypto.randomUUID(),economico:String(row[map[0]]??'').trim(),marca:String(row[map[1]]??'').trim(),modelo:String(row[map[2]]??'').trim(),serie:String(row[map[3]]??'').trim(),categoria:String(row[map[4]]??'').trim(),folio:String(row[map[5]]??'').trim(),area:String(row[map[6]]??'').trim(),fecha:excelDate(row[map[7]]),observaciones:String(row[map[8]]??'').trim(),monto:amountIndex<0?'':String(row[amountIndex]??'').replace(/[$,\s]/g,'')})).filter(r=>r.economico&&r.marca&&r.fecha);if(!result.length)throw new Error('El archivo no contiene registros válidos.');return result}
async function readXlsx(file){const buffer=await file.arrayBuffer(),view=new DataView(buffer),bytes=new Uint8Array(buffer),decoder=new TextDecoder();let cursor=bytes.length-22;while(cursor>=0&&view.getUint32(cursor,true)!==0x06054b50)cursor--;if(cursor<0)throw new Error('El archivo Excel no es válido.');let offset=view.getUint32(cursor+16,true),count=view.getUint16(cursor+10,true),entries={};for(let i=0;i<count;i++){if(view.getUint32(offset,true)!==0x02014b50)break;const method=view.getUint16(offset+10,true),compressed=view.getUint32(offset+20,true),nameLength=view.getUint16(offset+28,true),extraLength=view.getUint16(offset+30,true),commentLength=view.getUint16(offset+32,true),localOffset=view.getUint32(offset+42,true),name=decoder.decode(bytes.slice(offset+46,offset+46+nameLength));entries[name]={method,compressed,localOffset};offset+=46+nameLength+extraLength+commentLength}async function entry(name){const item=entries[name];if(!item)return '';const start=item.localOffset,namelen=view.getUint16(start+26,true),extralength=view.getUint16(start+28,true),data=bytes.slice(start+30+namelen+extralength,start+30+namelen+extralength+item.compressed);if(item.method===0)return decoder.decode(data);if(item.method===8){const stream=new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return decoder.decode(await new Response(stream).arrayBuffer())}throw new Error('El Excel usa una compresión no compatible.')}const sharedXml=await entry('xl/sharedStrings.xml'),shared=sharedXml?[...new DOMParser().parseFromString(sharedXml,'application/xml').querySelectorAll('si')].map(node=>node.textContent||''):[];let sheetName=Object.keys(entries).find(name=>/^xl\/worksheets\/sheet\d+\.xml$/.test(name));if(!sheetName)throw new Error('No encontré una hoja con datos.');const xml=await entry(sheetName),doc=new DOMParser().parseFromString(xml,'application/xml'),rows=[];for(const row of doc.querySelectorAll('sheetData > row')){const values=[];for(const cell of row.querySelectorAll('c')){const match=(cell.getAttribute('r')||'').match(/[A-Z]+/),letters=match?.[0]||'A';let index=0;for(const letter of letters)index=index*26+letter.charCodeAt(0)-64;const raw=cell.querySelector('v')?.textContent??cell.querySelector('is')?.textContent??'',type=cell.getAttribute('t');values[index-1]=type==='s'?shared[Number(raw)]??'':raw}rows.push(values)}return rows}
$('#importInput').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{let rows;if(file.name.toLowerCase().endsWith('.xlsx'))rows=await readXlsx(file);else{const text=await file.text();rows=text.split(/\r?\n/).filter(Boolean).map(row=>row.match(/("(?:[^"]|"")*"|[^,]*)(?=,|$)/g)?.map(v=>v.replace(/^"|"$/g,'').replaceAll('""','"').trim())||[])}const imported=rowsToRecords(rows);records=[...records.filter(r=>!imported.some(i=>i.economico===r.economico)),...imported];save();renderFilters();render();toast(`${imported.length} registros importados desde ${file.name}.`)}catch(error){toast(error.message||'No se pudo importar el archivo.')}finally{e.target.value=''}};
async function loadFromSql(){if(location.protocol==='file:')return;try{const response=await fetch('/api/economicos');if(!response.ok)throw new Error('No se pudo conectar con el servidor.');const remote=await response.json();if(remote.length){records=remote.map(record=>({...record,monto:record.monto??'',photos:record.photos||[],mantenimientos:Array.isArray(record.mantenimientos)?record.mantenimientos:[],historialCambios:Array.isArray(record.historial_cambios)?record.historial_cambios:(Array.isArray(record.historialCambios)?record.historialCambios:[]),estado:record.estado||(/en condiciones/i.test(record.observaciones)?'operativo':'mantenimiento')}));save();renderFilters();render();toast('Datos sincronizados correctamente.')}else if(records.length){const sync=await fetch('/api/economicos',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(records)});if(!sync.ok)throw new Error('No se pudo migrar la información local.');toast('Datos locales sincronizados correctamente.')}}catch{toast('Trabajando con los datos locales.')}}
renderFilters();render();loadFromSql();

function renderFleetStatusChart(){
  const chart=$('#fleetStatusChart'),summary=$('#fleetStatusSummary');
  if(!chart||!summary)return;
  const operational=records.filter(record=>record.estado==='operativo').length;
  const maintenance=records.filter(record=>record.estado==='mantenimiento').length;
  const max=Math.max(operational,maintenance,1);
  const data=[
    {label:'Operativos',count:operational,className:'bar-operational'},
    {label:'Mantenimiento',count:maintenance,className:'bar-maintenance'}
  ];
  chart.innerHTML=data.map(item=>`<span class="${item.className}" style="--h:${Math.max(12,Math.round(item.count/max*90))}%"><b>${item.count}</b><i>${item.label}</i></span>`).join('');
  summary.textContent=`${operational} operativos · ${maintenance} en mantenimiento`;
}

const fleetChartObserver=new MutationObserver(renderFleetStatusChart);
fleetChartObserver.observe($('#totalMetric'),{childList:true,characterData:true,subtree:true});
fleetChartObserver.observe($('#attentionMetric'),{childList:true,characterData:true,subtree:true});
renderFleetStatusChart();

function renderEvidenceGallery(){
  const grid=$('#evidenceGrid'),count=$('#evidenceCount');
  if(!grid||!count)return;
  const query=$('#evidenceSearch')?.value.trim().toLowerCase()||'',state=$('#evidenceStatusFilter')?.value||'';
  const visible=records.filter(record=>!query||[record.economico,record.marca,record.modelo].join(' ').toLowerCase().includes(query)).filter(record=>!state||record.estado===state);
  const totalPhotos=visible.reduce((sum,record)=>sum+(record.photos?.length||0),0);
  count.textContent=`${visible.length} de ${records.length} hidráulicos · ${totalPhotos} evidencias`;
  if(!visible.length){grid.innerHTML='<div class="evidence-empty">No hay hidráulicos que coincidan con los filtros seleccionados.</div>';return}
  grid.innerHTML=[...visible].sort((a,b)=>(b.photos?.length||0)-(a.photos?.length||0)).map(record=>{
    const photos=record.photos||[],preview=photos[0]?.dataUrl?`<img src="${photos[0].dataUrl}" alt="Evidencia del económico ${esc(record.economico)}" />`:'<span>▧</span>';
    const isOperational=record.estado==='operativo',status=isOperational?'En condiciones':'En mantenimiento';
    return `<article class="evidence-card ${isOperational?'evidence-operational':'evidence-maintenance'}"><div class="evidence-preview">${preview}</div><div class="evidence-card-body"><div class="evidence-card-top"><div><h2>Eco. ${esc(record.economico)}</h2><p>${esc(record.marca)} · ${esc(record.modelo)}</p></div><span class="category">${esc(record.categoria)}</span></div><div class="evidence-meta"><span class="evidence-status">${photos.length} foto${photos.length===1?'':'s'} · ${status}</span><button class="evidence-open" data-evidence-id="${record.id}">Ver ficha →</button></div></div></article>`
  }).join('');
}

document.querySelectorAll('.nav-item[data-view]').forEach(item=>item.addEventListener('click',()=>{
  const view=item.dataset.view;
  if(!['units','evidences','maintenance'].includes(view)){toast('Este módulo estará disponible próximamente.');return}
  $('#unitsView').classList.toggle('is-hidden',view!=='units');
  $('#evidencesView').classList.toggle('is-active',view==='evidences');
  $('#maintenanceView').classList.toggle('is-active',view==='maintenance');
  document.querySelectorAll('.nav-item[data-view]').forEach(nav=>nav.classList.toggle('active',nav===item));
  if(view==='evidences')renderEvidenceGallery();
  if(view==='maintenance')renderMaintenanceHistory();
}));

$('#evidenceGrid').onclick=event=>{
  const id=event.target.dataset.evidenceId;
  if(id){const record=records.find(item=>item.id===id);if(record)openPhotos(record)}
};

['input','change'].forEach(event=>{
  $('#evidenceSearch').addEventListener(event,renderEvidenceGallery);
  $('#evidenceStatusFilter').addEventListener(event,renderEvidenceGallery);
});

const evidenceObserver=new MutationObserver(renderEvidenceGallery);
evidenceObserver.observe(body,{childList:true,subtree:true});
renderEvidenceGallery();

const maintenanceDialog=$('#maintenanceDialog'),maintenanceForm=$('#maintenanceForm');
function renderMaintenanceFilters(){
  const yearFilter=$('#maintenanceYearFilter'),economicFilter=$('#maintenanceEconomicFilter');
  if(!yearFilter||!economicFilter)return;
  const currentYear=String(new Date().getFullYear());
  const years=[...new Set([currentYear,...records.flatMap(record=>(record.mantenimientos||[]).map(item=>String(item.fecha||'').slice(0,4)).filter(Boolean))])].sort((a,b)=>b.localeCompare(a));
  const selectedYear=yearFilter.value||currentYear,selectedEconomic=economicFilter.value;
  yearFilter.innerHTML=years.map(year=>`<option value="${year}" ${year===selectedYear?'selected':''}>Bitácora ${year}</option>`).join('');
  economicFilter.innerHTML='<option value="">Todos los económicos</option>'+[...records].sort((a,b)=>String(a.economico).localeCompare(String(b.economico),undefined,{numeric:true})).map(record=>`<option value="${record.id}" ${record.id===selectedEconomic?'selected':''}>Eco. ${esc(record.economico)} · ${esc(record.marca)}</option>`).join('');
}
function renderMaintenanceHistory(){
  const list=$('#maintenanceList');
  if(!list)return;
  renderMaintenanceFilters();
  const year=$('#maintenanceYearFilter').value,economicId=$('#maintenanceEconomicFilter').value;
  const entries=records.flatMap(record=>(record.mantenimientos||[]).map(item=>({...item,record}))).filter(item=>String(item.fecha||'').startsWith(year)).filter(item=>!economicId||item.record.id===economicId).sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
  const completed=entries.filter(item=>item.resultado==='operativo').length,units=new Set(entries.map(item=>item.record.id)).size;
  $('#maintenanceSummary').innerHTML=`<article><span>REGISTROS EN ${year}</span><strong>${entries.length}</strong></article><article><span>ECONÓMICOS ATENDIDOS</span><strong>${units}</strong></article><article><span>TRABAJOS CONCLUIDOS</span><strong>${completed}</strong></article>`;
  list.innerHTML=entries.length?entries.map(item=>`<article class="maintenance-entry"><div class="maintenance-date">${formatDate(item.fecha)}</div><div><h3>Eco. ${esc(item.record.economico)} · ${esc(item.tipo)}</h3><p>${esc(item.descripcion)}</p><small>${esc(item.record.marca)} ${esc(item.record.modelo)} · Responsable: ${esc(item.responsable)} · Monto estimado: <strong>${formatMoney(item.monto)}</strong></small>${item.comentarioCierre?`<small><strong>Cierre:</strong> ${esc(item.comentarioCierre)}</small>`:''}${item.resultado==='mantenimiento'?`<button class="finish-maintenance" type="button" data-finish-record="${item.record.id}" data-finish-entry="${item.id}">✓ Marcar como terminado</button>`:''}</div><span class="maintenance-result ${item.resultado==='operativo'?'ok':'pending'}">${item.resultado==='operativo'?'Concluido':'En mantenimiento'}</span></article>`).join(''):`<div class="maintenance-empty">No hay mantenimientos registrados para ${economicId?'este económico':'la flota'} en ${year}.<br />Usa <strong>Registrar mantenimiento</strong> para agregar una intervención.</div>`;
}
function openMaintenanceDialog(){
  maintenanceForm.reset();
  $('#maintenanceEconomic').innerHTML='<option value="" disabled selected>Selecciona un económico</option>'+records.map(record=>`<option value="${record.id}">${esc(record.economico)} · ${esc(record.marca)} ${esc(record.modelo)}</option>`).join('');
  maintenanceForm.elements.fecha.value=new Date().toISOString().slice(0,10);
  maintenanceDialog.showModal();
}
$('#newMaintenanceButton').onclick=openMaintenanceDialog;
$('#closeMaintenanceDialog').onclick=$('#cancelMaintenanceButton').onclick=()=>maintenanceDialog.close();
$('#maintenanceYearFilter').onchange=$('#maintenanceEconomicFilter').onchange=renderMaintenanceHistory;
const finishMaintenanceDialog=$('#finishMaintenanceDialog'),finishMaintenanceForm=$('#finishMaintenanceForm');
let finishMaintenanceTarget=null;
$('#maintenanceList').onclick=event=>{
  const button=event.target.closest('[data-finish-entry]');
  if(!button)return;
  finishMaintenanceTarget={recordId:button.dataset.finishRecord,entryId:button.dataset.finishEntry};
  finishMaintenanceForm.reset();
  finishMaintenanceDialog.showModal();
};
$('#closeFinishMaintenanceDialog').onclick=$('#cancelFinishMaintenanceButton').onclick=()=>finishMaintenanceDialog.close();
finishMaintenanceForm.onsubmit=event=>{
  event.preventDefault();
  const comment=finishMaintenanceForm.elements.comentario.value.trim();
  const record=records.find(item=>item.id===finishMaintenanceTarget?.recordId),entry=record?.mantenimientos?.find(item=>item.id===finishMaintenanceTarget?.entryId);
  if(!record||!entry){toast('No encontré el mantenimiento seleccionado.');finishMaintenanceDialog.close();return}
  entry.resultado='operativo';
  entry.comentarioCierre=comment;
  entry.fechaCierre=new Date().toISOString().slice(0,10);
  record.estado='operativo';
  record.observaciones=`Mantenimiento concluido: ${comment}`;
  addHistory(record,'Mantenimiento finalizado',`Se concluyó ${entry.tipo}. Comentario: ${comment}`);
  save();render();renderMaintenanceHistory();finishMaintenanceDialog.close();toast('Mantenimiento finalizado y económico disponible.');
};
maintenanceForm.onsubmit=event=>{
  event.preventDefault();
  const data=Object.fromEntries(new FormData(maintenanceForm)),record=records.find(item=>item.id===data.economicoId);
  if(!record){toast('Selecciona un económico válido.');return}
  const entry={id:crypto.randomUUID(),fecha:data.fecha,tipo:data.tipo,responsable:data.responsable.trim(),monto:Number(data.monto),descripcion:data.descripcion.trim(),resultado:data.resultado};
  record.mantenimientos=[...(record.mantenimientos||[]),entry];
  record.estado=data.resultado;
  record.observaciones=data.resultado==='operativo'?'En condiciones para trabajar':entry.descripcion;
  addHistory(record,'Mantenimiento registrado',`${entry.tipo} · Monto estimado: ${formatMoney(entry.monto)}. ${entry.descripcion}`);
  save();render();renderMaintenanceHistory();maintenanceDialog.close();toast('Mantenimiento guardado en el historial.');
};

const maintenanceObserver=new MutationObserver(renderMaintenanceHistory);
maintenanceObserver.observe(body,{childList:true,subtree:true});
renderMaintenanceHistory();
