const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const h=html=>{const t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstElementChild};
const store={get(k,d){try{const v=localStorage.getItem('hubia_'+k);return v===null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('hubia_'+k,JSON.stringify(v))}catch(e){}}};
const ICON={
files:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',
graph:'<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="10" cy="18" r="2.5"/><path d="m8 7.5 7.6 1M7.3 8.2l2 7.5M16.5 10l-4.8 6.3"/>',
switcher:'<path d="M3 12h13M12 7l5 5-5 5M21 4v16"/>',
palette:'<path d="m5 8 5 4-5 4M12 18h7"/>',
edit:'<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
read:'<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1zM12 6v14"/>',
back:'<path d="m15 5-7 7 7 7"/>',fwd:'<path d="m9 5 7 7-7 7"/>',
newnote:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M12 12v6M9 15h6"/>',
newdir:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 11v6M9 14h6"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
scm:'<circle cx="6" cy="5" r="2.2"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="8" r="2.2"/><path d="M6 7.2v9.6M18 10.2c0 4-6 3-12 6.6"/>',
explorer:'<path d="M14 3H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5"/>',
ext:'<path d="M4 4h7v7H4zM4 14h7v7H4zM14 14h7v7h-7zM17.5 3v8M13.5 7h8"/>',
branch:'<circle cx="6" cy="5" r="2.2"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="7" r="2.2"/><path d="M6 7.2v9.6M18 9.2c0 4-8 3-11.5 7.5"/>',
sync:'<path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>',
cloud:'<path d="M7 18a5 5 0 0 1-.7-9.9A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9zM12 17v-6M9 13.5l3-3 3 3"/>'};
const ic=(n,s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;
const win=(title,body,cls='')=>`<div class="win ${cls}"><div class="win-bar"><i></i><i></i><i></i><span>${title}</span><em class="simtag">SIMULACIÓN</em></div>${body}</div>`;
const copyBox=t=>`<div class="copy"><span>${esc(t)}</span><button type="button" data-copy="${esc(t)}">Copiar</button></div>`;
document.addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(!b)return;const t=b.dataset.copy,ok=()=>{const o=b.textContent;b.textContent='¡Copiado!';setTimeout(()=>b.textContent=o,1200)};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,ok);else ok()});

const OS={get mac(){return store.get('os',/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent)?'mac':'win')==='mac'},set(v){store.set('os',v)},get mod(){return this.mac?'⌘':'Ctrl'}};

/* Escena: pantallas consecutivas. Clic fuera del objetivo hace destellar el objetivo. */
function scene(stage,ctx,screens){let i=0;const next=()=>{i=Math.min(i+1,screens.length-1);show()};
  const show=()=>{stage.innerHTML='';const s=screens[i],html=typeof s.html==='function'?s.html():s.html;const el=h(`<div class="scene">${html}</div>`);stage.append(el);if(s.task)ctx.task(s.task);
    $$('[data-next]',el).forEach(b=>b.onclick=e=>{e.stopPropagation();next()});
    el.addEventListener('click',e=>{if(e.target.closest('button,input,a,label,select'))return;$$('.hl',el).forEach(t=>{t.classList.remove('flash');void t.offsetWidth;t.classList.add('flash')})});
    if(s.mount)s.mount(el,next);if(s.end)ctx.done(s.end===true?undefined:s.end)};show()}

/* Recorrido por zonas: un clic en la zona o en su etiqueta muestra su explicación. */
function tour(root,box,zones,attr,ctx){const seen=new Set();root.classList.add('touring');
  const chips=h(`<div class="tchips">${zones.map(z=>`<button type="button" data-z="${z.id}">${z.name}</button>`).join('')}</div>`),info=h('<div class="tourbox">Toca una etiqueta o una zona de la ventana.</div>');
  box.before(chips);box.before(info);box.classList.add('tourwin');
  const sel=id=>{const z=zones.find(x=>x.id===id);if(!z)return;seen.add(id);$$('.zone-on',root).forEach(n=>n.classList.remove('zone-on'));const t=$(`[${attr}="${id}"]`,root);if(t)t.classList.add('zone-on');
    $$('button',chips).forEach(b=>{b.classList.toggle('on',b.dataset.z===id);b.classList.toggle('seen',seen.has(b.dataset.z))});info.innerHTML=`<b>${z.name}.</b> ${z.text}`;
    ctx.task(`Explora las ${zones.length} zonas. Vas ${seen.size} de ${zones.length}.`);if(seen.size===zones.length)ctx.done()};
  chips.onclick=e=>{const b=e.target.closest('[data-z]');if(b)sel(b.dataset.z)};
  root.addEventListener('click',e=>{const z=e.target.closest(`[${attr}]`);e.preventDefault();e.stopPropagation();if(z)sel(z.getAttribute(attr))},true);
  root.addEventListener('input',e=>e.stopPropagation(),true);$$('input,textarea',root).forEach(i=>i.readOnly=true)}

const HUB={tutorials:[],cur:0,step:0,
  add(t){this.tutorials.push(t)},
  prog(id){return store.get('p_'+id,{step:0,max:0})},
  start(){this.tabs();addEventListener('hashchange',()=>this.route());this.route()},
  tabs(){const n=$('.tabs');n.innerHTML=this.tutorials.map((t,i)=>`<button class="tab" role="tab" data-i="${i}" aria-selected="false"><i>${i+1}</i>${t.label} <small>${t.short}</small></button>`).join('');
    n.onclick=e=>{const b=e.target.closest('.tab');if(b){const t=this.tutorials[+b.dataset.i];location.hash=`${t.id}/${this.prog(t.id).step+1}`}}},
  route(){const [id,s]=location.hash.slice(1).split('/');let i=this.tutorials.findIndex(t=>t.id===id);if(i<0)i=0;const t=this.tutorials[i],p=this.prog(t.id);
    const n=s?Math.max(0,Math.min(+s-1||0,t.steps.length-1)):p.step;this.cur=i;this.step=n;store.set('p_'+t.id,{step:n,max:Math.max(p.max,n)});this.render();scrollTo(0,0)},
  go(i,n){location.hash=`${this.tutorials[i].id}/${n+1}`},
  render(){const t=this.tutorials[this.cur],st=t.steps[this.step],N=t.steps.length,p=this.prog(t.id);
    $$('.tab').forEach((b,i)=>b.setAttribute('aria-selected',i===this.cur));
    const app=$('#app');app.innerHTML='';const body=typeof st.html==='function'?st.html():st.html||'';
    const el=h(`<section class="step"><div class="explain"><span class="kick">Paso ${this.step+1} de ${N}</span><h2>${st.title}</h2><p class="phone">Se practica mejor en una compu.</p><div class="prose">${body}</div><div class="mission" hidden><b>Tu misión</b><span class="mt"></span></div></div><div class="stage"></div></section>`);app.append(el);
    const ms=$('.mission',el),mt=$('.mt',ms);let done=!st.gated;
    const bar=$('#bar');const last=this.step===N-1,nextT=this.tutorials[this.cur+1];
    bar.innerHTML=`<button class="btn" id="bk" ${this.step===0?'disabled':''}>← Atrás</button><div class="dots" role="group" aria-label="Pasos">${t.steps.map((_,i)=>`<button data-s="${i}" aria-label="Paso ${i+1}" class="${i===this.step?'cur':i<=p.max?'seen':''}" ${i<=p.max?'':'disabled'}></button>`).join('')}</div><span class="count">${this.step+1} / ${N}</span>${st.gated?'<button class="skip" id="sk">Saltar</button>':''}<button class="btn main" id="nx"></button>`;
    const nx=$('#nx');nx.textContent=last?(nextT?`Ir al tutorial ${this.cur+2} →`:'Volver al inicio'):'Continuar →';nx.disabled=!done;
    const go=()=>{if(!last)this.go(this.cur,this.step+1);else if(nextT)this.go(this.cur+1,0);else this.go(0,0)};
    nx.onclick=go;$('#bk').onclick=()=>this.go(this.cur,this.step-1);$('.dots',bar).onclick=e=>{const b=e.target.closest('[data-s]');if(b&&!b.disabled)this.go(this.cur,+b.dataset.s)};
    const sk=$('#sk');if(sk)sk.onclick=go;
    const ctx={shared:t.shared||(t.shared={}),task(x){if(done&&st.gated)return;ms.hidden=false;mt.innerHTML=x},done(msg){if(done&&!st.gated)return;if(ms.classList.contains('ok'))return;done=true;$('#app .stage').classList.add('finished');nx.disabled=false;nx.classList.add('go');if(sk)sk.remove();ms.hidden=false;ms.classList.add('ok');ms.firstElementChild.textContent='¡Muy bien!';mt.innerHTML=msg||st.okText||(last?'Terminaste este tutorial.':'Pulsa <b>Continuar</b>.')}};
    if(st.task)ctx.task(st.task);if(st.mount)st.mount($('.stage',el),ctx);}};
