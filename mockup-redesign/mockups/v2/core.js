/* EduCentre prototipe: data sintetis, tindakan bersama, mesin render. Semua arah memakai satu sumber data ini. */
(function(){
'use strict';
var E=window.EDU={};
var TODAY=23;
var STU=[
 ['aiman','Aiman Haziq','5 SD','Ibu Nurhayati',92,[84,86,88]],
 ['nadia','Nadia Putri','6 SD','Bapak Hadi',88,[90,89,92]],
 ['raka','Raka Pratama','8 SMP','Ibu Wulan',95,[90,93,96]],
 ['salsa','Salsa Amelia','7 SMP','Ibu Rahma',97,[75,77,79]],
 ['dimas','Dimas Arya','11 SMA','Bapak Joko',84,[78,70,62]],
 ['kirana','Kirana Haziq','3 SD','Ibu Nurhayati',100,[88,90,85]],
 ['bayu','Bayu Santoso','9 SMP','Ibu Dewi',79,[82,76,71]],
 ['putri','Putri Lestari','10 SMA','Bapak Agus',91,[88,90,91]],
 ['mira','Mira Anjani','4 SD','Ibu Sekar',96,[90,92,94]],
 ['fajar','Fajar Ramadhan','6 SD','Ibu Lina',80,[70,66,62]],
 ['citra','Citra Dewi','5 SD','Bapak Rudi',90,[74,77,79]]];
var CLS=[
 ['cal3','Calistung K3','Bu Sinta','Ruang C',540,630,['kirana','mira']],
 ['ipa6','IPA Kelas 6','Bu Rina','Ruang A',780,870,['nadia','fajar','citra']],
 ['mtk5','Matematika K5','Pak Fariz','Ruang B',930,1020,['aiman','nadia','citra','fajar','mira']],
 ['eng','B. Inggris SMP','Miss Dita','Ruang C',960,1050,['salsa','raka','bayu']],
 ['fis','Fisika SMA','Pak Hendra','Ruang A',1050,1140,['dimas','putri']],
 ['utbk','UTBK Dasar','Pak Fariz','Ruang C',1050,1140,['raka','putri','dimas']]];
var ORDER=['H','T','A','I'];
var LBL={H:'Hadir',T:'Telat',A:'Absen',I:'Izin'};
var BASE={unpaidCount:9,unpaidAmt:6205000,overdue:1,dueSoon:4,presentBase:132,totalBase:144};

function fresh(){
 var s={clock:942,stu:{},sorder:[],cls:{},corder:[],att:{},saved:{},inv:[],pay:[],feed:[],
  grade:{title:'Ulangan 3 · Matematika K5',cls:'mtk5',scores:{aiman:88,nadia:92,citra:79,fajar:62,mira:94},pub:{aiman:88,nadia:92,citra:79,fajar:62,mira:94},published:true}};
 STU.forEach(function(r){s.stu[r[0]]={id:r[0],name:r[1],lv:r[2],ortu:r[3],att:r[4],tr:r[5]};s.sorder.push(r[0])});
 CLS.forEach(function(r){s.cls[r[0]]={id:r[0],name:r[1],tutor:r[2],room:r[3],start:r[4],end:r[5],roster:r[6].slice()};s.corder.push(r[0])});
 s.att={cal3:{kirana:'H',mira:'H'},ipa6:{nadia:'H',fajar:'A',citra:'H'},mtk5:{aiman:'H',nadia:'H',citra:'T'},eng:{},fis:{},utbk:{}};
 s.saved={cal3:true,ipa6:true,mtk5:false,eng:false,fis:false,utbk:false};
 s.inv=[
  {id:'i1',stu:'aiman',item:'SPP Oktober',amt:495000,due:25,status:'belum',pending:null,lines:[['SPP Matematika',200000],['SPP IPA',200000],['SPP B. Inggris',150000],['Diskon saudara 10%',-55000]]},
  {id:'i2',stu:'nadia',item:'SPP Oktober',amt:450000,due:20,status:'belum',pending:null},
  {id:'i3',stu:'raka',item:'Paket UTBK',amt:1200000,due:28,status:'belum',pending:null},
  {id:'i4',stu:'salsa',item:'SPP Oktober',amt:450000,due:18,status:'lunas',pending:null},
  {id:'i5',stu:'dimas',item:'Fisika SMA',amt:600000,due:30,status:'belum',pending:null},
  {id:'i6',stu:'kirana',item:'SPP Oktober',amt:350000,due:25,status:'lunas',pending:null},
  {id:'i7',stu:'bayu',item:'SPP Oktober',amt:450000,due:15,status:'belum',pending:null},
  {id:'i8',stu:'putri',item:'Kimia SMA',amt:600000,due:30,status:'lunas',pending:null},
  {id:'i9',stu:'mira',item:'SPP Oktober',amt:350000,due:25,status:'lunas',pending:null},
  {id:'i10',stu:'fajar',item:'SPP Oktober',amt:450000,due:25,status:'lunas',pending:null},
  {id:'i11',stu:'citra',item:'SPP Oktober',amt:450000,due:25,status:'lunas',pending:null}];
 s.pay=[{t:'10.12',stu:'salsa',item:'SPP Oktober',amt:450000,m:'Tunai'},{t:'11.30',stu:'kirana',item:'SPP Oktober',amt:350000,m:'Transfer'},{t:'12.45',stu:'putri',item:'Kimia SMA',amt:600000,m:'Tunai'}];
 s.feed=[
  {t:'08.00',who:'Sari (Admin)',kind:'ann',text:'Libur 28 Okt (Sumpah Pemuda). Jadwal pengganti Sabtu 31 Okt.'},
  {t:'14.32',who:'Bu Rina',kind:'att',cls:'ipa6',text:'Absensi IPA Kelas 6 disimpan: 2 hadir · 1 absen'},
  {t:'15.10',who:'Pak Fariz',kind:'grade',cls:'mtk5',text:'Ulangan 3 Matematika K5 sudah dinilai dan dipublikasikan.'}];
 return s;
}
E.S=fresh();
E.reset=function(){E.S=fresh();E.redraw()};

/* ---- format ---- */
E.rp=function(n){return (n<0?'-':'')+String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.')};
E.short=function(n){return n>=1e6?'Rp '+(n/1e6).toFixed(1).replace('.',',')+' jt':'Rp '+E.rp(n)};
E.time=function(m){var h=Math.floor(m/60),mm=m%60;return (h<10?'0':'')+h+'.'+(mm<10?'0':'')+mm};
E.dueLabel=function(d){return d<=31?d+' Okt':(d-31)+' Nov'};
E.ini=function(n){return n.split(' ').map(function(w){return w[0]}).slice(0,2).join('')};
E.LBL=LBL;E.ORDER=ORDER;E.TODAY=TODAY;

/* ---- pembacaan ---- */
E.stu=function(id){return E.S.stu[id]};
E.cls=function(id){return E.S.cls[id]};
E.invs=function(stuId){return E.S.inv.filter(function(i){return i.stu===stuId})};
E.invOf=function(stuId){var l=E.invs(stuId);return l.filter(function(i){return i.status!=='lunas'})[0]||l[0]};
E.invState=function(i){if(i.status==='lunas')return {k:'lunas',l:'Lunas'};if(i.pending)return {k:'menunggu',l:'Menunggu konfirmasi'};if(i.due<TODAY)return {k:'terlambat',l:'Terlambat'};return {k:'belum',l:'Belum bayar'}};
E.sessStatus=function(id){var c=E.S.cls[id],t=E.S.clock;return t>=c.end?'done':t>=c.start?'now':'next'};
E.counts=function(id){var c=E.S.cls[id],a=E.S.att[id]||{},r={H:0,T:0,A:0,I:0,n:0,total:c.roster.length};c.roster.forEach(function(s){var v=a[s];if(v)r[v]++;else r.n++});return r};
E.lastMark=function(stuId){var out=null;E.S.corder.forEach(function(id){var c=E.S.cls[id];if(c.roster.indexOf(stuId)>=0){var v=(E.S.att[id]||{})[stuId];if(v)out=v}});return out};
E.sessionsOf=function(tutor){return E.S.corder.filter(function(id){return E.S.cls[id].tutor===tutor})};
E.classesOf=function(stuId){return E.S.corder.filter(function(id){return E.S.cls[id].roster.indexOf(stuId)>=0})};
E.stats=function(){
 var S=E.S,un=0,cnt=0,od=BASE.overdue,ds=BASE.dueSoon,pend=0,pres=BASE.presentBase,tot=BASE.totalBase,col=0;
 S.inv.forEach(function(i){if(i.status!=='lunas'){un+=i.amt;cnt++;if(i.due<TODAY)od++;else if(i.due-TODAY<=3)ds++;if(i.pending)pend++}});
 S.corder.forEach(function(id){if(S.saved[id]){var c=E.counts(id);pres+=c.H+c.T;tot+=c.H+c.T+c.A+c.I}});
 S.pay.forEach(function(p){col+=p.amt});
 return {students:128,unpaidAmt:un+BASE.unpaidAmt,unpaidCnt:cnt+BASE.unpaidCount,overdue:od,dueSoon:ds,pending:pend,presentPct:Math.round(100*pres/tot),collected:col,
  sessionsToday:S.corder.length,running:S.corder.filter(function(i){return E.sessStatus(i)==='now'}).length};
};
E.todos=function(){
 var S=E.S,out=[];
 S.corder.forEach(function(id){if(E.sessStatus(id)!=='next'&&!S.saved[id])out.push({k:'att',s:id,go:'absen',text:'Absensi '+S.cls[id].name+' belum disimpan'})});
 var st=E.stats();
 if(st.pending)out.push({k:'pend',go:'tagih',text:st.pending+' konfirmasi pembayaran menunggu'});
 if(st.dueSoon+st.overdue)out.push({k:'due',go:'tagih',text:(st.dueSoon+st.overdue)+' tagihan jatuh tempo atau terlambat'});
 return out;
};
E.subj=function(stuId){var s=E.S.stu[stuId],inMtk=E.S.grade.pub[stuId]!=null;return [['Matematika',inMtk?E.S.grade.pub[stuId]:s.tr[2]],['IPA',s.tr[1]],['B. Inggris',s.tr[0]]]};
E.attention=function(id){var s=E.S.stu[id],i=E.invOf(id),st=i&&E.invState(i).k,sc=E.S.grade.scores[id]!=null?E.S.grade.scores[id]:s.tr[2];return s.att<86||st==='terlambat'||sc<70};

/* ---- tindakan ---- */
function tick(n){E.S.clock+=n||1}
function feed(kind,who,text,extra){var f={t:E.time(E.S.clock),who:who,kind:kind,text:text};if(extra)for(var k in extra)f[k]=extra[k];E.S.feed.push(f)}
E.mark=function(sid,stu){var a=E.S.att[sid]=E.S.att[sid]||{},i=ORDER.indexOf(a[stu]);a[stu]=ORDER[(i+1)%4];E.S.saved[sid]=false};
E.markAll=function(sid){var a=E.S.att[sid]=E.S.att[sid]||{};E.S.cls[sid].roster.forEach(function(s){a[s]='H'});E.S.saved[sid]=false};
E.saveAtt=function(sid){var a=E.S.att[sid]=E.S.att[sid]||{},c=E.S.cls[sid];c.roster.forEach(function(s){if(!a[s])a[s]='H'});E.S.saved[sid]=true;var k=E.counts(sid);tick(1);
 feed('att',c.tutor,'Absensi '+c.name+' disimpan: '+k.H+' hadir'+(k.T?' · '+k.T+' telat':'')+(k.A?' · '+k.A+' absen':'')+(k.I?' · '+k.I+' izin':''),{cls:sid})};
E.pay=function(id,m){var i=E.S.inv.filter(function(x){return x.id===id})[0];if(!i||i.status==='lunas')return;i.status='lunas';i.pending=null;i.method=m||'Tunai';tick(2);
 E.S.pay.push({t:E.time(E.S.clock),stu:i.stu,item:i.item,amt:i.amt,m:i.method});
 feed('pay','Sari (Admin)','Pembayaran '+i.item+' '+E.S.stu[i.stu].name+' dicatat: Rp '+E.rp(i.amt)+' ('+i.method+')',{stu:i.stu})};
E.requestPay=function(id,m){var i=E.S.inv.filter(function(x){return x.id===id})[0];if(!i||i.status==='lunas')return;i.pending=m;tick(1);
 feed('sys',E.S.stu[i.stu].ortu,'Melaporkan sudah membayar '+i.item+' '+E.S.stu[i.stu].name+' ('+m+'). Menunggu konfirmasi admin.',{stu:i.stu,inv:id})};
E.confirmPay=function(id){var i=E.S.inv.filter(function(x){return x.id===id})[0];if(i)E.pay(id,i.pending||'Transfer')};
E.remind=function(id){var i=E.S.inv.filter(function(x){return x.id===id})[0];if(!i)return;i.reminded=true;tick(1);feed('sys','Sari (Admin)','Pengingat tagihan dikirim ke '+E.S.stu[i.stu].ortu+' ('+E.S.stu[i.stu].name+')',{stu:i.stu})};
E.remindAll=function(){var n=0;E.S.inv.forEach(function(i){if(i.status!=='lunas'&&!i.pending&&i.due<TODAY+1){i.reminded=true;n++}});tick(1);feed('sys','Sari (Admin)',n+' pengingat dikirim ke orang tua');return n};
E.grade=function(stu,d){var g=E.S.grade;g.scores[stu]=Math.max(0,Math.min(100,(g.scores[stu]||0)+d));g.published=false};
E.publish=function(){var g=E.S.grade;g.pub=JSON.parse(JSON.stringify(g.scores));g.published=true;tick(1);feed('grade','Pak Fariz',g.title+' dipublikasikan.',{cls:'mtk5'})};
E.addInvoice=function(stu){var s=E.S.stu[stu],amt=/SD/.test(s.lv)?350000:/SMP/.test(s.lv)?450000:600000;E.S.inv.push({id:'i'+(E.S.inv.length+1),stu:stu,item:'SPP November',amt:amt,due:56,status:'belum',pending:null});tick(1);feed('sys','Sari (Admin)','Tagihan SPP November untuk '+s.name+' diterbitkan: Rp '+E.rp(amt),{stu:stu})};
E.say=function(who,text,room){tick(1);feed('msg',who,text,{room:room})};

/* ---- modal bersama ---- */
function btn(label,act,d,primary){var a=' data-act="'+act+'"';for(var k in d)a+=' data-'+k+'="'+d[k]+'"';return '<button type="button" class="mbtn'+(primary?' p':'')+'"'+a+'>'+label+'</button>'}
E.btn=btn;
E.modalHTML=function(ui){
 var m=ui.modal,S=E.S;if(!m)return '';
 function wrap(t,b,f){return '<div class="mdl" data-act="noop0"><div class="mbox"><h4>'+t+'</h4><div class="mb">'+b+'</div><div class="mf">'+f+'</div></div></div>'}
 if(m.t==='pay'){var i=S.inv.filter(function(x){return x.id===m.id})[0],s=S.stu[i.stu],stt=E.invState(i);
  return wrap('Catat pembayaran','<b>'+s.name+'</b> · '+i.item+'<br>Jumlah: <b>Rp '+E.rp(i.amt)+'</b> · jatuh tempo '+E.dueLabel(i.due)+(i.pending?'<br><i>Orang tua melapor: '+i.pending+'</i>':'')+'<br><span style="opacity:.7">Dicatat manual oleh admin (tanpa gerbang pembayaran).</span>',
   btn('Batal','close',{})+btn('Tunai','payGo',{id:i.id,m:'Tunai'},!i.pending||i.pending==='Tunai')+btn('Transfer','payGo',{id:i.id,m:'Transfer'},i.pending==='Transfer'))}
 if(m.t==='req'){var i2=S.inv.filter(function(x){return x.id===m.id})[0],s2=S.stu[i2.stu];
  return wrap('Lapor sudah membayar','<b>'+i2.item+'</b> untuk '+s2.name+'<br>Jumlah: <b>Rp '+E.rp(i2.amt)+'</b><br>Admin akan memeriksa lalu mengonfirmasi. Status berubah menjadi "menunggu konfirmasi".',
   btn('Batal','close',{})+btn('Tunai di kantor','reqGo',{id:i2.id,m:'Tunai'})+btn('Transfer bank','reqGo',{id:i2.id,m:'Transfer'},true))}
 if(m.t==='roster'){var c=S.cls[m.s],a=S.att[m.s]||{};
  return wrap(c.name+' · '+E.time(c.start)+'–'+E.time(c.end),'<div class="rost">'+c.roster.map(function(id){var v=a[id];return '<div class="rr"><span>'+S.stu[id].name+'</span><button type="button" class="mc '+(v||'N')+'" data-act="mark" data-s="'+m.s+'" data-st="'+id+'">'+(v?LBL[v]:'Isi')+'</button></div>'}).join('')+'</div><span style="opacity:.7">Ketuk status untuk mengganti: Hadir → Telat → Absen → Izin.</span>',
   btn('Semua hadir','markAll',{s:m.s})+btn(S.saved[m.s]?'Tersimpan ✓':'Simpan absensi','saveAtt',{s:m.s},true)+btn('Tutup','close',{}))}
 if(m.t==='profile'){var s3=S.stu[m.id],iv=E.invOf(m.id),stt3=iv?E.invState(iv):null,mk=E.lastMark(m.id);
  return wrap(s3.name,s3.lv+' · wali: '+s3.ortu+'<br>Kehadiran: <b>'+s3.att+'%</b>'+(mk?' · hari ini: <b>'+LBL[mk]+'</b>':'')+'<br>Nilai terakhir: <b>'+(S.grade.scores[m.id]!=null?S.grade.scores[m.id]:s3.tr[2])+'</b> (tren '+s3.tr.join(' → ')+')'+(iv?'<br>Tagihan: '+iv.item+' Rp '+E.rp(iv.amt)+' · <b>'+stt3.l+'</b>':''),
   btn('Tutup','close',{})+(iv&&iv.status!=='lunas'?btn(iv.pending?'Konfirmasi':'Catat bayar',iv.pending?'confirm':'payAsk',{id:iv.id},true)+(iv.pending?'':btn('Kirim pengingat','remind',{id:iv.id})):''))}
 if(m.t==='inv'){return wrap('Buat tagihan SPP November','Pilih siswa:<div class="chs">'+S.sorder.map(function(id){return '<button type="button" class="mc N" data-act="invGo" data-stu="'+id+'">'+S.stu[id].name+'</button>'}).join('')+'</div>',btn('Batal','close',{}))}
 return '';
};

/* ---- tindakan umum (dipakai semua arah) ---- */
E.common=function(a,d,ui){
 switch(a){
  case 'noop0':return false;
  case 'close':ui.modal=null;return true;
  case 'go':ui.view=d.v;ui.sel=null;ui.modal=null;return true;
  case 'sel':ui.sel=ui.sel===d.id?null:d.id;return true;
  case 'mark':E.mark(d.s,d.st);return true;
  case 'markAll':E.markAll(d.s);ui.toast='Semua ditandai hadir';return true;
  case 'saveAtt':E.saveAtt(d.s);ui.toast='Absensi disimpan';return true;
  case 'roster':ui.modal={t:'roster',s:d.s};return true;
  case 'profile':ui.modal={t:'profile',id:d.id};return true;
  case 'payAsk':ui.modal={t:'pay',id:d.id};return true;
  case 'payGo':E.pay(d.id,d.m);ui.modal=null;ui.toast='Pembayaran dicatat ('+d.m+')';return true;
  case 'reqAsk':ui.modal={t:'req',id:d.id};return true;
  case 'reqGo':E.requestPay(d.id,d.m);ui.modal=null;ui.toast='Laporan terkirim ke admin';return true;
  case 'confirm':E.confirmPay(d.id);ui.modal=null;ui.toast='Pembayaran dikonfirmasi';return true;
  case 'remind':E.remind(d.id);ui.modal=null;ui.toast='Pengingat dikirim ke orang tua';return true;
  case 'remindAll':ui.toast=E.remindAll()+' pengingat dikirim';return true;
  case 'grade':E.grade(d.st,+d.d);return true;
  case 'pub':E.publish();ui.toast='Nilai dipublikasikan ke siswa & orang tua';return true;
  case 'kid':ui.kid=d.id;return true;
  case 'filter':ui.filter=d.f;return true;
  case 'invNew':ui.modal={t:'inv'};return true;
  case 'invGo':E.addInvoice(d.stu);ui.modal=null;ui.toast='Tagihan diterbitkan';return true;
  case 'toast':ui.toast=d.msg;return true;
  case 'say':E.say(d.who,d.text,d.room);ui.toast='Pesan terkirim';return true;
  case 'reset':E.reset();ui.toast='Data demo dikembalikan';return true;
 }
 return false;
};

/* ---- mesin render ---- */
var comps=[];
E.regs={};
E.reg=function(dir,role,comp){E.regs[dir+'-'+role]=comp};
E.mount=function(el,key){
 var comp=E.regs[key];if(!comp)return;
 var ui=JSON.parse(JSON.stringify(comp.init||{})),timer=null,rec={el:el,key:key,ui:ui,draw:draw};
 function draw(){
  var keepScroll=[];el.querySelectorAll('[data-keep]').forEach(function(n){keepScroll.push([n.dataset.keep,n.scrollTop])});
  el.innerHTML=comp.render(ui,E.S)+E.modalHTML(ui)+(comp.modal?comp.modal(ui):'')+(ui.toast?'<div class="toast">'+ui.toast+'</div>':'');
  keepScroll.forEach(function(k){var n=el.querySelector('[data-keep="'+k[0]+'"]');if(n)n.scrollTop=k[1]});
  if(ui.toast){clearTimeout(timer);timer=setTimeout(function(){var t=el.querySelector('.toast');if(t)t.remove();ui.toast=null},2400)}
 }
 el.addEventListener('click',function(e){
  var t=e.target.closest('[data-act]');if(!t||!el.contains(t))return;
  var a=t.dataset.act,d=t.dataset;
  if(a==='noop0'&&e.target!==t)return;
  if(a==='noop0'){ui.modal=null;draw();return}
  var done=E.common(a,d,ui);
  if(!done&&comp.act)done=comp.act(a,d,ui);
  if(done){E.redraw()}
 });
 rec.draw=draw;comps.push(rec);draw();return rec;
};
E.redraw=function(){comps.forEach(function(c){if(c.el.offsetParent!==null)c.draw()})};
E.redrawAll=function(){comps.forEach(function(c){c.draw()})};
})();
