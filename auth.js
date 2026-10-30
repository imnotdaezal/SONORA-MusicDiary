import './sync.js';
import {firebaseConfig} from './firebase-config.js';
import {errorKey,formIssue,resetResult} from './auth-core.mjs';
const q=s=>document.querySelector(s);
let sdk,auth,mode='login',busy=false,ready=false,message='',messageType='',initPromise;
function status(key='',kind=''){message=key;messageType=kind;q('#auth-status').textContent=key?tr(key):'';q('#auth-status').dataset.kind=kind;}
function controls(){
 const member=auth?.currentUser;
 q('#auth-guest').hidden=!!member;q('#auth-member').hidden=!member;
 for(const el of document.querySelectorAll('#auth-google,#auth-submit,#auth-logout,#auth-verify,#auth-refresh'))el.disabled=busy||!ready;
 q('#auth-form').setAttribute('aria-busy',String(busy));
 for(const el of document.querySelectorAll('[data-auth-mode],#auth-forgot'))el.disabled=busy;
 if(member){
  const name=member.displayName||member.email?.split('@')[0]||'SONORA';
  q('#auth-name').textContent=name;q('#auth-member-email').textContent=member.email||'';q('#auth-initial').textContent=name[0].toUpperCase();
  q('#auth-verified').textContent=tr(member.emailVerified?'authVerified':'authUnverified');
  q('#auth-verified').dataset.verified=String(member.emailVerified);
  q('#auth-verify').hidden=member.emailVerified;q('#auth-refresh').hidden=member.emailVerified;
 }
 q('#account').classList.toggle('signed-in',!!member);
 q('#account').title=member?.email||tr('account');
}
function renderMode(){
 const reset=mode==='reset',register=mode==='register';
 q('#auth-password-field').hidden=reset;q('#auth-password').required=!reset;q('#auth-password').disabled=reset;
 q('#auth-password').autocomplete=register?'new-password':'current-password';
 q('#auth-confirm-field').hidden=!register;q('#auth-confirm').required=register;q('#auth-confirm').disabled=!register;
 q('#auth-reset-help').hidden=!reset;
 q('#auth-submit').textContent=tr(reset?'authReset':register?'authRegister':'authLogin');
 q('#auth-forgot').textContent=tr(reset?'authBack':'authForgot');
 q('#auth-show').textContent=tr(q('#auth-password').type==='password'?'authShow':'authHide');
 document.querySelectorAll('[data-auth-mode]').forEach(b=>b.setAttribute('aria-pressed',String(mode===b.dataset.authMode)));
 status(message,messageType);controls();
}
function changeMode(next){mode=next;status();q('#auth-password').value='';q('#auth-confirm').value='';q('#auth-password').type='password';renderMode()}
async function initialize(){
 if(initPromise)return initPromise;
 status('authLoading');q('#auth-retry').hidden=true;
 initPromise=(async()=>{
  const [app,lib]=await Promise.all([import('https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js')]);
  sdk=lib;auth=sdk.getAuth(app.getApps().length?app.getApp():app.initializeApp(firebaseConfig));
  try{await sdk.setPersistence(auth,sdk.browserLocalPersistence)}catch{await sdk.setPersistence(auth,sdk.inMemoryPersistence);status('authStorage')}
  await auth.authStateReady();ready=true;
  sdk.onAuthStateChanged(auth,()=>{window.SonoraSync?.connect(auth.currentUser);controls();q('#auth-password').value='';q('#auth-confirm').value=''});
  if(message==='authLoading')status();controls();
 })().catch(()=>{ready=false;status('authOffline','error');q('#auth-retry').hidden=false;initPromise=null;controls()});
 return initPromise;
}
async function run(action){if(busy||!ready)return;busy=true;auth.languageCode=document.documentElement.lang;status('authWorking');controls();try{await action()}catch(e){status(errorKey(e.code),'error')}finally{busy=false;controls()}}
q('#auth-google').onclick=()=>run(async()=>{
 const provider=new sdk.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
 await sdk.signInWithPopup(auth,provider);status('authSignedIn','success');
});
q('#auth-form').onsubmit=e=>{e.preventDefault();const email=q('#auth-email').value.trim(),password=q('#auth-password').value,confirmation=q('#auth-confirm').value;
 const issue=formIssue(mode,password,confirmation);if(issue){status(issue,'error');return}
 const actionMode=mode;
 run(async()=>{
  if(actionMode==='reset'){
   try{await sdk.sendPasswordResetEmail(auth,email);status('authResetSent','success')}catch(e){status(resetResult(e.code),e.code==='auth/user-not-found'?'success':'error')}
  }else if(actionMode==='register'){
   const result=await sdk.createUserWithEmailAndPassword(auth,email,password);
   try{await sdk.sendEmailVerification(result.user);status('authVerificationSent','success')}catch{status('authCreatedNoEmail','error')}
  }else{await sdk.signInWithEmailAndPassword(auth,email,password);status('authSignedIn','success')}
  q('#auth-password').value='';q('#auth-confirm').value='';
 });
};
q('#auth-logout').onclick=()=>run(async()=>{if(window.SonoraSync?.hasPending){status('syncBeforeLogout','error');return}await sdk.signOut(auth);changeMode('login');q('#auth-email').value='';status('authSignedOut','success')});
q('#auth-verify').onclick=()=>run(async()=>{if(!auth.currentUser)return;await sdk.sendEmailVerification(auth.currentUser);status('authVerificationSent','success')});
q('#auth-refresh').onclick=()=>run(async()=>{if(!auth.currentUser)return;await sdk.reload(auth.currentUser);await auth.currentUser.getIdToken(true);status(auth.currentUser.emailVerified?'authVerified':'authUnverified',auth.currentUser.emailVerified?'success':'');controls()});
q('#auth-retry').onclick=initialize;
q('#auth-forgot').onclick=()=>changeMode(mode==='reset'?'login':'reset');
q('#auth-show').onclick=()=>{q('#auth-password').type=q('#auth-password').type==='password'?'text':'password';renderMode()};
document.querySelectorAll('[data-auth-mode]').forEach(b=>b.onclick=()=>changeMode(b.dataset.authMode));
q('#account-dialog').addEventListener('close',()=>{q('#auth-password').value='';q('#auth-confirm').value='';q('#auth-password').type='password';renderMode()});
new MutationObserver(()=>{if(auth)auth.languageCode=document.documentElement.lang;renderMode()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
renderMode();initialize();
