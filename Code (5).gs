/**
 * NUVEICECREAM - Google Apps Script backend
 * Deploy as Web app: Execute as Me; access Anyone.
 * Rahasia disimpan di Project Settings > Script Properties, bukan di frontend/GitHub.
 */
const SHEETS = {
  Orders: ['orderId','createdAt','customerName','customerWhatsApp','itemsJson','itemsText','total','status','notes','updatedAt'],
  Products: ['id','name','price','category','description','image','active','createdAt','updatedAt'],
  ActivityLogs: ['timestamp','action','entity','entityId','detail']
};
const SESSION_TTL_SECONDS = 21600;

function setupDatabase() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ADMIN_PASSWORD')) {
    throw new Error('Tambahkan ADMIN_PASSWORD di Script Properties terlebih dahulu. Nilainya: Bismillaah');
  }
  const ss = getSpreadsheet_();
  Object.keys(SHEETS).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const headers = SHEETS[name];
    if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    else {
      const current = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), headers.length)).getDisplayValues()[0];
      headers.forEach((h, i) => { if (current[i] !== h) throw new Error('Header sheet ' + name + ' tidak cocok di kolom ' + (i+1) + '. Periksa sebelum menjalankan setup.'); });
    }
    sh.setFrozenRows(1); sh.getRange(1,1,1,headers.length).setFontWeight('bold');
  });
  return 'Selesai. Spreadsheet ID tersimpan dan sheet/header sudah siap.';
}
function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Set SPREADSHEET_ID di Script Properties.');
  props.setProperty('SPREADSHEET_ID', active.getId());
  return active;
}
function doGet() { return json_({ok:true,data:{service:'nuveicecream-api',message:'API aktif'}}); }
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = String(body.action || '');
    let data;
    switch (action) {
      case 'adminLogin': data = login_(body.password); break;
      case 'adminLogout': data = logout_(body.token); break;
      case 'createOrder': data = createOrder_(body.order); break;
      case 'listOrders': requireSession_(body.token); data = listRows_('Orders').map(orderFromRow_).reverse(); break;
      case 'updateOrder': requireSession_(body.token); data = updateOrder_(body.orderId, body.patch || {}); break;
      case 'deleteOrder': requireSession_(body.token); data = deleteById_('Orders','orderId',body.orderId); break;
      case 'listProducts': requireSession_(body.token); data = listRows_('Products').map(productFromRow_); break;
      case 'createProduct': requireSession_(body.token); data = saveProduct_(body.product || {}, false); break;
      case 'updateProduct': requireSession_(body.token); data = saveProduct_(body.product || {}, true); break;
      case 'deleteProduct': requireSession_(body.token); data = deleteById_('Products','id',body.id); break;
      default: throw new Error('Aksi tidak dikenal.');
    }
    return json_({ok:true,data:data});
  } catch (err) { return json_({ok:false,error:String(err && err.message || err)}); }
}
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function login_(password) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected) throw new Error('ADMIN_PASSWORD belum disetel di Script Properties.');
  if (!constantTimeEqual_(String(password || ''), expected)) throw new Error('Password salah.');
  const token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('admin:' + token, '1', SESSION_TTL_SECONDS);
  log_('LOGIN','Admin','', 'Admin login');
  return {token:token,expiresIn:SESSION_TTL_SECONDS};
}
function constantTimeEqual_(a,b) { if (a.length !== b.length) return false; let out=0; for(let i=0;i<a.length;i++) out |= a.charCodeAt(i)^b.charCodeAt(i); return out===0; }
function requireSession_(token) { if (!token || CacheService.getScriptCache().get('admin:' + token) !== '1') throw new Error('Sesi admin kedaluwarsa. Silakan login kembali.'); CacheService.getScriptCache().put('admin:' + token,'1',SESSION_TTL_SECONDS); }
function logout_(token) { if(token) CacheService.getScriptCache().remove('admin:' + token); return {loggedOut:true}; }
function createOrder_(o) {
  if (!o || !String(o.customerName || '').trim()) throw new Error('Nama pelanggan wajib diisi.');
  const wa = String(o.customerWhatsApp || '').trim();
  if (wa.replace(/\D/g,'').length < 8) throw new Error('Nomor WhatsApp tidak valid.');
  if (!Array.isArray(o.items) || !o.items.length) throw new Error('Pesanan kosong.');
  const items = o.items.map(i => ({name:String(i.name||'').slice(0,100),qty:Math.max(1,Math.min(100,Number(i.qty)||1)),price:Math.max(0,Number(i.price)||0)}));
  const total = items.reduce((s,i)=>s+i.qty*i.price,0);
  const id = 'ORD-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Math.floor(1000+Math.random()*9000);
  const sh = getSpreadsheet_().getSheetByName('Orders');
  sh.appendRow([id,new Date(),String(o.customerName).trim().slice(0,80),wa,JSON.stringify(items),items.map(i=>i.name+' x'+i.qty).join(', '),total,'Menunggu',String(o.notes||'').slice(0,300),new Date()]);
  log_('CREATE','Orders',id,'Pesanan baru');
  return {orderId:id,status:'Menunggu',total:total};
}
function listRows_(name) { const sh=getSpreadsheet_().getSheetByName(name); if(!sh) throw new Error('Sheet '+name+' belum ada. Jalankan setupDatabase.'); const values=sh.getDataRange().getValues(); if(values.length<2)return []; const headers=values.shift().map(String); return values.filter(r=>r.some(v=>v!==''&&v!==null)).map(r=>{const o={};headers.forEach((h,i)=>o[h]=r[i] instanceof Date?Utilities.formatDate(r[i],Session.getScriptTimeZone(),'yyyy-MM-dd HH:mm:ss'):r[i]);return o;}); }
function orderFromRow_(r) { let items=[]; try{items=JSON.parse(r.itemsJson||'[]')}catch(_){} return {orderId:String(r.orderId||''),createdAt:String(r.createdAt||''),customerName:String(r.customerName||''),customerWhatsApp:String(r.customerWhatsApp||''),items:items,itemsText:String(r.itemsText||''),total:Number(r.total)||0,status:String(r.status||'Menunggu'),notes:String(r.notes||'')}; }
function productFromRow_(r) { return {id:String(r.id||''),name:String(r.name||''),price:Number(r.price)||0,category:String(r.category||''),description:String(r.description||''),image:String(r.image||''),active:String(r.active).toLowerCase()!=='false'&&r.active!==false}; }
function updateOrder_(id,patch) { const allowed=['status','notes']; const clean={}; allowed.forEach(k=>{if(patch[k]!==undefined)clean[k]=String(patch[k]).slice(0,k==='notes'?300:30)}); if(clean.status && !['Menunggu','Dihubungi','Diproses','Selesai','Dibatalkan'].includes(clean.status)) throw new Error('Status tidak valid.'); const result=updateRow_('Orders','orderId',id,Object.assign(clean,{updatedAt:new Date()})); log_('UPDATE','Orders',id,JSON.stringify(clean)); return result; }
function saveProduct_(p,isUpdate) { if(!String(p.name||'').trim())throw new Error('Nama produk wajib diisi.'); const obj={id:String(p.id||Utilities.getUuid()),name:String(p.name).trim().slice(0,100),price:Math.max(0,Number(p.price)||0),category:String(p.category||'').slice(0,60),description:String(p.description||'').slice(0,500),image:String(p.image||'').slice(0,1000),active:p.active===false?'FALSE':'TRUE',updatedAt:new Date()}; if(isUpdate){updateRow_('Products','id',obj.id,obj)}else{obj.createdAt=new Date();appendObject_('Products',obj)} log_(isUpdate?'UPDATE':'CREATE','Products',obj.id,obj.name); return obj; }
function appendObject_(sheetName,obj){const sh=getSpreadsheet_().getSheetByName(sheetName);const headers=SHEETS[sheetName];sh.appendRow(headers.map(h=>obj[h]===undefined?'':obj[h]));}
function updateRow_(sheetName,key,id,patch){const sh=getSpreadsheet_().getSheetByName(sheetName);const values=sh.getDataRange().getValues();const headers=values[0].map(String);const keyCol=headers.indexOf(key);if(keyCol<0)throw new Error('Kolom kunci tidak ditemukan.');for(let r=1;r<values.length;r++){if(String(values[r][keyCol])===String(id)){Object.keys(patch).forEach(k=>{const c=headers.indexOf(k);if(c>=0)sh.getRange(r+1,c+1).setValue(patch[k]);});return {updated:true,id:String(id)}}}throw new Error('Data tidak ditemukan.');}
function deleteById_(sheetName,key,id){const sh=getSpreadsheet_().getSheetByName(sheetName);const values=sh.getDataRange().getValues();const col=values[0].map(String).indexOf(key);for(let r=1;r<values.length;r++){if(String(values[r][col])===String(id)){sh.deleteRow(r+1);log_('DELETE',sheetName,String(id),'Data dihapus');return {deleted:true,id:String(id)}}}throw new Error('Data tidak ditemukan.');}
function log_(action,entity,id,detail){try{const sh=getSpreadsheet_().getSheetByName('ActivityLogs');if(sh)sh.appendRow([new Date(),action,entity,id,detail])}catch(_){} }
