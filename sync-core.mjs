// One revision per diary: a stale device must never silently overwrite another.
export function nextRecord(previous, expected, payload, timestamp) {
 const revision=previous?.revision||0;
 if(revision!==expected)throw Object.assign(new Error('conflict'),{code:'sync/conflict'});
 if(typeof payload!=='string'||new TextEncoder().encode(payload).length>700000)throw Object.assign(new Error('size'),{code:'sync/size'});
 return {revision:revision+1,payload,updatedAt:timestamp};
}
export function mergeGuest(cloud,guest){
 const result=structuredClone(cloud),groups=new Map();
 for(const g of guest.groups){
  const same=result.groups.find(x=>x.name===g.name&&x.color===g.color&&x.shape===g.shape);
  if(same){groups.set(g.id,same.id);continue}
  const id=result.groups.some(x=>x.id===g.id)?'import-'+crypto.randomUUID():g.id;
  groups.set(g.id,id);result.groups.push({...g,id});
 }
 for(const t of guest.tracks.filter(t=>!t.demo)){
  const candidate={...t,group:groups.get(t.group)};
  const comparable=({id,...rest})=>JSON.stringify(rest);
  if(result.tracks.some(x=>comparable(x)===comparable(candidate)))continue;
  if(result.tracks.some(x=>x.id===candidate.id))candidate.id='import-'+crypto.randomUUID();
  result.tracks.push(candidate);
 }
 return result;
}
export function syncError(code){
 if(code==='sync/conflict')return 'conflict';
 if(code==='sync/size')return 'size';
 if(['permission-denied','failed-precondition','not-found'].includes(code))return 'setup';
 return 'offline';
}
