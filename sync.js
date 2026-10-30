import {firebaseConfig} from './firebase-config.js';
import {nextRecord,mergeGuest,syncError} from './sync-core.mjs';
const diary=window.SonoraDiary,q=s=>document.querySelector(s);
const copy={
 guest:['Saved on this device · sign in to sync','Lưu trên thiết bị · đăng nhập để đồng bộ'],
 loading:['Opening your cloud diary…','Đang mở nhật ký trên mây…'],
 ready:['Cloud diary up to date','Nhật ký đã đồng bộ'],
 saving:['Saving to your account… Please keep this page open.','Đang lưu vào tài khoản… Hãy giữ trang mở.'],
 setup:['Cloud diary is unavailable. The owner needs to enable Firestore and publish the diary security rules. Your device diary is unchanged.','Chưa mở được nhật ký trên mây. Chủ trang cần bật Firestore và xuất bản quy tắc nhật ký. Nhật ký trên máy vẫn được giữ nguyên.'],
 offline:['Not synced. Check your connection and retry. You can export your current copy.','Chưa đồng bộ. Kiểm tra mạng và thử lại. Bạn có thể xuất bản sao hiện tại.'],
 conflict:['Another device changed this diary. Your copy is preserved here. Export it and load the cloud version, then import any memories you want to keep.','Nhật ký đã thay đổi trên thiết bị khác. Bản của bạn vẫn được giữ tại đây. Hãy xuất bản sao và tải bản trên mây, rồi nhập các ký ức muốn giữ.'],
 size:['This diary exceeds the cloud size limit (700 KB). Export a backup before loading the cloud copy.','Nhật ký vượt giới hạn đồng bộ 700 KB. Hãy xuất bản sao trước khi tải lại bản trên mây.'],
 restored:['Unsynced changes from this account were recovered. Retry to save, or export them and load the cloud version.','Đã khôi phục thay đổi chưa đồng bộ của tài khoản này. Thử lưu lại hoặc xuất bản sao và tải bản trên mây.'],
 importConfirm:['Add the non-sample memories saved on this browser to this account? Existing cloud memories will be kept.','Thêm các ký ức của bạn đang lưu trên trình duyệt vào tài khoản này? Ký ức trên mây được giữ nguyên.'],
 storage:['Changes are only in this open page: the browser could not save a recovery copy. Keep it open, retry sync or export now.','Thay đổi chỉ còn trong trang đang mở: trình duyệt không lưu được bản khôi phục. Giữ trang mở, thử đồng bộ hoặc xuất ngay.']
};
let user=null,generation=0,stop=null,db,lib,ref,revision=0,dirty=false,saving=false,loaded=false,payload=null,latest=null,statusKey='guest',recoveryFailed=false;
const message=()=>copy[statusKey]?.[document.documentElement.lang==='vi'?1:0]||'';
function recoveryKey(){return 'sonora-pending-v1:'+user.uid}
function display(key=statusKey){
 statusKey=key;q('#sync-status').textContent=message();q('#sync-indicator').textContent=message();
 q('#sync-indicator').dataset.state=key;
 q('#sync-retry').hidden=!user||saving||['loading','ready'].includes(key);
 q('#sync-reload').hidden=!user||saving||!dirty;
 let available=false;try{available=diary.guest().tracks.some(t=>!t.demo)}catch{}
 q('#sync-import').hidden=!user||!loaded||dirty||saving||!available;
}
function cache(){try{localStorage.setItem(recoveryKey(),JSON.stringify({revision,payload}));recoveryFailed=false}catch{recoveryFailed=true}}
function clearCache(){try{localStorage.removeItem(recoveryKey())}catch{}}
function consume(record){
 if(!user||dirty||saving||diary.editing())return;
 if(loaded&&(record?.revision||0)===revision)return;
 try{
  const next=record?diary.validate(JSON.parse(record.payload)):diary.empty();
  if(record&&(!Number.isSafeInteger(record.revision)||record.revision<1))throw Error('revision');
  revision=record?.revision||0;loaded=true;diary.replace(next);display('ready');
 }catch{loaded=false;display('setup')}
}
async function connect(member){
 // A token refresh of the same identity must not erase in-flight edits.
 if(member?.uid&&user?.uid===member.uid)return;
 const gen=++generation;stop?.();stop=null;user=member;ref=null;dirty=false;saving=false;loaded=false;latest=null;payload=null;revision=0;
 diary.closeEditors();
 if(!user){try{diary.replace(diary.guest())}catch{diary.replace(diary.empty())}display('guest');return}
 diary.replace(diary.empty());display('loading');
 try{
  const recovered=JSON.parse(localStorage.getItem(recoveryKey())||'null');
  if(recovered&&Number.isSafeInteger(recovered.revision)&&recovered.revision>=0){
   diary.replace(diary.validate(JSON.parse(recovered.payload)));payload=recovered.payload;revision=recovered.revision;dirty=true;
  }
 }catch{/* Never mix another account's or malformed cached data into this diary. */}
 try{
  const [app,firestore]=await Promise.all([import('https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js')]);
  if(gen!==generation)return;
  lib=firestore;db=lib.getFirestore(app.getApps().length?app.getApp():app.initializeApp(firebaseConfig));ref=lib.doc(db,'diaries',member.uid);
  stop=lib.onSnapshot(ref,{includeMetadataChanges:true},snap=>{
   if(gen!==generation||snap.metadata.fromCache||snap.metadata.hasPendingWrites)return;
   latest=snap.exists()?snap.data():null;
   if(dirty&&!saving){if(latest?.payload===payload){dirty=false;clearCache()}else{loaded=true;display('restored');return}}
   consume(latest);
  },e=>{if(gen===generation){loaded=false;display(syncError(e.code))}});
  // A disconnected listener may stay cache-only indefinitely; do not call that synced.
  setTimeout(()=>{if(gen===generation&&!loaded&&!saving&&statusKey==='loading')display('offline')},12000);
 }catch(e){if(gen===generation)display(syncError(e.code))}
}
async function persist(){
 if(!user||!ref||saving||!dirty)return;
 const gen=generation,target=ref,expected=revision,body=payload;
 saving=true;display('saving');
 try{
  await lib.runTransaction(db,async tx=>{
   if(gen!==generation)throw Error('account-changed');
   const snap=await tx.get(target);
   tx.set(target,nextRecord(snap.exists()?snap.data():null,expected,body,lib.serverTimestamp()));
  });
  if(gen!==generation)return;
  dirty=false;saving=false;loaded=true;revision=expected+1;clearCache();display('ready');
  if(latest&&latest.revision>revision)consume(latest);
 }catch(e){if(gen===generation){saving=false;display(recoveryFailed?'storage':syncError(e.code))}}
}
function save(state){
 if(!user)return false;
 // The UI prevents concurrent mutations; this also protects asynchronous file imports.
 if(saving||dirty||!loaded)return false;
 try{const checked=diary.validate(structuredClone(state));payload=JSON.stringify(checked);dirty=true;cache();void persist();return false}
 catch{dirty=true;payload=JSON.stringify(state);cache();display('size');return false}
}
q('#sync-import').onclick=()=>{
 if(!user||!loaded||dirty||saving)return;
 if(!confirm(copy.importConfirm[document.documentElement.lang==='vi'?1:0]))return;
 try{const merged=diary.validate(mergeGuest(diary.get(),diary.guest()));diary.replace(merged);save(merged)}catch{display('size')}
};
q('#sync-retry').onclick=()=>{if(saving)return;if(dirty&&ref)void persist();else{const member=user;user=null;void connect(member)}};
q('#sync-reload').onclick=()=>{
 if(saving||!user)return;
 if(dirty)diary.export();
 clearCache();const member=user;user=null;void connect(member);
};
for(const id of ['#track-dialog','#group-dialog','#confirm-dialog'])q(id).addEventListener('close',()=>{if(user&&loaded&&!dirty&&!saving&&latest&&latest.revision>revision)consume(latest)});
window.addEventListener('beforeunload',e=>{if(dirty||saving){e.preventDefault();e.returnValue=''}});
window.addEventListener('offline',()=>{if(user&&!saving)display('offline')});
window.addEventListener('online',()=>{if(user&&!dirty&&!saving){const member=user;user=null;void connect(member)}});
new MutationObserver(()=>display()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
window.SonoraSync={connect,save,message,get session(){return generation},get accountActive(){return !!user},get locked(){return !!user&&(!loaded||dirty||saving||statusKey==='offline')},get hasPending(){return dirty||saving}};
display();
