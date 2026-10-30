export function errorKey(code) {
 const map={'auth/invalid-credential':'authInvalid','auth/wrong-password':'authInvalid','auth/user-not-found':'authInvalid','auth/invalid-login-credentials':'authInvalid','auth/email-already-in-use':'authExists','auth/invalid-email':'authEmailInvalid','auth/weak-password':'authWeak','auth/password-does-not-meet-requirements':'authWeak','auth/unauthorized-domain':'authDomain','auth/popup-blocked':'authPopup','auth/popup-closed-by-user':'authCancelled','auth/cancelled-popup-request':'authCancelled','auth/too-many-requests':'authRate','auth/operation-not-allowed':'authProvider','auth/user-disabled':'authDisabled','auth/network-request-failed':'authOffline'};
 return map[code]||'authGeneric';
}
export function formIssue(mode,password,confirmation) {
 if(mode==='reset')return null;
 if(mode==='register'&&password!==confirmation)return 'authMismatch';
 if(mode==='register'&&password.length<6)return 'authWeak';
 return null;
}
// Do not report account existence in the password recovery flow.
export function resetResult(code) {return code==='auth/user-not-found'?'authResetSent':errorKey(code)}
