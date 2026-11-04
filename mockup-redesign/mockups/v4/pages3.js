/* V4: dasbor dan laporan versi modern (grafik SVG beranimasi, cincin progres, garis waktu, kartu rapor 3D). Menimpa halaman V3. */
(function(){
var A=window.EduApp,H=A.H,E=window.EDUDATA,idr=E.fmtIDR,fmt=E.fmtDate;
var ST_LBL={paid:'Lunas',unpaid:'Belum bayar',overdue:'Terlambat',partial:'Sebagian'},ST_CLS={paid:'ok',unpaid:'warn',overdue:'bad',partial:'info'};
function invChip(i){var s=E.invStatus(i);return H.chip(ST_CLS[s],ST_LBL[s])}

/* ---------- komponen grafik ---------- */
function spark(arr){var w=96,h=30,max=Math.max.apply(null,arr),min=Math.min.apply(null,arr),r=max-min||1;
 var p=arr.map(function(v,i){return [Math.round(i*(w/(arr.length-1))*10)/10,Math.round((h-3-(v-min)/r*(h-8))*10)/10]});
 var d='M'+p.map(function(q){return q.join(',')}).join(' L');
 return '<svg class="spark" viewBox="0 0 96 30" aria-hidden="true"><path class="sp-fill" d="'+d+' L96,30 L0,30Z"/><path class="sp-line" pathLength="1" d="'+d+'"/><circle class="sp-dot" cx="'+p[p.length-1][0]+'" cy="'+p[p.length-1][1]+'" r="2.4"/></svg>'}
function smooth(p){var d='M'+p[0][0]+','+p[0][1];for(var i=0;i<p.length-1;i++){var x0=p[i][0],y0=p[i][1],x1=p[i+1][0],y1=p[i+1][1],cx=(x0+x1)/2;d+=' C'+cx+','+y0+' '+cx+','+y1+' '+x1+','+y1}return d}
function areaChart(vals,labels,unit){
 var W=520,Ht=200,l=34,r=10,t=14,b=26,min=Math.max(0,Math.floor((Math.min.apply(null,vals)-8)/10)*10),max=Math.ceil(Math.max.apply(null,vals)/10)*10;if(max===min)max=min+10;
 var pts=vals.map(function(v,i){return [Math.round((l+i*(W-l-r)/(vals.length-1))*10)/10,Math.round((t+(1-(v-min)/(max-min))*(Ht-t-b))*10)/10]});
 var line=smooth(pts),grid='';for(var g=0;g<=3;g++){var y=t+g*(Ht-t-b)/3,v=Math.round(max-g*(max-min)/3);grid+='<line class="gl" x1="'+l+'" x2="'+(W-r)+'" y1="'+y+'" y2="'+y+'"/><text class="gt" x="'+(l-6)+'" y="'+(y+4)+'" text-anchor="end">'+v+(unit||'')+'</text>'}
 return '<svg class="area" viewBox="0 0 '+W+' '+Ht+'" role="img" aria-label="Grafik area">'+grid+'<path class="ar-fill" d="'+line+' L'+pts[pts.length-1][0]+','+(Ht-b)+' L'+pts[0][0]+','+(Ht-b)+'Z"/><path class="ar-line" pathLength="1" d="'+line+'"/>'+pts.map(function(p,i){return '<circle class="ar-dot" style="--i:'+i+'" cx="'+p[0]+'" cy="'+p[1]+'" r="3.6"/><text class="gt" x="'+p[0]+'" y="'+(Ht-8)+'" text-anchor="middle">'+labels[i]+'</text>'}).join('')+'</svg>'}
function donut(segs,center){
 var tot=segs.reduce(function(a,s){return a+s.v},0)||1,off=0,out='';
 segs.forEach(function(s,i){var p=s.v/tot*100;out+='<circle class="dn" style="--i:'+i+';stroke:'+s.c+'" cx="60" cy="60" r="46" pathLength="100" stroke-dasharray="'+Math.max(0,p-1.2)+' '+(100-Math.max(0,p-1.2))+'" stroke-dashoffset="'+(-off)+'"/>';off+=p});
 return '<div class="donut2"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="dn-bg" cx="60" cy="60" r="46"/>'+out+'</svg><div class="dn-c"><b>'+center[0]+'</b><small>'+center[1]+'</small></div></div>'}
function ring(pct,label,sub,color){return '<div class="rg"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="rg-bg" cx="40" cy="40" r="32"/><circle class="rg-v" style="stroke:'+color+'" cx="40" cy="40" r="32" pathLength="100" stroke-dasharray="'+Math.max(0,Math.min(100,pct))+' 100"/></svg><div class="rg-c"><b data-count>'+label+'</b></div><span>'+sub+'</span></div>'}
function kpi(label,value,sub,icon,tone,sp){return '<div class="kpi '+tone+' tilt"><span class="ki">'+H.ic(icon)+'</span><div class="kl">'+label+'</div><div class="kv">'+value+'</div><div class="ks">'+sub+'</div>'+(sp?spark(sp):'')+'</div>'}
function weekly(filterCls){
 var start=new Date(2026,8,1).getTime(),b={};
 Object.keys(E.D.att).forEach(function(k){var p=k.split('|');if(filterCls&&filterCls.indexOf(p[0])<0)return;var w=Math.floor((E.parse(p[1]).getTime()-start)/(7*864e5)),r=E.D.att[k];b[w]=b[w]||{a:0,t:0};Object.keys(r).forEach(function(s){b[w].t++;if(r[s]==='present'||r[s]==='late')b[w].a++})});
 var ks=Object.keys(b).map(Number).sort(function(x,y){return x-y}),vals=[],labels=[];ks.forEach(function(w){vals.push(Math.round(100*b[w].a/b[w].t));var d=new Date(start+w*7*864e5);labels.push(d.getDate()+'/'+(d.getMonth()+1))});
 return {vals:vals,labels:labels};
}
function timeline(list,withAct,role){
 return '<div class="tl">'+list.map(function(c){var st=E.sessStatus(c),e=E.edu(c.educator),saved=E.D.attSaved[c.id+'|'+E.TODAY];
  return '<div class="tli '+st+'"><span class="tld"></span><div class="tlc"><div class="tlh"><b>'+c.subject+'</b><span class="tlt">'+c.start+'–'+c.end+'</span></div><small>'+(role==='educator'?'':e.full_name+' · ')+c.room+' · '+E.rosterIds(c.id).length+' siswa</small><div class="tla">'+(st==='now'?H.chip('ok','Berjalan'):st==='done'?H.chip('mut','Selesai'):H.chip('info','Akan datang'))+(withAct?(saved?H.chip('ok','Absen ✓'):H.btn('Isi absensi','toAtt',{c:c.id},'sm')):'')+'</div></div></div>'}).join('')+'</div>'}
function annList(c,n){var role=c.role,list=E.D.ann.filter(function(a){return role==='admin'||a.audience==='all'||(a.audience==='parents'&&role==='parent')||(a.audience==='students'&&role==='student')||(a.audience==='educators'&&role==='educator')||(a.audience==='class'&&role!=='admin')}).slice(0,n||3);
 return list.length?'<div class="list">'+list.map(function(a){return '<div class="li an"><span class="grow"><b>'+H.esc(a.title)+'</b><small>'+a.by+' · '+fmt(a.date)+'</small></span></div>'}).join('')+'</div>':H.empty('Belum ada pengumuman','mega')}
function invMini(list,c){return list.length?'<div class="list">'+list.map(function(i){var s=E.stu(i.student);return '<div class="li"><span class="grow"><b>'+i.desc+(c.role==='admin'||c.role==='parent'?' · '+s.full_name.split(' ')[0]:'')+'</b><small>'+i.number+' · tempo '+fmt(i.due)+'</small></span><b class="nm">'+idr(i.amount-i.paid)+'</b>'+invChip(i)+'</div>'}).join('')+'</div>':H.empty('Tidak ada tagihan terbuka','rcpt')}

/* ---------- dasbor ---------- */
A.pages.dashboard=function(c){
 var role=c.role,out={title:'',sub:'',html:''},sub0='Jumat, 23 Oktober 2026';
 if(role==='admin'){
  var st=E.stats(),today=E.todaySessions(),unsaved=today.filter(function(x){return E.sessStatus(x)!=='next'&&!E.D.attSaved[x.id+'|'+E.TODAY]});
  var open=E.D.inv.filter(function(i){return E.invStatus(i)!=='paid'}).sort(function(a,b){return a.due<b.due?-1:1}).slice(0,4);
  var wk=weekly(),cnt={paid:0,partial:0,unpaid:0,overdue:0};E.D.inv.forEach(function(i){cnt[E.invStatus(i)]++});
  var tot=E.D.inv.length,paidPct=Math.round(100*cnt.paid/tot);
  out.title='Selamat '+(E.NOW<'12.00'?'pagi':'sore')+', '+H.esc(c.user.full_name.split(' ')[0]);out.sub=sub0+' · '+E.D.centre.name;
  out.html='<div class="dg r-admin"><div class="dg-kpis kpis">'+kpi('Siswa aktif',st.students,'dari '+E.D.students.length+' terdaftar','users','a',[8,9,9,10,10,11,11])+kpi('Pendidik',st.educators,'aktif','teach','b',[4,4,5,5,5,5,5])+kpi('Kelas',st.classes,'berjalan','cal','c',[4,5,5,5,6,6,6])+kpi('Pendapatan Okt',E.short(st.revenue),'tercatat','rcpt','d',[6,8,7,9,10,9,12])+kpi('Belum lunas',E.short(st.outstanding),st.overdue+' terlambat','chart','e',[9,8,9,7,6,7,5])+'</div>'+
   '<section class="card dg-trend"><header class="ch"><h3>Kehadiran per pekan</h3><div class="cha">'+H.chip('ok','Rata-rata '+Math.round(wk.vals.reduce(function(a,b){return a+b},0)/wk.vals.length)+'%')+'</div></header><div class="cb">'+areaChart(wk.vals,wk.labels,'%')+'</div></section>'+
   '<section class="card dg-donut"><header class="ch"><h3>Status tagihan</h3></header><div class="cb">'+donut([{v:cnt.paid,c:'var(--ok)'},{v:cnt.partial,c:'var(--info)'},{v:cnt.unpaid,c:'var(--warn)'},{v:cnt.overdue,c:'var(--bad)'}],[paidPct+'%','lunas'])+'<div class="legend"><span><i style="background:var(--ok)"></i>Lunas '+cnt.paid+'</span><span><i style="background:var(--info)"></i>Sebagian '+cnt.partial+'</span><span><i style="background:var(--warn)"></i>Belum '+cnt.unpaid+'</span><span><i style="background:var(--bad)"></i>Terlambat '+cnt.overdue+'</span></div></div></section>'+
   '<section class="card dg-today"><header class="ch"><h3>Jadwal hari ini</h3><div class="cha">'+H.btn('Semua kelas','nav',{r:'classes'},'ghost sm')+'</div></header><div class="cb">'+timeline(today,true,'admin')+'</div></section>'+
   '<section class="card dg-act"><header class="ch"><h3>Perlu tindakan</h3></header><div class="cb"><div class="list">'+(unsaved.length?unsaved.map(function(x){return '<div class="li alert"><span class="grow"><b>Absensi '+x.subject+' belum disimpan</b><small>'+x.start+' · '+E.edu(x.educator).full_name+'</small></span>'+H.btn('Buka','toAtt',{c:x.id},'sm')+'</div>'}).join(''):'')+(st.overdue?'<div class="li alert"><span class="grow"><b>'+st.overdue+' tagihan terlambat</b><small>Kirim pengingat atau catat pembayaran</small></span>'+H.btn('Lihat','nav',{r:'invoices'},'sm')+'</div>':'')+(!unsaved.length&&!st.overdue?H.empty('Semua beres','check'):'')+'</div></div></section>'+
   '<section class="card dg-cap"><header class="ch"><h3>Kapasitas kelas</h3></header><div class="cb"><div class="rings">'+E.D.classes.map(function(k){var n=E.rosterIds(k.id).length;return ring(Math.round(100*n/k.cap),n+'/'+k.cap,k.subject,k.color)}).join('')+'</div></div></section>'+
   '<section class="card dg-inv"><header class="ch"><h3>Tagihan terbuka</h3><div class="cha">'+H.btn('Semua','nav',{r:'invoices'},'ghost sm')+'</div></header><div class="cb">'+invMini(open,c)+'</div></section>'+
   '<section class="card dg-ann"><header class="ch"><h3>Pengumuman</h3><div class="cha">'+H.btn('Semua','nav',{r:'announcements'},'ghost sm')+'</div></header><div class="cb">'+annList(c,3)+'</div></section></div>';
 }else if(role==='educator'){
  var mine=E.D.classes.filter(function(k){return k.educator===c.edu.id}),ids={};mine.forEach(function(k){E.rosterIds(k.id).forEach(function(s){ids[s]=1})});
  var td=E.todaySessions().filter(function(k){return k.educator===c.edu.id}),drafts=E.D.assess.filter(function(a){return !a.published&&mine.some(function(k){return k.id===a.cls})});
  var wk2=weekly(mine.map(function(k){return k.id})),savedN=td.filter(function(k){return E.D.attSaved[k.id+'|'+E.TODAY]}).length;
  out.title='Halo, '+H.esc(c.user.full_name.split(' ')[0]);out.sub=sub0+' · '+td.length+' sesi hari ini';
  out.html='<div class="dg r-edu"><div class="dg-kpis kpis k4">'+kpi('Kelas saya',mine.length,'aktif','book','a',[1,2,2,2,3,3,3])+kpi('Siswa',Object.keys(ids).length,'di semua kelas','users','b',[6,7,8,8,9,10,10])+kpi('Sesi hari ini',td.length,'Jumat','cal','c',[2,3,2,3,3,2,3])+kpi('Nilai draf',drafts.length,'belum terbit','award','e',[3,2,2,1,2,1,1])+'</div>'+
   '<section class="card dg-trend"><header class="ch"><h3>Kehadiran kelas saya</h3></header><div class="cb">'+areaChart(wk2.vals,wk2.labels,'%')+'</div></section>'+
   '<section class="card dg-donut"><header class="ch"><h3>Absensi hari ini</h3></header><div class="cb">'+donut([{v:savedN,c:'var(--ok)'},{v:Math.max(0,td.length-savedN),c:'var(--warn)'}],[savedN+'/'+td.length,'tersimpan'])+'</div></section>'+
   '<section class="card dg-today"><header class="ch"><h3>Jadwal hari ini</h3></header><div class="cb">'+timeline(td,true,'educator')+'</div></section>'+
   '<section class="card dg-act"><header class="ch"><h3>Nilai menunggu</h3></header><div class="cb">'+(drafts.length?'<div class="list">'+drafts.map(function(a){return '<div class="li"><span class="grow"><b>'+a.name+'</b><small>'+E.cls(a.cls).subject+' · '+fmt(a.date)+'</small></span>'+H.chip('warn','Draf')+H.btn('Input','toGr',{c:a.cls,a:a.id},'sm')+'</div>'}).join('')+'</div>':H.empty('Semua nilai sudah terbit','award'))+'</div></section>'+
   '<section class="card dg-ann"><header class="ch"><h3>Pengumuman</h3><div class="cha">'+H.btn('Buat','nav',{r:'announcements'},'ghost sm')+'</div></header><div class="cb">'+annList(c,3)+'</div></section></div>';
 }else{
  var kid=role==='student'?c.stu:c.kid,cl=E.classesOf(kid.id).map(E.cls),res=E.resultsOf(kid.id),inv=E.D.inv.filter(function(i){return i.student===kid.id&&E.invStatus(i)!=='paid'});
  var nxt=cl.filter(function(k){return k.days.indexOf('Jum')>=0&&E.sessStatus(k)!=='done'}).sort(function(a,b){return a.start<b.start?-1:1})[0];
  var mats=E.D.mats.filter(function(m){return cl.some(function(k){return k.id===m.cls})}).slice(0,3),att=E.attPct(kid.id),avg=E.avgOf(kid.id);
  var bySub={};res.forEach(function(r){(bySub[r.a.cls]=bySub[r.a.cls]||[]).push(r.score)});
  var kids=role==='parent'?'<div class="kids">'+c.kids.map(function(k){return '<button type="button" class="kidc'+(k.id===kid.id?' on':'')+'" data-a="kid" data-id="'+k.id+'">'+H.av(k.full_name)+'<span><b>'+k.full_name+'</b><small>'+k.year+'</small></span></button>'}).join('')+'</div>':'';
  var prog=0;if(nxt&&E.sessStatus(nxt)==='now'){var tm=function(x){var p=x.split('.');return +p[0]*60+ +p[1]},n=tm(E.NOW);prog=Math.round(100*(n-tm(nxt.start))/(tm(nxt.end)-tm(nxt.start)))}
  out.title=role==='student'?'Halo, '+H.esc(kid.full_name.split(' ')[0])+'!':'Halo, '+H.esc(c.user.full_name.split(' ')[0]);out.sub=sub0+(role==='parent'?' · memantau '+c.kids.length+' anak':'');
  out.html=kids+'<div class="dg stu"><section class="card dg-hero">'+(nxt?'<div class="hero-c" style="--c:'+nxt.color+'"><div><div class="eyebrow">Kelas berikutnya'+(role==='parent'?' · '+kid.full_name.split(' ')[0]:'')+'</div><h2>'+nxt.subject+'</h2><p>Hari ini · '+nxt.start+'–'+nxt.end+' · '+nxt.room+'</p><p class="who">'+E.edu(nxt.educator).full_name+'</p>'+H.chip(E.sessStatus(nxt)==='now'?'ok':'info',E.sessStatus(nxt)==='now'?'Sedang berjalan':'Akan datang')+'</div>'+ring(E.sessStatus(nxt)==='now'?prog:0,E.sessStatus(nxt)==='now'?prog+'%':'—','berjalan',nxt.color)+'</div>':H.empty('Tidak ada kelas hari ini','cal'))+'</section>'+
   '<section class="card dg-rings"><header class="ch"><h3>Ringkasan</h3></header><div class="cb"><div class="rings r3">'+ring(att,att+'%','Kehadiran','var(--ok)')+ring(avg,avg||'—','Rata-rata nilai','var(--pri)')+ring(Math.round(100*(res.filter(function(r){return r.score>=r.a.pass}).length)/Math.max(1,res.length)),res.filter(function(r){return r.score>=r.a.pass}).length+'/'+res.length,'Lulus','var(--info)')+'</div></div></section>'+
   '<section class="card dg-flip"><div class="flip" tabindex="0" role="button" aria-label="Balik kartu rapor"><div class="fl-in"><div class="fl-f"><div class="fl-top"><span class="fl-chip">KARTU RAPOR</span><span>'+kid.code+'</span></div><h3>'+kid.full_name+'</h3><p>'+kid.year+' · '+kid.school+'</p><div class="fl-avg"><b>'+(avg||'—')+'</b><small>rata-rata nilai</small></div><small class="hintf">Ketuk untuk membalik</small></div><div class="fl-b"><div class="fl-top"><span class="fl-chip">PER MATA PELAJARAN</span></div>'+(Object.keys(bySub).length?Object.keys(bySub).map(function(k){var v=bySub[k],a2=Math.round(v.reduce(function(x,y){return x+y},0)/v.length);return '<div class="fl-r"><span><i class="sdot" style="--c:'+E.cls(k).color+'"></i>'+E.cls(k).subject+'</span><b>'+a2+'</b><div class="bar"><i style="width:'+a2+'%"></i></div></div>'}).join(''):'<p>Belum ada nilai terbit</p>')+'<small class="hintf">Ketuk untuk kembali</small></div></div></div></section>'+
   '<section class="card dg-res"><header class="ch"><h3>Hasil terbaru</h3><div class="cha">'+H.btn('Semua','nav',{r:'results'},'ghost sm')+'</div></header><div class="cb">'+(res.length?'<div class="list">'+res.slice(0,3).map(function(r){return '<div class="li"><span class="grow"><b>'+r.a.name+'</b><small>'+E.cls(r.a.cls).subject+' · '+fmt(r.a.date)+'</small></span><div class="pbar"><i style="width:'+r.score+'%" class="'+(r.score>=r.a.pass?'ok':'bad')+'"></i></div><span class="score '+(r.score>=r.a.pass?'ok':'bad')+'">'+r.score+'</span></div>'}).join('')+'</div>':H.empty('Belum ada hasil terbit','award'))+'</div></section>'+
   '<section class="card dg-inv"><header class="ch"><h3>Biaya</h3><div class="cha">'+H.btn('Detail','nav',{r:'invoices'},'ghost sm')+'</div></header><div class="cb">'+invMini(inv.slice(0,3),c)+'</div></section>'+
   '<section class="card dg-mat"><header class="ch"><h3>Materi terbaru</h3></header><div class="cb">'+(mats.length?'<div class="list">'+mats.map(function(m){return '<div class="li"><span class="mi">'+H.ic(m.type==='video'?'video':m.type==='link'?'link':'file')+'</span><span class="grow"><b>'+H.esc(m.title)+'</b><small>'+E.cls(m.cls).subject+' · '+fmt(m.date)+'</small></span></div>'}).join('')+'</div>':H.empty('Belum ada materi','folder'))+'</div></section>'+
   '<section class="card dg-ann"><header class="ch"><h3>Pengumuman</h3><div class="cha">'+H.btn('Semua','nav',{r:'announcements'},'ghost sm')+'</div></header><div class="cb">'+annList(c,3)+'</div></section></div>';
 }
 return out;
};

/* ---------- laporan ---------- */
A.pages.reports=function(c){
 var D=E.D,paid=D.inv.filter(function(i){return E.invStatus(i)==='paid'}).length,rev=D.pay.reduce(function(a,p){return a+p.amount},0),cnt={paid:0,partial:0,unpaid:0,overdue:0};D.inv.forEach(function(i){cnt[E.invStatus(i)]++});
 var months=[['Mei',9.8],['Jun',10.6],['Jul',10.1],['Agu',11.4],['Sep',12.2],['Okt',Math.max(5.6,rev/1e6-12.2)]],wk=weekly();
 return {title:'Laporan',sub:'Ringkasan keuangan dan operasional',actions:H.btn(H.ic('dl')+' Ekspor CSV','toast',{m:'class-report.csv diunduh (demo)'},'sm'),html:
  '<div class="dg rep"><div class="dg-kpis kpis k4">'+kpi('Siswa aktif',E.stats().students,'','users','a',[8,9,9,10,10,11,11])+kpi('Total pendapatan',E.short(rev),'semua pembayaran','rcpt','d',[9,10,10,11,12,12,14])+kpi('Tagihan lunas',paid+'/'+D.inv.length,Math.round(100*paid/D.inv.length)+'%','check','b',[40,48,52,55,60,66,70])+kpi('Kelas',D.classes.length,'','cal','c',[4,5,5,5,6,6,6])+'</div>'+
  '<section class="card dg-trend"><header class="ch"><h3>Pendapatan 6 bulan (juta Rp)</h3></header><div class="cb">'+areaChart(months.map(function(m){return Math.round(m[1]*10)/10}),months.map(function(m){return m[0]}),'')+'</div></section>'+
  '<section class="card dg-donut"><header class="ch"><h3>Status tagihan</h3></header><div class="cb">'+donut([{v:cnt.paid,c:'var(--ok)'},{v:cnt.partial,c:'var(--info)'},{v:cnt.unpaid,c:'var(--warn)'},{v:cnt.overdue,c:'var(--bad)'}],[Math.round(100*cnt.paid/D.inv.length)+'%','lunas'])+'<div class="legend"><span><i style="background:var(--ok)"></i>Lunas '+cnt.paid+'</span><span><i style="background:var(--info)"></i>Sebagian '+cnt.partial+'</span><span><i style="background:var(--warn)"></i>Belum '+cnt.unpaid+'</span><span><i style="background:var(--bad)"></i>Terlambat '+cnt.overdue+'</span></div></div></section>'+
  '<section class="card dg-att"><header class="ch"><h3>Kehadiran per pekan</h3></header><div class="cb">'+areaChart(wk.vals,wk.labels,'%')+'</div></section>'+
  '<section class="card dg-cap"><header class="ch"><h3>Utilisasi kelas</h3></header><div class="cb"><div class="rings">'+D.classes.map(function(k){var n=E.rosterIds(k.id).length;return ring(Math.round(100*n/k.cap),Math.round(100*n/k.cap)+'%',k.subject,k.color)}).join('')+'</div></div></section></div>'};
};
})();
