'use strict';
const DiaryCore=(()=>{
 const hex=/^#[0-9a-f]{6}$/i;
 const defaults={new:{name:'Morning Glow',mood:'morning',shape:'morning',old:['Những khởi đầu','New beginnings']},quiet:{name:'Afternoon Drift',mood:'afternoon',shape:'afternoon',old:['Những ngày dịu dàng','Softer days']},night:{name:'Midnight Blue',mood:'night',shape:'night',old:['Thành phố sau nửa đêm','City after midnight']}};
 function palette(t){return Array.isArray(t.colors)&&t.colors.length?t.colors:[t.color||'#bba2f6']}
 function validPalette(a){return Array.isArray(a)&&a.length>=1&&a.length<=3&&a.every(c=>typeof c==='string'&&hex.test(c))}
 function normalize(s){for(const g of s.groups){const d=defaults[g.id];if(d&&(d.old.includes(g.name)||g.name===d.name)){g.name=d.name;g.mood=d.mood;g.shape=d.shape}g.shape||='afternoon'}for(const t of s.tracks){t.colors=palette(t).slice();t.color=t.colors[0]}return s}
 function rgb(h){return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16))}
 function mix(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t)}
 function cycle(colors,seconds,reduced=false){if(colors.length===1||reduced)return rgb(colors[0]);const pos=seconds/6,i=Math.floor(pos)%colors.length,u=(1-Math.cos(Math.PI*(pos%1)))/2;return mix(rgb(colors[i]),rgb(colors[(i+1)%colors.length]),u)}
 function css(rgb){return 'rgb('+rgb.map(Math.round).join(',')+')'}
 return {palette,validPalette,normalize,rgb,mix,cycle,css};
})();
if(typeof module!=='undefined')module.exports=DiaryCore;
