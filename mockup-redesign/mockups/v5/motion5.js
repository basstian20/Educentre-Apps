/* V5: gerak tambahan. Ticker, teks kinetik, tombol magnetik, kursor pengikut (C4); parallax dan bentuk tanah liat (C5); jam LIVE dan terrain 3D (C6). */
(function(){
var A=window.EduApp,E=window.EDUDATA;
function off(){return document.documentElement.getAttribute('data-motion')==='off'||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)}
function esc(s){return A.H.esc(s)}
function raf(f){requestAnimationFrame(f)}

/* ---- kait setelah render (dibungkus di atas V4) ---- */
var prev=A.after;
A.after=function(el,S,inst){
 prev(el,S,inst);
 var v=(S.cls||'').replace('th-',''),m=el.__m;
 if(!m.x5){m.x5=true;bind5(el,v)}
 if(!S.user)return;
 if(v==='c4')ext4(el,S,m);
 if(v==='c6')ext6(el,S,m);
};

function ext4(el,S,m){
 var main=el.querySelector('.main'),top=el.querySelector('.top');
 if(main&&top&&!main.querySelector('.ticker')){
  var items=E.D.ann.slice(0,5).map(function(a){return '<span><i></i>'+esc(a.title)+' · '+esc(a.by)+'</span>'}).join('');
  var st=E.stats();items+='<span><i></i>Siswa aktif '+st.students+'</span><span><i></i>Belum lunas '+E.short(st.outstanding)+'</span><span><i></i>Kehadiran terbaru stabil</span>';
  var t=document.createElement('div');t.className='ticker';t.innerHTML='<div class="tk-in">'+items+items+'</div>';main.insertBefore(t,top);
 }
 var ct=el.querySelector('#content');
 if(ct&&ct.classList.contains('enter')&&!off()){
  var h1=el.querySelector('.tt h1');
  if(h1&&!h1.querySelector('.chx')){var txt=h1.textContent;h1.setAttribute('aria-label',txt);h1.innerHTML=Array.prototype.map.call(txt,function(c,i){return '<span class="chx" aria-hidden="true" style="--d:'+(i*26)+'ms">'+(c===' '?'&nbsp;':esc(c))+'</span>'}).join('')}
 }
 if(!el.querySelector('.cur')){var c=document.createElement('div');c.className='cur';c.style.transform='translate('+(m.cx||-40)+'px,'+(m.cy||-40)+'px)';el.appendChild(c)}
}

function ext6(el,S,m){
 var tools=el.querySelector('.top .tools');
 if(tools&&!tools.querySelector('.live')){
  var s=document.createElement('span');s.className='live';s.innerHTML='<i></i>LIVE <b data-clock>'+clk(m.sec||0)+'</b>';tools.insertBefore(s,tools.firstChild);
 }
 if(!m.clk){m.clk=setInterval(function(){
  if(!el.isConnected){clearInterval(m.clk);return}
  m.sec=(m.sec||0)+1;var n=el.querySelector('[data-clock]');if(n)n.textContent=clk(m.sec)},1000)}
}
function clk(sec){var base=15*3600+42*60,t=base+sec,h=Math.floor(t/3600)%24,mi=Math.floor(t/60)%60,s=t%60;function p(n){return (n<10?'0':'')+n}return p(h)+':'+p(mi)+':'+p(s)}

/* ---- pendengar sekali per instans ---- */
function bind5(el,v){
 el.addEventListener('mousemove',function(e){
  if(off())return;
  var r=el.getBoundingClientRect(),sc=r.width/el.offsetWidth||1,x=(e.clientX-r.left)/sc,y=(e.clientY-r.top)/sc,m=el.__m;
  if(v==='c5'){el.style.setProperty('--px',((x/el.offsetWidth)-.5).toFixed(3));el.style.setProperty('--py',((y/el.offsetHeight)-.5).toFixed(3))}
  if(v==='c4'){m.cx=x-10;m.cy=y-10;var c=el.querySelector('.cur');if(c)c.style.transform='translate('+m.cx+'px,'+m.cy+'px)';
   var b=e.target.closest&&e.target.closest('.btn,.srch-btn');
   if(b){var br=b.getBoundingClientRect(),dx=(e.clientX-(br.left+br.width/2))/sc*.22,dy=(e.clientY-(br.top+br.height/2))/sc*.3;b.style.setProperty('--bx',Math.max(-6,Math.min(6,dx)).toFixed(1)+'px');b.style.setProperty('--by',Math.max(-5,Math.min(5,dy)).toFixed(1)+'px')}}
 });
 el.addEventListener('mouseout',function(e){var b=e.target.closest&&e.target.closest('.btn,.srch-btn');if(b&&!b.contains(e.relatedTarget)){b.style.setProperty('--bx','0px');b.style.setProperty('--by','0px')}});
}

/* ---- hero layar masuk 3D ---- */
A.heroExt=function(v,box,h,S){
 if(v==='c4'){
  box.className='h3d h3d-4';var L='';for(var i=0;i<30;i++)L+='<span style="--z:'+(i*3)+'px;--k:'+i+'">E</span>';
  box.innerHTML='<div class="ex3d">'+L+'</div>';return true;
 }
 if(v==='c5'){
  box.className='h3d h3d-5';box.innerHTML='<div class="clay"><i class="cl-sp"></i><i class="cl-tor"></i><i class="cl-cb"></i><i class="cl-pl"></i><i class="cl-st"></i><i class="cl-sm"></i></div>';return true;
 }
 if(v==='c6'){
  box.className='h3d h3d-6';
  if(!window.THREE){box.innerHTML='<div class="grid3d"></div>';return true}
  var cv=document.createElement('canvas');box.appendChild(cv);
  var T=window.THREE,R=new T.WebGLRenderer({canvas:cv,alpha:true,antialias:true}),sc=new T.Scene(),cam=new T.PerspectiveCamera(52,1,.1,100);cam.position.set(0,4.6,8.2);cam.lookAt(0,0,0);
  var geo=new T.PlaneGeometry(18,18,56,56);geo.rotateX(-Math.PI/2);
  var mesh=new T.Mesh(geo,new T.MeshBasicMaterial({color:0x3ddc97,wireframe:true,transparent:true,opacity:.5}));sc.add(mesh);
  var pos=geo.attributes.position,base=[];for(var i=0;i<pos.count;i++)base.push([pos.getX(i),pos.getZ(i)]);
  var t0=performance.now(),mx=0;h.addEventListener('mousemove',function(e){var r=h.getBoundingClientRect();mx=((e.clientX-r.left)/r.width-.5)});
  var loop=function(now){
   if(!cv.isConnected){R.dispose();geo.dispose();return}
   var w=box.clientWidth,hh=box.clientHeight;
   if(w>0&&hh>0&&!off()){if(cv.width!==w||cv.height!==hh){R.setSize(w,hh,false);cam.aspect=w/hh;cam.updateProjectionMatrix()}
    var t=(now-t0)/1000;for(var i=0;i<pos.count;i++){var x=base[i][0],z=base[i][1];pos.setY(i,Math.sin(x*.55+t*1.1)*.55+Math.cos(z*.48+t*.8)*.55+Math.sin((x+z)*.3+t*.5)*.4)}
    pos.needsUpdate=true;mesh.rotation.y=mx*.5+Math.sin(t*.15)*.12;R.render(sc,cam)}
   raf(loop)};
  raf(loop);
  return true;
 }
 return false;
};
})();
