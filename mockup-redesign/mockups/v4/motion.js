/* V4: lapisan gerak. Hitung naik, stagger masuk, indikator menu, tilt 3D + sorotan, kartu balik, palet perintah, konfeti, hero 3D. */
(function(){
var A=window.EduApp,E=window.EDUDATA;
var reduceMq=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)');
function off(){return (reduceMq&&reduceMq.matches)||document.documentElement.getAttribute('data-motion')==='off'}
function raf(f){requestAnimationFrame(f)}

/* ---- hitung naik angka ---- */
function countUp(n){
 var t=n.textContent,mt=t.match(/(\d{1,3}(?:\.\d{3})+|\d+(?:,\d+)?)/);if(!mt)return;
 var raw=mt[1],th=/^\d{1,3}(\.\d{3})+$/.test(raw),dec=th?0:(raw.split(',')[1]||'').length,val=th?+raw.replace(/\./g,''):+raw.replace(',','.');
 var pre=t.slice(0,mt.index),post=t.slice(mt.index+raw.length),t0=performance.now(),dur=900;
 (function f(now){var p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,3),v=val*e,s=th?String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g,'.'):v.toFixed(dec).replace('.',',');
  n.textContent=pre+s+post;if(p<1&&n.isConnected)raf(f)})(t0)
}

/* ---- konfeti ---- */
function confetti(el){
 if(off())return;
 var old=el.querySelector('.cf');if(old)old.remove();
 var cv=document.createElement('canvas');cv.className='cf';cv.width=el.clientWidth;cv.height=el.clientHeight;el.appendChild(cv);
 var g=cv.getContext('2d'),cols=['#8b84ff','#4f46e5','#22d3ee','#34d399','#fbbf24','#f472b6'],ps=[];
 for(var i=0;i<90;i++)ps.push({x:cv.width/2+(Math.random()-.5)*160,y:cv.height*0.62,vx:(Math.random()-.5)*11,vy:-Math.random()*13-4,s:4+Math.random()*6,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:cols[i%cols.length]});
 var t0=performance.now();
 (function f(now){var dt=now-t0;g.clearRect(0,0,cv.width,cv.height);
  ps.forEach(function(p){p.vy+=.34;p.x+=p.vx;p.y+=p.vy;p.vx*=.992;p.r+=p.vr;g.save();g.translate(p.x,p.y);g.rotate(p.r);g.globalAlpha=Math.max(0,1-dt/1900);g.fillStyle=p.c;g.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6);g.restore()});
  if(dt<2000&&cv.isConnected)raf(f);else cv.remove()})(t0)
}

/* ---- palet perintah ---- */
function palItems(m,inst){
 var S=inst.S,role=S.user.role,q=(m.pal.q||'').toLowerCase(),items=[];
 inst.navItems().forEach(function(n){items.push({g:'Halaman',t:n.label,s:n.sec,i:n.icon,run:function(){inst.nav(n.r)}})});
 var Q={admin:[['Tambah siswa','users','addStudent'],['Buat tagihan','rcpt','addInv'],['Tambah materi','folder','addMat'],['Buat pengumuman','mega','addAnn'],['Impor siswa dari CSV','ul','importCsv']],
  educator:[['Tambah materi','folder','addMat'],['Buat pengumuman','mega','addAnn']],student:[],parent:[]}[role]||[];
 Q.forEach(function(a){items.push({g:'Aksi cepat',t:a[0],s:'Perintah',i:a[1],run:function(){inst.run(a[2],{})}})});
 if(role==='admin'){items.push({g:'Aksi cepat',t:'Pendaftaran siswa baru',s:'Perintah',i:'clip',run:function(){inst.nav('enrollment')}});
  E.D.students.forEach(function(s){items.push({g:'Siswa',t:s.full_name,s:s.code+' · '+s.year,i:'user',run:function(){inst.run('rapor',{id:s.id})}})})}
 items.push({g:'Tampilan',t:S.mode==='dark'?'Beralih ke mode terang':'Beralih ke mode gelap',s:'Perintah',i:S.mode==='dark'?'sun':'moon',run:function(){inst.setMode(S.mode==='dark'?'light':'dark')}});
 if(q)items=items.filter(function(x){return (x.t+' '+x.s).toLowerCase().indexOf(q)>=0});
 return items.slice(0,9);
}
function palRender(el,m,inst){
 var old=el.querySelector('.pal-ov');if(old)old.remove();
 if(!m.pal.open)return;
 var items=palItems(m,inst);m.pal.items=items;if(m.pal.i>=items.length)m.pal.i=Math.max(0,items.length-1);
 var H=A.H,lastG='',h='';
 items.forEach(function(it,i){if(it.g!==lastG){h+='<div class="pal-g">'+it.g+'</div>';lastG=it.g}h+='<button type="button" class="pal-i'+(i===m.pal.i?' on':'')+'" data-m="palgo" data-k="'+i+'">'+H.ic(it.i)+'<span>'+H.esc(it.t)+'</span><small>'+H.esc(it.s)+'</small></button>'});
 var div=document.createElement('div');div.className='pal-ov';div.setAttribute('data-m','palclose');
 div.innerHTML='<div class="pal" role="dialog" aria-label="Palet perintah"><div class="pal-in">'+H.ic('srch')+'<input id="pal-q" autocomplete="off" placeholder="Ketik halaman, siswa, atau perintah…" value="'+H.esc(m.pal.q)+'"><kbd>Esc</kbd></div><div class="pal-list">'+(h||'<div class="pal-e">Tidak ada hasil</div>')+'</div><div class="pal-foot"><span><kbd>↑</kbd><kbd>↓</kbd> pilih</span><span><kbd>Enter</kbd> buka</span><span><kbd>Esc</kbd> tutup</span></div></div>';
 el.appendChild(div);
 var inp=div.querySelector('#pal-q');inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length);
}
function palOpen(el){var m=el.__m;if(!m||!m.inst||!m.inst.S.user)return;m.pal={open:true,q:'',i:0};palRender(el,m,m.inst)}
function palClose(el){var m=el.__m;if(!m)return;m.pal.open=false;var o=el.querySelector('.pal-ov');if(o)o.remove()}
function palGo(el,k){var m=el.__m,it=m.pal.items[k];if(!it)return;palClose(el);it.run()}

/* ---- pendengar sekali per instans ---- */
function bind(el,m){
 el.addEventListener('mousemove',function(e){
  if(off())return;var t=e.target.closest&&e.target.closest('.fx');if(!t)return;
  var r=t.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
  t.style.setProperty('--mx',(x*100).toFixed(1)+'%');t.style.setProperty('--my',(y*100).toFixed(1)+'%');
  if(t.classList.contains('tilt')){t.style.setProperty('--rx',((0.5-y)*9).toFixed(2)+'deg');t.style.setProperty('--ry',((x-0.5)*11).toFixed(2)+'deg')}
 });
 el.addEventListener('mouseout',function(e){var t=e.target.closest&&e.target.closest('.tilt');if(t&&!t.contains(e.relatedTarget)){t.style.setProperty('--rx','0deg');t.style.setProperty('--ry','0deg')}});
 el.addEventListener('click',function(e){
  var f=e.target.closest('.flip');if(f){f.classList.toggle('flipped');return}
  var b=e.target.closest('[data-m]');if(!b)return;var k=b.dataset.m;
  if(k==='pal'){palOpen(el);return}
  if(k==='palclose'){if(e.target===b)palClose(el);return}
  if(k==='palgo'){palGo(el,+b.dataset.k)}
 });
 el.addEventListener('keydown',function(e){
  var f=e.target.closest&&e.target.closest('.flip');if(f&&(e.key==='Enter'||e.key===' ')){e.preventDefault();f.classList.toggle('flipped');return}
  if(!m.pal.open)return;
  if(e.key==='Escape'){e.stopPropagation();palClose(el);return}
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();var n=m.pal.items.length;if(n){m.pal.i=(m.pal.i+(e.key==='ArrowDown'?1:n-1))%n;palRender(el,m,m.inst)}return}
  if(e.key==='Enter'){e.preventDefault();palGo(el,m.pal.i)}
 },true);
 el.addEventListener('input',function(e){if(e.target.id==='pal-q'){m.pal.q=e.target.value;m.pal.i=0;palRender(el,m,m.inst);e.stopPropagation()}},true);
}
document.addEventListener('keydown',function(e){
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){var el=document.querySelector('.stage.active .view.active .mk');if(el){e.preventDefault();palOpen(el)}}
});

/* ---- hero 3D di layar masuk ---- */
function hero(el,S,m){
 var h=el.querySelector('.lg-hero');if(!h||S.mob||h.querySelector('.h3d'))return;
 var v=S.cls.replace('th-',''),box=document.createElement('div');box.className='h3d h3d-'+v.slice(-1);
 if(A.heroExt&&A.heroExt(v,box,h,S)){h.appendChild(box);return}
 if(v==='c1'){box.innerHTML='<div class="stack"><div class="pane p1"><i></i><b>Kehadiran</b><em>91%</em><span class="ln"></span></div><div class="pane p2"><i></i><b>Nilai</b><em>84</em><span class="ln"></span></div><div class="pane p3"><i></i><b>Tagihan</b><em>Lunas</em><span class="ln"></span></div></div>';h.appendChild(box)}
 else if(v==='c2'){var bars='';for(var r=0;r<5;r++)for(var c=0;c<5;c++){var hh=24+((r*7+c*13)%9)*14;bars+='<div class="bx" style="--r:'+r+';--c:'+c+';--h:'+hh+'px"><i class="t"></i><i class="l"></i><i class="rr"></i></div>'}box.innerHTML='<div class="iso">'+bars+'</div>';h.appendChild(box)}
 else{h.appendChild(box);var cv=document.createElement('canvas');box.appendChild(cv);
  if(!window.THREE){box.innerHTML='<div class="cube"><i></i><i></i><i></i><i></i><i></i><i></i></div>';return}
  var T=window.THREE,R=new T.WebGLRenderer({canvas:cv,alpha:true,antialias:true}),sc=new T.Scene(),cam=new T.PerspectiveCamera(45,1,.1,100);cam.position.z=9.6;
  var g1=new T.Mesh(new T.IcosahedronGeometry(2.1,1),new T.MeshBasicMaterial({color:0x8b84ff,wireframe:true,transparent:true,opacity:.85})),g2=new T.Mesh(new T.IcosahedronGeometry(1.2,0),new T.MeshBasicMaterial({color:0x22d3ee,wireframe:true,transparent:true,opacity:.9}));
  sc.add(g1);sc.add(g2);
  var pg=new T.BufferGeometry(),pa=[];for(var i=0;i<260;i++){var a=Math.random()*6.283,b=Math.acos(2*Math.random()-1),rr=3+Math.random()*2.6;pa.push(rr*Math.sin(b)*Math.cos(a),rr*Math.sin(b)*Math.sin(a),rr*Math.cos(b))}
  pg.setAttribute('position',new T.Float32BufferAttribute(pa,3));var pts=new T.Points(pg,new T.PointsMaterial({color:0xa5b4fc,size:.045}));sc.add(pts);
  var mx=0,my=0;h.addEventListener('mousemove',function(e){var r=h.getBoundingClientRect();mx=((e.clientX-r.left)/r.width-.5);my=((e.clientY-r.top)/r.height-.5)});
  var t0=performance.now();
  (function loop(now){
   if(!cv.isConnected){R.dispose();g1.geometry.dispose();g2.geometry.dispose();pg.dispose();return}
   var w=box.clientWidth,hh=box.clientHeight;
   if(w>0&&hh>0&&!off()){if(cv.width!==w*1||cv.height!==hh*1){R.setSize(w,hh,false);cam.aspect=w/hh;cam.updateProjectionMatrix()}
    var t=(now-t0)/1000;g1.rotation.y=t*.28+mx*1.2;g1.rotation.x=t*.16+my*.9;g2.rotation.y=-t*.4;g2.rotation.z=t*.25;pts.rotation.y=t*.04;R.render(sc,cam)}
   raf(loop)})(t0)}
}

/* ---- kait utama setelah render ---- */
A.after=function(el,S,inst){
 var m=el.__m=el.__m||{key:null,indTop:null,pal:{open:false,q:'',i:0,items:[]},bound:false};
 m.inst=inst;if(!m.bound){bind(el,m);m.bound=true}
 if(!S.user){m.key='guest';hero(el,S,m);return}
 var key=S.user.role+':'+S.route+':'+(S.kid||''),entering=m.key!==key;m.key=key;
 var tools=el.querySelector('.top .tools');
 if(tools&&!tools.querySelector('.srch-btn')){var b=document.createElement('button');b.type='button';b.className='srch-btn';b.setAttribute('data-m','pal');b.setAttribute('aria-label','Cari atau perintah');b.innerHTML=A.H.ic('srch')+'<span>Cari atau perintah</span><kbd>Ctrl K</kbd>';tools.insertBefore(b,tools.firstChild)}
 el.querySelectorAll('.card,.kpi,.cc,.mc2,.ac,.child,.opt,.kidc,.demo-b').forEach(function(n){n.classList.add('fx')});
 el.querySelectorAll('.kpi,.cc,.mc2,.child,.dg-hero,.dg-rings').forEach(function(n){n.classList.add('tilt')});
 var nav=el.querySelector('.side nav'),act=nav&&nav.querySelector('.ni.act');
 if(nav&&act){nav.style.position='relative';var ind=document.createElement('span');ind.className='ni-ind';var top=act.offsetTop,hh=act.offsetHeight;
  ind.style.height=hh+'px';ind.style.transform='translateY('+(m.indTop!=null&&!off()?m.indTop:top)+'px)';nav.insertBefore(ind,nav.firstChild);
  if(m.indTop!=null&&m.indTop!==top&&!off()){raf(function(){raf(function(){ind.style.transform='translateY('+top+'px)'})})}m.indTop=top}
 var ct=el.querySelector('#content');
 if(entering&&ct&&!off()){
  ct.classList.add('enter');var i=0;
  ct.querySelectorAll('.kpi,.card,.cc,.mc2,.ac,.kidc,.stepper,.tools2,.pa,.empty').forEach(function(n){n.style.setProperty('--i',Math.min(i++,16))});
  setTimeout(function(){if(ct)ct.classList.remove('enter')},1400);
  ct.querySelectorAll('.kv,[data-count]').forEach(countUp);
 }
 if(m.pal.open)palRender(el,m,inst);
};
A.event=function(name,el,S,inst){
 if(name==='act:publishGr'||name==='act:wizSubmit')confetti(el);
 if(name==='submit:payment'){var p=E.D.pay[E.D.pay.length-1],i=p&&E.inv(p.inv);if(i&&i.paid>=i.amount)confetti(el)}
};
})();
