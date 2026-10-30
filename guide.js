let lang='en';
const labels={morning:{en:'Morning / for your joy',vi:'Buổi sáng / dành cho niềm vui'},afternoon:{en:'Afternoon / for your calm',vi:'Buổi chiều / dành cho sự bình yên'},night:{en:'Midnight / for what you feel deeply',vi:'Buổi đêm / dành cho cảm xúc sâu lắng'}};
let mood='morning';
function caption(){document.querySelector('#mood-caption').textContent=labels[mood][lang]}
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{lang=b.dataset.lang;document.documentElement.lang=lang;document.querySelectorAll('[data-lang]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));caption()}));
document.querySelectorAll('button[data-mood]').forEach(b=>b.addEventListener('click',()=>{mood=b.dataset.mood;document.querySelector('.mood-scene').dataset.mood=mood;document.querySelector('.mood-star').textContent={morning:'✺',afternoon:'✦',night:'★'}[mood];document.querySelectorAll('button[data-mood]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));caption()}));
const nav=[...document.querySelectorAll('.reading-nav a[href^="#"]')];
const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)nav.forEach(a=>{const current=a.hash==='#'+e.target.id;a.classList.toggle('active',current);if(current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})},{rootMargin:'-15% 0px -55% 0px'});document.querySelectorAll('.chapter').forEach(s=>observer.observe(s));
window.addEventListener('scroll',()=>{const total=document.documentElement.scrollHeight-innerHeight;document.querySelector('#progress').style.width=(total?scrollY/total*100:0)+'%'},{passive:true});
