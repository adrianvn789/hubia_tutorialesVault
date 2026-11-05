/* Motor de git de juguete: commits como listas de archivos. Basta para mostrar pull, push, ramas y conflictos. */
let cid=0;
class Repo{
  constructor(files){const c=this.mk('Importar vault','Equipo',files);this.local={main:[c]};this.remote={main:[c]};this.branch='main';this.edits={};this.staged=new Set();this.conflict=null;this.fns=[]}
  mk(msg,author,files,merge=false){const id='c'+(++cid);(Repo.all=Repo.all||{})[id]={id,msg,author,files,merge};return id}
  on(f){this.fns.push(f)}emit(ev){this.fns.forEach(f=>f(ev))}
  c(id){return Repo.all[id]}
  tree(list){const t={};list.forEach(i=>Object.assign(t,this.c(i).files));return t}
  head(){return this.local[this.branch]}
  work(){return{...this.tree(this.head()),...this.edits}}
  changes(){const b=this.tree(this.head());return Object.keys(this.edits).filter(p=>this.edits[p]!==b[p]).map(p=>({path:p,status:p in b?'M':'U',before:b[p]||'',after:this.edits[p]}))}
  get published(){return this.branch in this.remote}
  ahead(){const r=new Set(this.remote[this.branch]||[]);return this.head().filter(i=>!r.has(i)).length}
  behind(){const l=new Set(this.head());return(this.remote[this.branch]||[]).filter(i=>!l.has(i)).length}
  edit(p,t){this.edits[p]=t;this.emit('edit')}
  commit(msg,author='Tú'){let ch=this.changes();if(this.staged.size)ch=ch.filter(c=>this.staged.has(c.path));if(!ch.length&&!this.resolved)return false;const files={};ch.forEach(c=>{files[c.path]=c.after;delete this.edits[c.path]});
    this.head().push(this.mk(msg,author,files,!!this.resolved));this.resolved=false;this.staged.clear();this.emit('commit');return true}
  remoteCommit(files,msg,author='Compañera'){this.remote[this.branch].push(this.mk(msg,author,files));this.emit('remote')}
  pull(){const r=this.remote[this.branch]||[],l=this.head(),ls=new Set(l),inc=r.filter(i=>!ls.has(i));if(!inc.length){this.emit('pull');return}
    const rs=new Set(r),out=l.filter(i=>!rs.has(i));
    if(!out.length){this.local[this.branch]=[...r];this.emit('pull');return}
    const mine=this.tree(out),theirs=this.tree(inc),clash=Object.keys(mine).find(p=>p in theirs&&mine[p]!==theirs[p]);
    if(clash){this.conflict={path:clash,ours:mine[clash],theirs:theirs[clash],done:false,inc};this.emit('conflict');return}
    const m=this.mk(`Merge branch '${this.branch}' de GitHub`,'Tú',{},true);this.local[this.branch]=[...r,...out,m];this.emit('pull')}
  resolve(text){const c=this.conflict;c.done=true;c.text=text;this.emit('resolved')}
  finishMerge(){const c=this.conflict,r=this.remote[this.branch],rs=new Set(r),out=this.head().filter(i=>!rs.has(i));const m=this.mk(`Merge branch '${this.branch}' de GitHub`,'Tú',{[c.path]:c.text},true);this.local[this.branch]=[...r,...out,m];this.conflict=null;this.staged.clear();this.emit('commit')}
  push(){this.remote[this.branch]=[...this.head()];this.emit('push')}
  sync(){this.pull();if(!this.conflict){this.push();this.emit('sync')}}
  createBranch(n){this.local[n]=[...this.head()];this.branch=n;this.emit('branch')}
  checkout(n){this.branch=n;this.emit('checkout')}
  publish(){this.remote[this.branch]=[...this.head()];this.emit('publish')}
  merge(n){const a=this.head(),s=new Set(a),add=this.local[n].filter(i=>!s.has(i));this.local[this.branch]=[...a,...add];this.emit('merge')}
}
const lineDiff=(a,b)=>{const A=a.split('\n'),B=b.split('\n');let s=0;while(s<A.length&&s<B.length&&A[s]===B[s])s++;let e=0;while(e<A.length-s&&e<B.length-s&&A[A.length-1-e]===B[B.length-1-e])e++;
  return[...A.slice(0,s).map(t=>['',t]),...A.slice(s,A.length-e).map(t=>['del',t]),...B.slice(s,B.length-e).map(t=>['add',t]),...A.slice(A.length-e).map(t=>['',t])]};
const conflictParts=(o,t)=>{const A=o.split('\n'),B=t.split('\n');let s=0;while(s<A.length&&s<B.length&&A[s]===B[s])s++;let e=0;while(e<A.length-s&&e<B.length-s&&A[A.length-1-e]===B[B.length-1-e])e++;return{pre:A.slice(0,s),ours:A.slice(s,A.length-e),theirs:B.slice(s,B.length-e),post:A.slice(A.length-e)}};

const baseName=p=>p.split('/').pop();
const vsActivity=(on,badge=0,hl='')=>`<div class="vs-act" data-tour="act"><button class="${on==='explorer'?'on':''} ${hl==='explorer'?'hl':''}" data-v="explorer" aria-label="Explorer">${ic('explorer',22)}</button><button aria-label="Search">${ic('search',22)}</button><button class="${on==='scm'?'on':''} ${hl==='scm'?'hl':''}" data-v="scm" data-tour="scm" aria-label="Source Control">${ic('scm',22)}${badge?`<b>${badge}</b>`:''}</button><button aria-label="Extensions">${ic('ext',22)}</button></div>`;

class VS{
  constructor(el,repo,opt={}){this.el=el;this.r=repo;this.view='scm';this.msg=opt.msg||'';this.open=null;this.ov=null;this.always=false;this.syncOk=false;this.hl=opt.hl||null;this.toast=null;this.showMenuFor=opt.menu;repo.on(ev=>this.onRepo(ev));this.render()}
  onRepo(ev){if(ev==='conflict')this.toast='Git: Automatic merge failed; fix conflicts and then commit the result.';if(ev==='commit'||ev==='sync'||ev==='checkout'||ev==='branch'){if(this.open&&!this.r.conflict)this.open=null}if(ev==='resolved'){this.toast=null;if(innerWidth<=640)this.open=null}this.render()}
  target(){return typeof this.hl==='function'?this.hl(this):this.hl}
  primary(){const r=this.r,ch=r.changes(),a=r.ahead(),b=r.behind();
    if(r.conflict&&r.conflict.done&&r.staged.has(r.conflict.path))return{a:'commit',t:'✓ Commit'};
    if(r.conflict)return{a:'commit',t:'✓ Commit',off:true};
    if(ch.length)return{a:'commit',t:`✓ Commit`};
    if(!r.published)return{a:'publish',t:'☁ Publish Branch'};
    if(a||b)return{a:'sync',t:`↕ Sync Changes ${b?b+'↓ ':''}${a?a+'↑':''}`};
    return{a:'commit',t:'✓ Commit',off:true}}
  render(){const r=this.r,ch=r.changes(),p=this.primary(),t=this.target(),a=r.ahead(),b=r.behind(),badge=ch.length+(r.conflict?1:0),staged=ch.filter(c=>r.staged.has(c.path)),un=ch.filter(c=>!r.staged.has(c.path));
    const hlc=k=>t===k?'hl':'';
    const row=(c,st)=>`<button class="vs-row ${this.open&&this.open.path===c.path?'on':''} ${hlc('file')}" data-open="${esc(c.path)}"><span class="nm">${esc(baseName(c.path))}</span><span class="act ${hlc(st?'unstage':'stage')}" data-${st?'unstage':'stage'}="${esc(c.path)}" role="button" aria-label="${st?'Quitar':'Preparar'}">${st?'−':'+'}</span><span class="st ${c.status}">${c.status}</span></button>`;
    const cf=r.conflict;
    let side='';
    if(this.view==='scm'){side=`<div class="vs-ttl" data-tour="title"><span>Source Control</span><button class="${hlc('menu')}" data-menu aria-label="Más acciones">···</button></div>
      <textarea class="vs-in ${hlc('msg')}" data-tour="msg" rows="2" placeholder='Message (${OS.mod}+Enter to commit on "${esc(r.branch)}")'>${esc(this.msg)}</textarea>
      <button class="vs-pri ${hlc('pri')}" data-tour="pri" data-pri="${p.a}" ${p.off?'disabled':''}>${p.t}</button>
      ${cf&&!(cf.done&&r.staged.has(cf.path))?`<div class="vs-sec"><span>Merge Changes</span><b>1</b></div><button class="vs-row ${hlc('cfile')}" data-cf><span class="nm">${esc(baseName(cf.path))}</span>${cf.done?`<span class="act ${hlc('cstage')}" data-cstage role="button" aria-label="Preparar">+</span>`:''}<span class="st C">${cf.done?'M':'C'}</span></button>`:''}
      ${cf&&cf.done&&r.staged.has(cf.path)?`<div class="vs-sec"><span>Staged Changes</span><b>1</b></div><div class="vs-row"><span class="nm">${esc(baseName(cf.path))}</span><span class="st">M</span></div>`:''}
      ${staged.length?`<div class="vs-sec"><span>Staged Changes</span><b>${staged.length}</b></div>${staged.map(c=>row(c,1)).join('')}`:''}
      <div class="vs-sec" data-tour="changes"><span>Changes</span><b>${un.length}</b></div>${un.map(c=>row(c,0)).join('')}
      <div class="vs-sec" data-tour="graph"><span>Graph</span></div>${[...r.head()].reverse().slice(0,6).map(i=>{const c=r.c(i);return`<div class="vs-log ${c.author==='Tú'?'me':''}"><i></i><span>${esc(c.msg)}</span><em>${esc(c.author)}</em></div>`}).join('')}`}
    else{const w=Object.keys(r.work()).sort();side=`<div class="vs-ttl"><span>Explorer</span></div><div class="vs-sec"><span>hubia_organizadoresVault</span></div>${w.map(f=>`<div class="vs-row"><span class="nm">${esc(f)}</span></div>`).join('')}`}
    let ed='<div class="vs-welcome" data-tour="editor"><b>VS Code</b>Toca un archivo para ver sus cambios</div>';
    if(this.open){if(this.open.conflict&&cf){const q=conflictParts(cf.ours,cf.theirs);ed=cf.done?`<div class="vs-tab"><button class="vs-back ${t!=='accept'&&innerWidth<=640?'hl':''}" data-close>← Volver</button>${esc(baseName(cf.path))}</div><div class="code">${cf.text.split('\n').map(l=>`<div>${esc(l)||' '}</div>`).join('')}</div>`:`<div class="vs-tab"><button class="vs-back ${t!=='accept'&&innerWidth<=640?'hl':''}" data-close>← Volver</button>${esc(baseName(cf.path))}</div><div class="code">${q.pre.map(l=>`<div>${esc(l)||' '}</div>`).join('')}<div class="lens"><button class="${hlc('accept')}" data-acc="cur">Accept Current Change</button> | <button class="${hlc('accept')}" data-acc="inc">Accept Incoming Change</button> | <button class="${hlc('accept')}" data-acc="both">Accept Both Changes</button></div><div class="cur mk">&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD (Current Change = lo tuyo)</div>${q.ours.map(l=>`<div class="cur">${esc(l)||' '}</div>`).join('')}<div class="mk">=======</div>${q.theirs.map(l=>`<div class="inc">${esc(l)||' '}</div>`).join('')}<div class="inc mk">&gt;&gt;&gt;&gt;&gt;&gt;&gt; origin/main (Incoming Change = lo de tu compañera)</div>${q.post.map(l=>`<div>${esc(l)||' '}</div>`).join('')}</div>`}
      else{const c=ch.find(x=>x.path===this.open.path);if(c)ed=`<div class="vs-tab"><button class="vs-back ${t!=='accept'&&innerWidth<=640?'hl':''}" data-close>← Volver</button>${esc(baseName(c.path))} (Working Tree)</div><div class="code">${lineDiff(c.before,c.after).map(([k,l])=>`<div class="${k}">${k==='add'?'+ ':k==='del'?'- ':'  '}${esc(l)||' '}</div>`).join('')}</div>`}}
    const ov=this.ov?this.ov():'';
    const pending=r.published?`↓${b} ↑${a}`:'';
    this.el.innerHTML=`<div class="vs"><div class="vs-main ${this.open?'ed':''}">${vsActivity(this.view,badge)}<div class="vs-side" data-tour="side">${side}</div><div class="vs-ed">${ed}</div></div><div class="vs-status" data-tour="status"><button class="${hlc('branch')}" data-branch>${ic('branch',13)} ${esc(r.branch)}${ch.length||(cf&&!cf.done)?'*':''}</button><button class="${hlc('statsync')}" data-statsync aria-label="Sincronizar">${r.published?ic('sync',13):ic('cloud',13)} ${pending}</button><span class="r">Ln 1, Col 1</span></div>${ov}${this.toast?`<div class="vs-toast">${esc(this.toast)}</div>`:''}</div>`;
    this.bind()}
  bind(){const q=(s,f)=>$$(s,this.el).forEach(b=>b.onclick=e=>{e.stopPropagation();f(b,e)}),r=this.r;
    const ta=$('.vs-in',this.el);if(ta)ta.oninput=()=>{this.msg=ta.value;const k=this.target(),b=$('.vs-pri',this.el);ta.classList.toggle('hl',k==='msg');if(b)b.classList.toggle('hl',k==='pri')};
    q('[data-v]',b=>{this.view=b.dataset.v;this.render()});
    q('[data-open]',b=>{this.open={path:b.dataset.open};this.render();this.onOpen&&this.onOpen()});
    q('[data-stage]',b=>{r.staged.add(b.dataset.stage);this.render()});q('[data-unstage]',b=>{r.staged.delete(b.dataset.unstage);this.render()});
    q('[data-cf]',()=>{this.open={conflict:true,path:r.conflict.path};this.render()});
    q('[data-cstage]',()=>{r.staged.add(r.conflict.path);r.emit('cstaged');this.render()});
    q('[data-close]',()=>{this.open=null;this.render()});
    q('[data-acc]',b=>{const c=r.conflict,x=conflictParts(c.ours,c.theirs),k=b.dataset.acc,m=k==='cur'?x.ours:k==='inc'?x.theirs:[...x.ours,...x.theirs];r.resolve([...x.pre,...m,...x.post].join('\n'))});
    q('[data-pri]',b=>{const a=b.dataset.pri;if(a==='commit')this.doCommit();if(a==='sync')this.doSync();if(a==='publish')r.publish()});
    q('[data-statsync]',()=>{r.published?this.doSync():r.publish()});
    q('[data-branch]',()=>this.pickBranch());
    q('[data-menu]',()=>this.menu());
    if(this.ov){q('[data-x]',()=>{this.ov=null;this.render()});if(this.ovBind)this.ovBind()}}
  dialog(text,btns){this.ov=()=>`<div class="vs-dlg"><p>${esc(text)}</p><div class="row">${btns.map((b,i)=>`<button data-d="${i}" class="${b.pri?'pri '+(this.target()==='dlg'?'hl':''):''}">${esc(b.t)}</button>`).join('')}</div></div>`;
    this.ovBind=()=>$$('[data-d]',this.el).forEach(x=>x.onclick=e=>{e.stopPropagation();this.ov=null;this.ovBind=null;this.render();const f=btns[+x.dataset.d].f;f&&f()});this.render()}
  doCommit(){const r=this.r;if(r.conflict){this.r.finishMerge();this.msg='';return}
    if(!this.msg.trim()){this.dialog('Escribe primero un mensaje en la cajita de arriba. (El VS Code real abre un archivo para pedírtelo: es más confuso, así que mejor escríbelo antes).',[{t:'Entendido',pri:1}]);return}
    const go=()=>{const m=this.msg;this.msg='';r.commit(m)};
    if(r.staged.size||this.always)return go();
    this.dialog('There are no staged changes to commit. Would you like to stage all your changes and commit them directly?',[{t:'Yes',pri:1,f:go},{t:'Always',f:()=>{this.always=true;go()}},{t:'Never'},{t:'Cancel'}])}
  doSync(){const go=()=>this.r.sync();if(this.syncOk)return go();this.dialog(`This action will pull and push commits from and to "origin/${this.r.branch}".`,[{t:'OK',pri:1,f:()=>{this.syncOk=true;go()}},{t:"OK, Don't Show Again",f:()=>{this.syncOk=true;go()}},{t:'Cancel'}])}
  menu(){const hlc=k=>this.target()===k?'hl':'';this.ov=()=>`<div class="vs-menu" style="left:52px;top:30px">${this.sub==='branch'?`<button data-sb="back">‹ Branch</button><hr><button data-m="newb">Create Branch...</button><button data-m="merge" class="${hlc('mMerge')}">Merge...</button><button data-m="pub">Publish Branch...</button>`:`<button data-m="pull" class="${hlc('mPull')}">Pull</button><button data-m="push">Push</button><button data-m="sync">Sync</button><hr><button data-sb="branch" class="${hlc('mBranch')}">Branch <span>›</span></button><hr><button data-x>Cerrar</button>`}</div>`;
    this.ovBind=()=>{$$('[data-sb]',this.el).forEach(b=>b.onclick=e=>{e.stopPropagation();this.sub=b.dataset.sb==='branch'?'branch':null;this.render()});$$('[data-m]',this.el).forEach(b=>b.onclick=e=>{e.stopPropagation();const k=b.dataset.m;this.ov=null;this.sub=null;this.ovBind=null;this.render();if(k==='pull')this.r.pull();if(k==='push')this.r.push();if(k==='sync')this.doSync();if(k==='newb')this.askBranch();if(k==='merge')this.pickMerge();if(k==='pub')this.r.publish()})};this.render();this.onMenu&&this.onMenu()}
  pickBranch(){const r=this.r,hlc=k=>this.target()===k?'hl':'';this.ov=()=>`<div class="vs-q"><input readonly placeholder="Select a branch or tag to checkout"><button class="vs-row ${hlc('qNew')}" data-nb><span class="nm">+ Create new branch...</span></button>${Object.keys(r.local).map(b=>`<button class="vs-row ${hlc('q:'+b)}" data-cb="${esc(b)}">${ic('branch',13)}<span class="nm">${esc(b)}</span><small>${b===r.branch?'actual':''}</small></button>`).join('')}<button class="vs-row" data-x><span class="nm">Cerrar</span></button></div>`;
    this.ovBind=()=>{const nb=$('[data-nb]',this.el);if(nb)nb.onclick=e=>{e.stopPropagation();this.askBranch()};$$('[data-cb]',this.el).forEach(b=>b.onclick=e=>{e.stopPropagation();this.ov=null;this.ovBind=null;r.checkout(b.dataset.cb)})};this.render()}
  askBranch(){const sug=this.suggest||'docs/estatutoV2_revision';this.ov=()=>`<div class="vs-q"><input id="nb" placeholder="Please provide a new branch name" value="${esc(this.nbv||'')}"><p>Sin espacios. Ejemplo: ${esc(sug)}</p><button class="vs-row ${this.target()==='qFill'?'hl':''}" data-fill><span class="nm">Usar «${esc(sug)}»</span></button><button class="vs-row" data-x><span class="nm">Cancelar</span></button></div>`;
    this.ovBind=()=>{const i=$('#nb',this.el),go=v=>{v=v.trim().replace(/\s+/g,'_');if(!v)return;this.ov=null;this.ovBind=null;this.r.createBranch(v)};i.focus();i.onkeydown=e=>{if(e.key==='Enter')go(i.value)};$('[data-fill]',this.el).onclick=e=>{e.stopPropagation();go(sug)}};this.render()}
  pickMerge(){const r=this.r,o=Object.keys(r.local).filter(b=>b!==r.branch);this.ov=()=>`<div class="vs-q"><input readonly placeholder="Select a branch or tag to merge from">${o.map(b=>`<button class="vs-row ${this.target()==='qm'?'hl':''}" data-mb="${esc(b)}">${ic('branch',13)}<span class="nm">${esc(b)}</span></button>`).join('')}<button class="vs-row" data-x><span class="nm">Cerrar</span></button></div>`;
    this.ovBind=()=>$$('[data-mb]',this.el).forEach(b=>b.onclick=e=>{e.stopPropagation();this.ov=null;this.ovBind=null;r.merge(b.dataset.mb)});this.render()}
}
/* Obsidian pequeño conectado al repo */
class ObsMini{
  constructor(el,repo,open,sample){this.el=el;this.r=repo;this.path=open;this.sample=sample;this.prev=new Set(Object.keys(repo.work()));repo.on(ev=>{if(ev!=='edit')this.render()});this.render()}
  render(){const w=this.r.work(),fs=Object.keys(w).sort(),fresh=fs.filter(f=>!this.prev.has(f));if(fresh.length)this.path=fresh[0];if(!(this.path in w))this.path=fs[0];
    this.el.innerHTML=`<div class="ob obmini" style="height:100%"><div class="ob-left"><div class="vs-ttl" style="color:#aaa">Vault · ${esc(this.r.branch)}</div>${fs.map(f=>`<button class="ob-it ${f===this.path?'on':''} ${fresh.includes(f)?'flash':''}" data-f="${esc(f)}"><span class="nm">${esc(baseName(f).replace('.md',''))}${fresh.includes(f)?' <span class="ext">nueva</span>':''}</span></button>`).join('')}</div><div class="ob-main"><div class="ob-head"><span class="t">${esc(baseName(this.path))}</span></div><div class="ob-body"><textarea aria-label="Contenido de la nota">${esc(w[this.path])}</textarea>${this.sample?`<button class="btn ${this.hot?'hl':''}" data-s style="background:#fff;color:var(--red);margin-top:6px;font-size:13px;padding:3px 12px">✍️ Escribir por mí</button>`:''}</div></div></div>`;
    this.prev=new Set(fs);const ta=$('textarea',this.el);ta.oninput=()=>this.r.edit(this.path,ta.value);
    $$('[data-f]',this.el).forEach(b=>b.onclick=()=>{this.path=b.dataset.f;this.render()});
    const s=$('[data-s]',this.el);if(s)s.onclick=()=>{this.hot=false;s.classList.remove('hl');const t=ta.value.replace(/\n*$/,'')+'\n'+this.sample+'\n';ta.value=t;this.r.edit(this.path,t)}}
}
/* Banda con los commits en GitHub y en tu compu */
function cloudStrip(el,r){const dots=l=>(l||[]).map(i=>{const c=r.c(i);return`<span class="dot ${c.merge?'merge':c.author==='Tú'?'me':''}" title="${esc(c.msg)} · ${esc(c.author)}"></span>`}).join('');
  const draw=()=>{const a=r.ahead(),b=r.behind(),pub=r.published;let s='Todo igual ✅';if(!pub)s='Rama solo en tu compu';else if(a&&b)s=`Te faltan ${b} y falta subir ${a}`;else if(a)s=`Falta subir ${a} a GitHub`;else if(b)s=`Te falta bajar ${b} de GitHub`;const ch=r.changes().length;
    el.innerHTML=`<div class="lane"><b>☁️ GitHub</b><div class="ds">${dots(r.remote[r.branch])}${pub?'':'<em>esta rama no existe aún</em>'}</div></div><div class="lane"><b>💻 Tu compu</b><div class="ds">${dots(r.head())}<em>${esc(r.branch)} · ${s}${ch?` · ${ch} archivo(s) sin commit`:''}</em></div></div><div class="legend"><span><i class="me"></i>tu commit</span><span><i></i>commit de otra persona</span></div>`};r.on(draw);draw()}
function gitStage(stage,repo,o={}){stage.innerHTML='';const g=h(`<div class="gitstage"><div class="strip"></div>${win('Visual Studio Code','<div class="v" style="flex:1;display:flex;min-height:0"></div>','dark')}${win('Obsidian','<div class="m" style="flex:1;min-height:0"></div>','dark')}</div>`);stage.append(g);
  cloudStrip($('.strip',g),repo);const box=$('.v',g);box.style.flexDirection='column';const vs=new VS(box,repo,o);const mini=new ObsMini($('.m',g),repo,o.open||Object.keys(repo.work())[0],o.sample);return{vs,mini,g}}
