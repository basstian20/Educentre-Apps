/* EduCentre V3: mesin aplikasi (kerangka, login, tabel, modal, event). Halaman ada di pages1.js dan pages2.js. */
(function(){
'use strict';
var E=window.EDUDATA,I=window.EDUI18N;
var P={dash:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',users:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
 teach:'M12 3 2 8l10 5 10-5-10-5zM6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5',heart:'M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z',
 cal:'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4',clip:'M9 3h6v3H9zM6 5H5v16h14V5h-1M9 11h6M9 15h4',check:'M20 6 9 17l-5-5',award:'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 22l5-3 5 3-1.2-8.1',
 folder:'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',rcpt:'M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6',mega:'M3 11v3a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9a4 4 0 0 1 0 6',
 chart:'M4 20V10M10 20V4M16 20v-8M22 20H2',gear:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
 out:'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',srch:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',bell:'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
 x:'M18 6 6 18M6 6l12 12',menu:'M4 6h16M4 12h16M4 18h16',file:'M14 3H6v18h12V7zM14 3v4h4',link:'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
 video:'M3 6h13v12H3zM16 10l5-3v10l-5-3',print:'M6 9V3h12v6M6 18H4v-7h16v7h-2M6 14h12v7H6z',dl:'M12 3v12M7 10l5 5 5-5M4 21h16',ul:'M12 15V3M7 8l5-5 5 5M4 21h16',edit:'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
 trash:'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',user:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',moon:'M20 15A8 8 0 1 1 9 4a6 6 0 0 0 11 11z',
 sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5',globe:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
 chev:'M9 6l6 6-6 6',clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',book:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5V21h16',more:'M5 12h.01M12 12h.01M19 12h.01',plus:'M12 5v14M5 12h14',
 up:'M6 15l6-6 6 6',down:'M6 9l6 6 6-6',filter:'M3 5h18l-7 8v6l-4 2v-8z',key:'M15 7a4 4 0 1 1-3.9 5L3 20v-3l2-2h2v-2h2l1.5-1.5A4 4 0 0 1 15 7z'};
function ic(n,c){return '<svg class="i '+(c||'')+'" viewBox="0 0 24 24" aria-hidden="true"><path d="'+(P[n]||P.dash)+'"/></svg>'}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ini(n){return String(n).split(' ').map(function(w){return w[0]}).slice(0,2).join('').toUpperCase()}
var HUE=['#2563eb','#059669','#d97706','#7c3aed','#db2777','#0891b2','#dc2626','#65a30d'];
function hue(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%8;return HUE[h]}

var H={ic:ic,esc:esc,ini:ini,hue:hue,_T:function(k){return k}};
H.av=function(name,cls){return '<span class="av '+(cls||'')+'" style="--h:'+hue(name)+'">'+ini(name)+'</span>'};
H.btn=function(label,a,d,cls){var s='';for(var k in (d||{}))s+=' data-'+k+'="'+esc(d[k])+'"';return '<button type="button" class="btn '+(cls||'')+'" data-a="'+a+'"'+s+'>'+label+'</button>'};
H.ibtn=function(icon,a,d,title,cls){var s='';for(var k in (d||{}))s+=' data-'+k+'="'+esc(d[k])+'"';return '<button type="button" class="ib '+(cls||'')+'" data-a="'+a+'"'+s+' title="'+esc(title||'')+'" aria-label="'+esc(title||'')+'">'+ic(icon)+'</button>'};
H.chip=function(c,t){return '<span class="chip '+c+'">'+t+'</span>'};
H.card=function(title,body,action,cls){return '<section class="card '+(cls||'')+'">'+(title?'<header class="ch"><h3>'+title+'</h3>'+(action?'<div class="cha">'+action+'</div>':'')+'</header>':'')+'<div class="cb">'+body+'</div></section>'};
H.empty=function(msg,icon,action){return '<div class="empty">'+ic(icon||'folder','big')+'<p>'+msg+'</p>'+(action||'')+'</div>'};
H.field=function(label,name,val,o){o=o||{};var t=o.type||'text';return '<label class="fld'+(o.cls?' '+o.cls:'')+'"><span class="lbl">'+label+'</span><input class="inp" type="'+t+'" data-f="'+name+'" value="'+esc(val)+'"'+(o.ph?' placeholder="'+esc(o.ph)+'"':'')+(o.rr?' data-rr="1"':'')+'></label>'};
H.sel=function(label,name,val,opts,o){o=o||{};return '<label class="fld'+(o.cls?' '+o.cls:'')+'"><span class="lbl">'+label+'</span><select class="inp" data-f="'+name+'"'+(o.rr?' data-rr="1"':'')+'>'+opts.map(function(x){var v=x[0],l=x[1];return '<option value="'+esc(v)+'"'+(String(v)===String(val)?' selected':'')+'>'+esc(l)+'</option>'}).join('')+'</select></label>'};
H.area=function(label,name,val,o){o=o||{};return '<label class="fld'+(o.cls?' '+o.cls:'')+'"><span class="lbl">'+label+'</span><textarea class="inp" rows="3" data-f="'+name+'">'+esc(val)+'</textarea></label>'};

function deepSet(o,path,v){var p=path.split('.');for(var i=0;i<p.length-1;i++){o=o[p[i]]=o[p[i]]||{}}o[p[p.length-1]]=v}
function create(el,opts){
 var S={theme:opts.theme,cls:opts.cls||'',mob:!!opts.mob,lang:'id',mode:'light',user:null,route:'dashboard',modal:null,drawer:false,notif:false,um:false,t:{},kid:null,att:{cls:'',date:E.TODAY},gr:{cls:'',aid:''},wiz:{step:1,stu:'',cls:[]},cal:'cards',toast:null,scroll:0};
 var timer=null,ctx;
 function T(k){return I.t(S.lang,k)}
 function ST(key){return S.t[key]=S.t[key]||{q:'',sort:'',dir:1,page:1,f:'all'}}
 function roleOf(){return S.user?S.user.role:null}
 function mkctx(){
  var u=S.user,role=u&&u.role;
  var c={S:S,T:T,H:H,E:E,ST:ST,user:u,role:role,render:render,toast:toast,go:go,table:table,ic:ic};
  if(role==='educator')c.edu=E.eduOfUser(u.id);
  if(role==='student')c.stu=E.studentOfUser(u.id);
  if(role==='parent'){c.par=E.parentOfUser(u.id);c.kids=E.childrenOf(c.par.id);if(!S.kid||!c.kids.some(function(k){return k.id===S.kid}))S.kid=c.kids[0].id;c.kid=E.stu(S.kid)}
  return c;
 }
 function toast(m){S.toast=m;clearTimeout(timer);timer=setTimeout(function(){S.toast=null;var t=el.querySelector('.toast');if(t)t.remove()},2400)}
 function go(route,params){S.route=route;S.params=params||{};S.drawer=false;S.notif=false;S.um=false;S.modal=null;S.scroll=0}
 function login(role){var u=E.D.users.filter(function(x){return x.role===role})[0];S.user=Object.assign({},u);S.route='dashboard';S.modal=null;S.drawer=false;S.notif=false;S.um=false;S.kid=null;S.scroll=0;S.gr={cls:'',aid:''};S.att={cls:'',date:E.TODAY};S.wiz={step:1,stu:'',cls:[]}}

 /* ----- tabel ----- */
 function table(key,list,cfg){
  var st=ST(key),q=(st.q||'').toLowerCase();
  var rows=list.filter(function(r){return (!cfg.filter||cfg.filter(r,st))&&(!q||cfg.search(r).toLowerCase().indexOf(q)>=0)});
  if(st.sort&&cfg.sorts&&cfg.sorts[st.sort]){var f=cfg.sorts[st.sort];rows=rows.slice().sort(function(a,b){var x=f(a),y=f(b);return (x>y?1:x<y?-1:0)*st.dir})}
  var size=cfg.size||8,total=rows.length,pages=Math.max(1,Math.ceil(total/size));if(st.page>pages)st.page=pages;
  return {st:st,key:key,rows:rows.slice((st.page-1)*size,st.page*size),total:total,all:list.length,pages:pages,size:size};
 }
 H.sortTh=function(t,col,label,cls){return '<th class="sortable '+(cls||'')+'" data-a="sort" data-k="'+t.key+'" data-c="'+col+'">'+label+'<span class="sa">'+(t.st.sort===col?(t.st.dir>0?'▲':'▼'):'')+'</span></th>'};
 H.search=function(t,ph){return '<label class="sbox">'+ic('srch')+'<input id="q-'+t.key+'" data-q="'+t.key+'" value="'+esc(t.st.q||'')+'" placeholder="'+esc(ph||H._T('search'))+'" aria-label="'+esc(ph||H._T('search'))+'"></label>'};
 H.pager=function(t){if(t.pages<=1&&t.total<=t.size)return '<div class="pg"><span>'+t.total+' / '+t.all+'</span></div>';var b='';for(var i=1;i<=t.pages;i++)b+='<button type="button" class="pgb'+(i===t.st.page?' on':'')+'" data-a="page" data-k="'+t.key+'" data-n="'+i+'">'+i+'</button>';
  return '<div class="pg"><span>'+((t.st.page-1)*t.size+1)+'–'+Math.min(t.st.page*t.size,t.total)+' dari '+t.total+'</span><div class="pgs"><button type="button" class="pgb" data-a="page" data-k="'+t.key+'" data-n="'+Math.max(1,t.st.page-1)+'" aria-label="Sebelumnya">‹</button>'+b+'<button type="button" class="pgb" data-a="page" data-k="'+t.key+'" data-n="'+Math.min(t.pages,t.st.page+1)+'" aria-label="Berikutnya">›</button></div></div>'};
 H.noMatch=function(t){return H.empty(T('noMatch'),'srch',H.btn('Hapus pencarian','clearq',{k:t.key},'ghost sm'))};
 H.filterChips=function(t,opts){return '<div class="chips">'+opts.map(function(o){return '<button type="button" class="fc'+(t.st.f===o[0]?' on':'')+'" data-a="filter" data-k="'+t.key+'" data-v="'+o[0]+'">'+o[1]+'</button>'}).join('')+'</div>'};

 /* ----- modal ----- */
 H.modal=function(title,body,foot,cls){return '<div class="mdl" data-a="mclose0"><form data-form="modal" class="mbox '+(cls||'')+'" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><header><h3>'+title+'</h3><button type="button" class="ib" data-a="mclose" aria-label="'+H._T('close')+'">'+ic('x')+'</button></header><div class="mb">'+body+'</div><footer>'+(foot||'')+'</footer></form></div>'};
 H.submit=function(label,cls){return '<button type="submit" class="btn pri '+(cls||'')+'">'+label+'</button>'};
 H.cancelBtn=function(){return '<button type="button" class="btn ghost" data-a="mclose">'+H._T('cancel')+'</button>'};
 H.confirm=function(msg,act,d){return H.modal('Konfirmasi',msg+'<p class="mut">Tindakan ini tidak bisa dibatalkan.</p>',H.cancelBtn()+H.btn(H._T('del'),act,d,'danger'))};
 function openModal(m){S.modal=m}

 /* ----- navigasi per peran ----- */
 function nav(role){
  var n=function(r,key,icon){return {r:r,l:key,i:icon}};
  if(role==='admin')return [[T('overview'),[n('dashboard','dashboard','dash'),n('reports','reports','chart')]],[T('people'),[n('students','students','users'),n('educators','educators','teach'),n('parents','parents','heart')]],[T('academics'),[n('classes','classes','cal'),n('enrollment','enrollment','clip'),n('attendance','attendance','check'),n('grades','grades','award'),n('materials','materials','folder')]],[T('finance'),[n('invoices','invoices','rcpt')]],[T('system'),[n('announcements','announcements','mega'),n('settings','settings','gear')]]];
  if(role==='educator')return [[T('overview'),[n('dashboard','myDashboard','dash')]],[T('academics'),[n('classes','myClasses','book'),n('attendance','markAttendance','check'),n('grades','enterGrades','award'),n('materials','materials','folder')]],[T('system'),[n('announcements','announcements','mega'),n('settings','settings','gear')]]];
  if(role==='student')return [[T('overview'),[n('dashboard','myDashboard','dash')]],[T('academics'),[n('classes','mySchedule','cal'),n('results','myResults','award'),n('materials','materials','folder'),n('attendance','myAttendance','check')]],[T('finance'),[n('invoices','myFees','rcpt')]],[T('system'),[n('announcements','announcements','mega'),n('settings','settings','gear')]]];
  return [[T('overview'),[n('dashboard','myDashboard','dash')]],[T('academics'),[n('students','children','users'),n('results','results','award'),n('attendance','myAttendance','check'),n('classes','classes','cal')]],[T('finance'),[n('invoices','fees','rcpt')]],[T('system'),[n('announcements','announcements','mega'),n('settings','settings','gear')]]];
 }
 var BOT={admin:['dashboard','students','attendance','invoices'],educator:['dashboard','attendance','grades','classes'],student:['dashboard','classes','results','invoices'],parent:['dashboard','results','attendance','invoices']};
 function iconFor(role,r){var f=null;nav(role).forEach(function(s){s[1].forEach(function(i){if(i.r===r)f=i})});return f}

 /* ----- render ----- */
 function titleOf(role,route){var it=iconFor(role,route);return it?T(it.l):''}
 function renderLogin(){
  var demos=[['admin','Sari Dewi','Kelola seluruh bimbel'],['educator','Fariz Abdullah','Absensi dan nilai'],['student','Aiman Haziq','Jadwal, hasil, materi'],['parent','Nurhayati','Pantau anak dan biaya']];
  return '<div class="login"><div class="lg-form"><div class="lg-top"><div class="brand"><span class="logo">E</span><span>EduCentre</span></div><button type="button" class="lang" data-a="lang">'+ic('globe')+(S.lang==='id'?'ID':'EN')+'</button></div>'+
   '<h1>'+(S.lang==='id'?'Masuk ke EduCentre':'Sign in to EduCentre')+'</h1><p class="mut">'+(S.lang==='id'?'Gunakan akun dari pusat bimbel Anda.':'Use the account from your tutoring centre.')+'</p>'+
   '<form data-form="login">'+H.field('Email','email',S.loginEmail||'',{ph:'nama@bimbel.id'})+H.field(S.lang==='id'?'Kata sandi':'Password','pass','',{type:'password',ph:'••••••••'})+'<button class="btn pri block" type="submit">'+T('login')+'</button></form>'+
   '<div class="demo"><div class="lbl">'+T('demo')+'</div><div class="demos">'+demos.map(function(d){return '<button type="button" class="demo-b" data-a="login" data-r="'+d[0]+'">'+H.av(d[1])+'<span><b>'+T('role_'+d[0])+'</b><small>'+d[1]+'</small></span></button>'}).join('')+'</div></div>'+
   '<p class="credit">'+T('credit')+'</p></div><aside class="lg-hero"><div class="hero-in"><h2>'+(S.lang==='id'?'Satu tempat untuk seluruh bimbel.':'One place for the whole centre.')+'</h2><p>'+(S.lang==='id'?'Siswa, jadwal, absensi, nilai, materi, dan tagihan. Setiap peran hanya melihat yang relevan untuknya.':'Students, schedule, attendance, grades, materials and fees. Each role sees only what matters to it.')+'</p><div class="hero-roles">'+['admin','educator','student','parent'].map(function(r){return '<span>'+T('role_'+r)+'</span>'}).join('')+'</div></div></aside></div>';
 }
 function renderApp(){
  var role=S.user.role,sec=nav(role),pg=window.EduApp.pages[S.route];
  var res=pg?pg(ctx):{title:'',html:''};
  var navH=sec.map(function(s){return '<div class="ns"><div class="nl">'+s[0]+'</div>'+s[1].map(function(it){return '<a class="ni'+(S.route===it.r?' act':'')+'" role="link" tabindex="0" data-a="nav" data-r="'+it.r+'">'+ic(it.i)+'<span>'+T(it.l)+'</span></a>'}).join('')+'</div>'}).join('');
  var side='<aside class="side"><div class="brand"><span class="logo">E</span><div><b>EduCentre</b><small>'+E.D.centre.name+'</small></div><button type="button" class="ib mclose-d" data-a="drawer" aria-label="'+T('close')+'">'+ic('x')+'</button></div><nav>'+navH+'</nav><div class="uc">'+H.av(S.user.full_name)+'<div><b>'+esc(S.user.full_name)+'</b><small>'+T('role_'+role)+'</small></div><button type="button" class="ib" data-a="logout" title="'+T('logout')+'" aria-label="'+T('logout')+'">'+ic('out')+'</button></div><div class="credit">'+T('credit')+'</div></aside>';
  var nots=E.notifs(S.user),unread=nots.filter(function(n){return !E.isRead(S.user.id,n.id)}).length;
  var notifH=S.notif?'<div class="pop notif"><div class="ph">'+T('notifications')+'</div>'+(nots.length?nots.map(function(n){var rd=E.isRead(S.user.id,n.id);return '<button type="button" class="nt'+(rd?' rd':'')+'" data-a="notif" data-id="'+n.id+'" data-r="'+n.route+'"><span class="nd">'+(rd?'':'<i></i>')+'</span><span><b>'+esc(n.t)+'</b><small>'+esc(n.sub)+'</small></span></button>'}).join(''):H.empty(T('noData'),'bell'))+'</div>':'';
  var umH=S.um?'<div class="pop um"><div class="ph">'+esc(S.user.full_name)+'<small>'+esc(S.user.email)+'</small></div><button type="button" class="nt" data-a="nav" data-r="settings">'+ic('gear')+T('settings')+'</button><button type="button" class="nt" data-a="lang">'+ic('globe')+T('language')+': '+(S.lang==='id'?'Indonesia':'English')+'</button><button type="button" class="nt" data-a="mode">'+ic(S.mode==='dark'?'sun':'moon')+T('darkMode')+'</button><button type="button" class="nt" data-a="logout">'+ic('out')+T('logout')+'</button></div>':'';
  var top='<header class="top"><button type="button" class="ib menu" data-a="drawer" aria-label="Menu">'+ic('menu')+'</button><div class="tt"><div class="crumb">'+esc(E.D.centre.name)+' / '+titleOf(role,S.route)+'</div><h1>'+(res.title||titleOf(role,S.route))+'</h1>'+(res.sub?'<p>'+res.sub+'</p>':'')+'</div><div class="tools"><button type="button" class="ib" data-a="lang" title="'+T('language')+'" aria-label="'+T('language')+'">'+ic('globe')+'<span class="lc">'+(S.lang==='id'?'ID':'EN')+'</span></button><button type="button" class="ib" data-a="mode" title="'+T('darkMode')+'" aria-label="'+T('darkMode')+'">'+ic(S.mode==='dark'?'sun':'moon')+'</button><div class="rel"><button type="button" class="ib" data-a="bell" aria-label="'+T('notifications')+'">'+ic('bell')+(unread?'<i class="dot">'+unread+'</i>':'')+'</button>'+notifH+'</div><div class="rel"><button type="button" class="uchip" data-a="um" aria-label="Akun">'+H.av(S.user.full_name)+'<span>'+esc(S.user.full_name.split(' ')[0])+'</span>'+ic('down')+'</button>'+umH+'</div></div></header>';
  var bot=BOT[role].map(function(r){var it=iconFor(role,r);return '<a class="bi'+(S.route===r?' act':'')+'" role="link" tabindex="0" data-a="nav" data-r="'+r+'">'+ic(it.i)+'<span>'+T(it.l)+'</span></a>'}).join('')+'<a class="bi" role="link" tabindex="0" data-a="drawer">'+ic('menu')+'<span>Menu</span></a>';
  var content='<main class="content" id="content">'+(res.actions?'<div class="pa">'+res.actions+'</div>':'')+res.html+'<div class="credit foot">'+T('credit')+'</div></main>';
  return side+'<div class="ov'+(S.drawer?' on':'')+'" data-a="drawer"></div><div class="main">'+top+content+'<nav class="bot">'+bot+'</nav></div>'+(S.modal?(window.EduApp.modals[S.modal.t]?window.EduApp.modals[S.modal.t](ctx,S.modal):''):'');
 }
 function render(keepScroll){
  H._T=T;
  var act=document.activeElement,fid=act&&el.contains(act)&&act.id,ss=act&&act.selectionStart,se=act&&act.selectionEnd;
  var ct=el.querySelector('#content');var sc=ct?ct.scrollTop:0;
  ctx=mkctx();
  var cls='app th-'+S.theme+(S.mob?' mob':'')+(S.drawer?' drawer':'')+(S.user?'':' guest');
  el.className='mk '+cls+(S.cls?' '+S.cls:'');el.setAttribute('data-mode',S.mode);
  el.innerHTML=(S.user?renderApp():renderLogin())+(S.toast?'<div class="toast">'+esc(S.toast)+'</div>':'');
  var c2=el.querySelector('#content');if(c2)c2.scrollTop=keepScroll===false?0:sc;
  if(fid){var n=el.querySelector('#'+fid);if(n){n.focus();try{n.setSelectionRange(ss,se)}catch(e){}}}
  if(window.EduApp.after)window.EduApp.after(el,S,api);
 }

 /* ----- aksi inti ----- */
 var core={
  login:function(d){login(d.r)},
  logout:function(){S.user=null;S.um=false;S.modal=null;S.route='dashboard'},
  nav:function(d){go(d.r)},
  drawer:function(){S.drawer=!S.drawer},
  lang:function(){S.lang=S.lang==='id'?'en':'id'},
  mode:function(){S.mode=S.mode==='dark'?'light':'dark'},
  bell:function(){S.notif=!S.notif;S.um=false},
  um:function(){S.um=!S.um;S.notif=false},
  notif:function(d){E.markRead(S.user.id,d.id);go(d.r)},
  mclose:function(){S.modal=null},
  mclose0:function(d,e){if(e.target.classList.contains('mdl'))S.modal=null;else return false},
  sort:function(d){var st=ST(d.k);if(st.sort===d.c)st.dir*=-1;else{st.sort=d.c;st.dir=1}},
  page:function(d){ST(d.k).page=+d.n},
  filter:function(d){var st=ST(d.k);st.f=d.v;st.page=1},
  clearq:function(d){ST(d.k).q='';ST(d.k).page=1}
 };
 function handle(a,d,e){
  if(core[a]){var r=core[a](d,e);return r!==false}
  var f=window.EduApp.acts[a];if(f){var r2=f(ctx,d,e);return r2!==false}
  return false;
 }
 el.addEventListener('click',function(e){
  var t=e.target.closest('[data-a]');
  if(S.notif||S.um){var inPop=e.target.closest('.pop,[data-a=bell],[data-a=um]');if(!inPop){S.notif=false;S.um=false;if(!t){render();return}}}
  if(!t||!el.contains(t))return;
  var a=t.dataset.a,d=t.dataset;
  if(a==='mclose0'&&e.target!==t)return;
  ctx=mkctx();
  if(handle(a,d,e)){render(a==='nav'||a==='login'||a==='logout'?false:undefined);if(window.EduApp.event)window.EduApp.event('act:'+a,el,S,api)}
 });
 el.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&S.modal){S.modal=null;render();return}
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('a[data-a]')){e.preventDefault();e.target.click()}
 });
 el.addEventListener('input',function(e){
  var t=e.target;
  if(t.dataset.q){var st=ST(t.dataset.q);st.q=t.value;st.page=1;render();return}
  if(t.dataset.f&&S.modal&&S.modal.f){S.modal.f[t.dataset.f]=t.type==='checkbox'?t.checked:t.value;return}
  if(t.dataset.f&&t.dataset.f==='email'&&!S.user){S.loginEmail=t.value}
  if(t.dataset.gd){deepSet(S,t.dataset.gd,t.value);return}
  if(t.dataset.g){ctx=mkctx();var p=t.dataset.g.split('.');S[p[0]][p[1]]=t.value}
 });
 el.addEventListener('change',function(e){
  var t=e.target;
  if(t.dataset.f&&S.modal&&S.modal.f){S.modal.f[t.dataset.f]=t.type==='checkbox'?t.checked:(t.type==='file'?(t.files[0]?t.files[0].name:''):t.value);if(t.dataset.rr)render();return}
  if(t.dataset.g){ctx=mkctx();var p=t.dataset.g.split('.');S[p[0]][p[1]]=t.value;if(window.EduApp.onG)window.EduApp.onG(ctx,t.dataset.g);render()}
  if(t.dataset.gs){ctx=mkctx();var q=t.dataset.gs.split('.');S[q[0]][q[1]]=t.value;if(window.EduApp.onG)window.EduApp.onG(ctx,t.dataset.gs);render()}
 });
 el.addEventListener('submit',function(e){
  var f=e.target;if(f.dataset.form==='login'){e.preventDefault();var em=(f.querySelector('[data-f=email]').value||'').trim().toLowerCase();var u=E.D.users.filter(function(x){return x.email===em})[0];
   if(!em){S.loginEmail='';login('admin')}else if(u){login(u.role)}else{toast(S.lang==='id'?'Email atau kata sandi salah (coba tombol akun demo)':'Wrong email or password (try a demo account)')}
   render(false)}
  else if(f.dataset.form==='modal'){e.preventDefault();ctx=mkctx();var fn=window.EduApp.submits[S.modal.t];if(fn){var mt=S.modal.t,r=fn(ctx,S.modal);if(r!==false){render();if(window.EduApp.event)window.EduApp.event('submit:'+mt,el,S,api)}}}
 });
 var api={S:S,render:render,nav:function(r){go(r);render(false)},run:function(a,d){ctx=mkctx();var f=window.EduApp.acts[a];if(f){f(ctx,d||{});render()}},navItems:function(){var out=[];if(!S.user)return out;nav(S.user.role).forEach(function(sec){sec[1].forEach(function(it){out.push({r:it.r,label:T(it.l),icon:it.i,sec:sec[0]})})});return out},reset:function(){S.user=null;S.modal=null;render()},loginAs:function(r){login(r);render(false)},showLogin:function(){S.user=null;S.modal=null;render(false)},setMode:function(m){S.mode=m;render()},openModal:openModal};
 render();
 return api;
}
window.EduApp={create:create,H:H,pages:{},acts:{},modals:{},submits:{}};
})();
