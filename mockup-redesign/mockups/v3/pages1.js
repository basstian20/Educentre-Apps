/* V3 halaman bagian 1: dasbor 4 peran, laporan, siswa (+impor CSV, rapor), pendidik, orang tua, anak saya. */
(function(){
var A=window.EduApp,H=A.H,E=window.EDUDATA,fmt=E.fmtDate,idr=E.fmtIDR;
var ST_LBL={paid:'Lunas',unpaid:'Belum bayar',overdue:'Terlambat',partial:'Sebagian'};
var ST_CLS={paid:'ok',unpaid:'warn',overdue:'bad',partial:'info'};
function invChip(i){var s=E.invStatus(i);return H.chip(ST_CLS[s],ST_LBL[s])}
function attChip(v){return H.chip(v==='present'?'ok':v==='late'?'warn':v==='absent'?'bad':'mut',{present:'Hadir',late:'Telat',absent:'Absen',excused:'Izin'}[v])}
function kpi(label,value,sub,icon,tone){return '<div class="kpi '+(tone||'')+'"><span class="ki">'+H.ic(icon)+'</span><div class="kl">'+label+'</div><div class="kv">'+value+'</div>'+(sub?'<div class="ks">'+sub+'</div>':'')+'</div>'}
function sessItem(c,withAct,role){var st=E.sessStatus(c),e=E.edu(c.educator);
 var chip=st==='now'?H.chip('ok','Berjalan'):st==='done'?H.chip('mut','Selesai'):H.chip('info','Akan datang');
 var saved=E.D.attSaved[c.id+'|'+E.TODAY];
 return '<div class="li"><span class="tm">'+c.start+'</span><span class="grow"><b><i class="sdot" style="--c:'+c.color+'"></i>'+c.subject+'</b><small>'+(role==='educator'?'':e.full_name+' · ')+c.room+' · '+E.rosterIds(c.id).length+' siswa</small></span>'+chip+(withAct?(saved?H.chip('ok','Absen ✓'):H.btn('Isi absensi','toAtt',{c:c.id},'sm')):'')+'</div>'}
function annList(c,n){var role=c.role,list=E.D.ann.filter(function(a){return role==='admin'||a.audience==='all'||(a.audience==='parents'&&role==='parent')||(a.audience==='students'&&role==='student')||(a.audience==='educators'&&role==='educator')||(a.audience==='class'&&role!=='admin')}).slice(0,n||3);
 return list.length?'<div class="list">'+list.map(function(a){return '<div class="li an"><span class="grow"><b>'+H.esc(a.title)+'</b><small>'+a.by+' · '+fmt(a.date)+'</small><p>'+H.esc(a.body).slice(0,110)+'…</p></span></div>'}).join('')+'</div>':H.empty('Belum ada pengumuman','mega')}
function barRow(label,val,max,sub){return '<div class="br"><div class="brl"><span>'+label+'</span><b>'+(sub||val)+'</b></div><div class="bar"><i style="width:'+Math.min(100,Math.round(100*val/max))+'%"></i></div></div>'}
function invMini(list,c){return list.length?'<div class="list">'+list.map(function(i){var s=E.stu(i.student);return '<div class="li"><span class="grow"><b>'+i.desc+(c.role==='admin'||c.role==='parent'?' · '+s.full_name.split(' ')[0]:'')+'</b><small>'+i.number+' · jatuh tempo '+fmt(i.due)+'</small></span><b class="nm">'+idr(i.amount-i.paid)+'</b>'+invChip(i)+'</div>'}).join('')+'</div>':H.empty('Tidak ada tagihan terbuka','rcpt')}

/* ---------- dasbor ---------- */
A.pages.dashboard=function(c){
 var role=c.role,S=c.S,out={title:'',sub:'',html:''},greet='Halo, '+H.esc(c.user.full_name.split(' ')[0]);
 if(role==='admin'){
  var st=E.stats(),today=E.todaySessions(),unsaved=today.filter(function(x){return E.sessStatus(x)!=='next'&&!E.D.attSaved[x.id+'|'+E.TODAY]});
  var open=E.D.inv.filter(function(i){return E.invStatus(i)!=='paid'}).sort(function(a,b){return a.due<b.due?-1:1}).slice(0,4);
  var cls=E.D.classes.map(function(k){return barRow(k.subject,E.rosterIds(k.id).length,k.cap,E.rosterIds(k.id).length+'/'+k.cap)}).join('');
  out.title='Selamat '+(E.NOW<'12.00'?'pagi':'sore')+', '+H.esc(c.user.full_name.split(' ')[0]);out.sub='Jumat, 23 Oktober 2026 · '+E.D.centre.name;
  out.html='<div class="kpis">'+kpi('Siswa aktif',st.students,'dari '+E.D.students.length+' terdaftar','users','a')+kpi('Pendidik',st.educators,'aktif','teach','b')+kpi('Kelas',st.classes,'berjalan','cal','c')+kpi('Pendapatan Okt',E.short(st.revenue),'tercatat','rcpt','d')+kpi('Belum lunas',E.short(st.outstanding),st.overdue+' terlambat','chart','e')+'</div>'+
   '<div class="g2"><div>'+H.card('Perlu tindakan','<div class="list">'+(unsaved.length?unsaved.map(function(x){return '<div class="li alert"><span class="grow"><b>Absensi '+x.subject+' belum disimpan</b><small>'+x.start+' · '+E.edu(x.educator).full_name+'</small></span>'+H.btn('Buka','toAtt',{c:x.id},'sm')+'</div>'}).join(''):'')+(st.overdue?'<div class="li alert"><span class="grow"><b>'+st.overdue+' tagihan terlambat</b><small>Kirim pengingat atau catat pembayaran</small></span>'+H.btn('Lihat','nav',{r:'invoices'},'sm')+'</div>':'')+(!unsaved.length&&!st.overdue?H.empty('Semua beres','check'):'')+'</div>')+
   H.card('Tagihan terbuka',invMini(open,c),H.btn('Semua','nav',{r:'invoices'},'ghost sm'))+'</div><div>'+H.card('Jadwal hari ini','<div class="list">'+today.map(function(x){return sessItem(x,true,'admin')}).join('')+'</div>',H.btn('Semua kelas','nav',{r:'classes'},'ghost sm'))+H.card('Kapasitas kelas',cls)+H.card('Pengumuman',annList(c,2),H.btn('Semua','nav',{r:'announcements'},'ghost sm'))+'</div></div>';
 }else if(role==='educator'){
  var mine=E.D.classes.filter(function(k){return k.educator===c.edu.id}),ids={};mine.forEach(function(k){E.rosterIds(k.id).forEach(function(s){ids[s]=1})});
  var td=E.todaySessions().filter(function(k){return k.educator===c.edu.id}),drafts=E.D.assess.filter(function(a){return !a.published&&mine.some(function(k){return k.id===a.cls})});
  out.title='Halo, '+H.esc(c.user.full_name.split(' ')[0]);out.sub='Jumat, 23 Oktober 2026 · '+td.length+' sesi hari ini';
  out.html='<div class="kpis k4">'+kpi('Kelas saya',mine.length,'aktif','book','a')+kpi('Siswa',Object.keys(ids).length,'di semua kelas','users','b')+kpi('Sesi hari ini',td.length,'Jumat','cal','c')+kpi('Nilai draf',drafts.length,'belum terbit','award','e')+'</div>'+
   '<div class="g2"><div>'+H.card('Jadwal hari ini','<div class="list">'+td.map(function(x){return sessItem(x,true,'educator')}).join('')+'</div>')+H.card('Nilai menunggu',drafts.length?'<div class="list">'+drafts.map(function(a){return '<div class="li"><span class="grow"><b>'+a.name+'</b><small>'+E.cls(a.cls).subject+' · '+fmt(a.date)+'</small></span>'+H.chip('warn','Draf')+H.btn('Input','toGr',{c:a.cls,a:a.id},'sm')+'</div>'}).join('')+'</div>':H.empty('Semua nilai sudah terbit','award'))+'</div><div>'+H.card('Pengumuman',annList(c,3),H.btn('Buat','nav',{r:'announcements'},'ghost sm'))+'</div></div>';
 }else{
  var kid=role==='student'?c.stu:c.kid,cl=E.classesOf(kid.id).map(E.cls),res=E.resultsOf(kid.id),inv=E.D.inv.filter(function(i){return i.student===kid.id&&E.invStatus(i)!=='paid'});
  var nxt=cl.filter(function(k){return k.days.indexOf('Jum')>=0&&E.sessStatus(k)!=='done'}).sort(function(a,b){return a.start<b.start?-1:1})[0];
  var mats=E.D.mats.filter(function(m){return cl.some(function(k){return k.id===m.cls})}).slice(0,3);
  out.title=role==='student'?'Halo, '+H.esc(kid.full_name.split(' ')[0])+'!':'Halo, '+H.esc(c.user.full_name.split(' ')[0]);out.sub='Jumat, 23 Oktober 2026'+(role==='parent'?' · memantau '+c.kids.length+' anak':'');
  var kids=role==='parent'?'<div class="kids">'+c.kids.map(function(k){return '<button type="button" class="kidc'+(k.id===kid.id?' on':'')+'" data-a="kid" data-id="'+k.id+'">'+H.av(k.full_name)+'<span><b>'+k.full_name+'</b><small>'+k.year+'</small></span></button>'}).join('')+'</div>':'';
  out.html=kids+'<div class="kpis k4">'+kpi('Kehadiran',E.attPct(kid.id)+'%','sejak September','check','a')+kpi('Rata-rata nilai',E.avgOf(kid.id)||'—','nilai terbit','award','b')+kpi('Kelas diikuti',cl.length,'aktif','cal','c')+kpi('Tagihan terbuka',inv.length?idr(inv.reduce(function(a,i){return a+i.amount-i.paid},0)):'Lunas',inv.length?inv.length+' tagihan':'Terima kasih','rcpt',inv.length?'e':'d')+'</div>'+
   '<div class="g2"><div>'+(nxt?H.card(role==='student'?'Kelas berikutnya':'Kelas berikutnya · '+kid.full_name.split(' ')[0],'<div class="next" style="--c:'+nxt.color+'"><div class="nt1">'+nxt.subject+'</div><div class="nt2">Hari ini · '+nxt.start+'–'+nxt.end+' · '+nxt.room+'</div><div class="nt3">'+E.edu(nxt.educator).full_name+'</div>'+H.chip(E.sessStatus(nxt)==='now'?'ok':'info',E.sessStatus(nxt)==='now'?'Sedang berjalan':'Akan datang')+'</div>'):'')+
   H.card('Hasil terbaru',res.length?'<div class="list">'+res.slice(0,3).map(function(r){return '<div class="li"><span class="grow"><b>'+r.a.name+'</b><small>'+E.cls(r.a.cls).subject+' · '+fmt(r.a.date)+'</small></span><span class="score '+(r.score>=r.a.pass?'ok':'bad')+'">'+r.score+'</span></div>'}).join('')+'</div>':H.empty('Belum ada hasil terbit','award'),H.btn('Semua','nav',{r:'results'},'ghost sm'))+
   H.card('Biaya',invMini(inv.slice(0,3),c),H.btn('Detail','nav',{r:'invoices'},'ghost sm'))+'</div><div>'+
   H.card('Materi terbaru',mats.length?'<div class="list">'+mats.map(function(m){return '<div class="li"><span class="mi">'+H.ic(m.type==='video'?'video':m.type==='link'?'link':'file')+'</span><span class="grow"><b>'+H.esc(m.title)+'</b><small>'+E.cls(m.cls).subject+' · '+fmt(m.date)+'</small></span></div>'}).join('')+'</div>':H.empty('Belum ada materi','folder'),role==='student'?H.btn('Semua','nav',{r:'materials'},'ghost sm'):'')+
   H.card('Pengumuman',annList(c,3),H.btn('Semua','nav',{r:'announcements'},'ghost sm'))+'</div></div>';
 }
 return out;
};
A.acts.toAtt=function(c,d){c.S.att.cls=d.c;c.S.att.date=E.TODAY;c.go('attendance')};
A.acts.toGr=function(c,d){c.S.gr.cls=d.c;c.S.gr.aid=d.a;c.go('grades')};
A.acts.kid=function(c,d){c.S.kid=d.id};

/* ---------- laporan ---------- */
A.pages.reports=function(c){
 var D=E.D,paid=D.inv.filter(function(i){return E.invStatus(i)==='paid'}).length,rev=D.pay.reduce(function(a,p){return a+p.amount},0);
 var cnt={paid:0,partial:0,unpaid:0,overdue:0};D.inv.forEach(function(i){cnt[E.invStatus(i)]++});var tot=D.inv.length;
 var p1=cnt.paid/tot*100,p2=p1+cnt.partial/tot*100,p3=p2+cnt.unpaid/tot*100;
 var months=[['Mei',9.8],['Jun',10.6],['Jul',10.1],['Agu',11.4],['Sep',12.2],['Okt',rev/1e6-12.2>0?rev/1e6-12.2:5.6]];
 var max=Math.max.apply(null,months.map(function(m){return m[1]}));
 return {title:'Laporan',sub:'Ringkasan keuangan dan operasional',actions:H.btn(H.ic('dl')+' Ekspor CSV','toast',{m:'class-report.csv diunduh (demo)'},'sm'),html:
  '<div class="kpis k4">'+kpi('Siswa aktif',E.stats().students,'','users','a')+kpi('Total pendapatan',idr(rev),'semua pembayaran','rcpt','d')+kpi('Tagihan lunas',paid+'/'+tot,Math.round(100*paid/tot)+'%','check','b')+kpi('Kelas',D.classes.length,'','cal','c')+'</div>'+
  '<div class="g3"><div class="span2">'+H.card('Pendapatan per bulan (juta Rp)','<div class="vbars">'+months.map(function(m){return '<div><b>'+m[1].toFixed(1).replace('.',',')+'</b><i style="height:'+Math.round(m[1]/max*150)+'px"></i><span>'+m[0]+'</span></div>'}).join('')+'</div>')+H.card('Utilisasi kelas',D.classes.map(function(k){var n=E.rosterIds(k.id).length;return barRow(k.subject,n,k.cap,n+'/'+k.cap+' · '+Math.round(100*n/k.cap)+'%')}).join(''))+'</div><div>'+
  H.card('Status tagihan','<div class="donut" style="background:conic-gradient(var(--ok) 0 '+p1+'%,var(--info) 0 '+p2+'%,var(--warn) 0 '+p3+'%,var(--bad) 0 100%)"><b>'+Math.round(p1)+'%</b></div><div class="legend"><span><i style="background:var(--ok)"></i>Lunas '+cnt.paid+'</span><span><i style="background:var(--info)"></i>Sebagian '+cnt.partial+'</span><span><i style="background:var(--warn)"></i>Belum bayar '+cnt.unpaid+'</span><span><i style="background:var(--bad)"></i>Terlambat '+cnt.overdue+'</span></div>')+'</div></div>'};
};

/* ---------- siswa ---------- */
var LEVELS=['Kelas 1 SD','Kelas 2 SD','Kelas 3 SD','Kelas 4 SD','Kelas 5 SD','Kelas 6 SD','Kelas 7 SMP','Kelas 8 SMP','Kelas 9 SMP','Kelas 10 SMA','Kelas 11 SMA','Kelas 12 SMA'];
function childCards(c){
 var kids=c.role==='parent'?c.kids:[];
 return {title:'Anak saya',sub:kids.length+' anak terdaftar',html:'<div class="g2">'+kids.map(function(k){var cl=E.classesOf(k.id).map(E.cls),inv=E.D.inv.filter(function(i){return i.student===k.id&&E.invStatus(i)!=='paid'});
  return H.card('','<div class="child"><div class="ch-h">'+H.av(k.full_name,'lg')+'<div><h4>'+k.full_name+'</h4><small>'+k.code+' · '+k.year+' · '+k.school+'</small></div></div><div class="ch-st"><div><b>'+E.attPct(k.id)+'%</b><small>Kehadiran</small></div><div><b>'+(E.avgOf(k.id)||'—')+'</b><small>Rata-rata</small></div><div><b>'+cl.length+'</b><small>Kelas</small></div></div><div class="chips">'+cl.map(function(x){return '<span class="chip mut"><i class="sdot" style="--c:'+x.color+'"></i>'+x.subject+'</span>'}).join('')+'</div><div class="ch-f">'+(inv.length?H.chip('warn',inv.length+' tagihan terbuka'):H.chip('ok','Biaya lunas'))+H.btn(H.ic('print')+' Rapor','rapor',{id:k.id},'sm')+'</div></div>')}).join('')+'</div>'};
}
A.pages.students=function(c){
 if(c.role==='parent')return childCards(c);
 var t=c.table('students',E.D.students,{search:function(s){return s.full_name+' '+s.code+' '+s.school+' '+s.year+' '+E.par(s.parent).full_name},size:7,
  filter:function(s,st){return st.f==='all'||s.status===st.f},sorts:{name:function(s){return s.full_name},year:function(s){return LEVELS.indexOf(s.year)},status:function(s){return s.status},att:function(s){return E.attPct(s.id)}}});
 var rows=t.rows.map(function(s){var p=E.par(s.parent),pct=E.attPct(s.id);
  return '<tr><td data-l="Nama"><span class="nm">'+H.av(s.full_name)+'<span><b>'+s.full_name+'</b><small>'+s.code+'</small></span></span></td><td data-l="Sekolah">'+s.school+'</td><td data-l="Tingkat">'+s.year+'</td><td data-l="Orang tua">'+(p?p.full_name:'—')+'</td><td data-l="Kehadiran" class="n">'+(pct?pct+'%':'—')+'</td><td data-l="Status">'+H.chip(s.status==='active'?'ok':'mut',s.status==='active'?'Aktif':'Nonaktif')+'</td><td class="act">'+H.ibtn('print','rapor',{id:s.id},'Rapor')+H.ibtn('edit','editStudent',{id:s.id},'Ubah')+(s.status==='active'?H.ibtn('x','stStudent',{id:s.id,v:'inactive'},'Nonaktifkan'):H.ibtn('check','stStudent',{id:s.id,v:'active'},'Aktifkan'))+H.ibtn('trash','delAsk',{id:s.id,k:'student'},'Hapus','dg')+'</td></tr>'}).join('');
 return {title:'Siswa',sub:E.D.students.length+' siswa terdaftar',actions:H.btn(H.ic('ul')+' Impor CSV','importCsv',{},'sm')+H.btn(H.ic('dl')+' Ekspor','toast',{m:'students.csv diunduh (demo)'},'sm')+H.btn(H.ic('plus')+' Tambah siswa','addStudent',{},'pri sm'),
  html:'<div class="tools2">'+H.search(t,'Cari nama, kode, sekolah…')+H.filterChips(t,[['all','Semua'],['active','Aktif'],['inactive','Nonaktif']])+'</div>'+
  (t.all===0?H.empty('Belum ada siswa','users',H.btn('Tambah siswa','addStudent',{},'pri sm')):t.total===0?H.noMatch(t):H.card('','<div class="tw"><table class="tbl"><thead><tr>'+H.sortTh(t,'name','Nama')+'<th>Sekolah</th>'+H.sortTh(t,'year','Tingkat')+'<th>Orang tua</th>'+H.sortTh(t,'att','Hadir','n')+H.sortTh(t,'status','Status')+'<th></th></tr></thead><tbody>'+rows+'</tbody></table></div>'+H.pager(t),null,'flush'))};
};
A.acts.addStudent=function(c){c.S.modal={t:'student',f:{full_name:'',email:'',password:'',phone:'',dob:'2015-01-01',school:'',year:'Kelas 5 SD',status:'active',parent:E.D.parents[0].id}}};
A.acts.editStudent=function(c,d){var s=E.stu(d.id);c.S.modal={t:'student',id:s.id,f:{full_name:s.full_name,email:s.email,phone:s.phone,dob:s.dob,school:s.school,year:s.year,status:s.status,parent:s.parent}}};
A.acts.stStudent=function(c,d){E.setStudentStatus(d.id,d.v);c.toast(d.v==='active'?'Siswa diaktifkan':'Siswa dinonaktifkan')};
A.acts.delAsk=function(c,d){var n={student:E.stu,educator:E.edu,parent:E.par}[d.k];c.S.modal={t:'confirm',act:'delDo',id:d.id,k:d.k,msg:'Hapus <b>'+H.esc(n(d.id).full_name)+'</b>?'}};
A.acts.delDo=function(c,d){var k=c.S.modal.k,id=c.S.modal.id;({student:E.delStudent,educator:E.delEducator,parent:E.delParent})[k](id);c.S.modal=null;c.toast('Dihapus')};
A.acts.importCsv=function(c){c.S.modal={t:'import',f:{file:''}}};
A.acts.rapor=function(c,d){c.S.modal={t:'rapor',id:d.id}};
A.acts.toast=function(c,d){c.toast(d.m)};
A.modals.confirm=function(c,m){return H.confirm(m.msg,m.act,{id:m.id})};
A.modals.student=function(c,m){var f=m.f,pOpts=E.D.parents.map(function(p){return [p.id,p.full_name]});
 return H.modal(m.id?'Ubah siswa':'Tambah siswa','<div class="fg">'+H.field('Nama lengkap','full_name',f.full_name,{cls:'s2'})+H.field('Email','email',f.email,{type:'email'})+(m.id?'':H.field('Kata sandi','password',f.password,{type:'password'}))+H.field('Telepon','phone',f.phone)+H.field('Tanggal lahir','dob',f.dob,{type:'date'})+H.field('Sekolah','school',f.school)+H.sel('Tingkat','year',f.year,LEVELS.map(function(l){return [l,l]}))+H.sel('Status','status',f.status,[['active','Aktif'],['inactive','Nonaktif']])+H.sel('Orang tua','parent',f.parent,pOpts,{cls:'s2'})+'</div>',H.cancelBtn()+H.submit('Simpan'))};
A.submits.student=function(c,m){var f=m.f;if(!f.full_name.trim()){c.toast('Nama wajib diisi');return}E.saveStudent(Object.assign({},f,m.id?{id:m.id}:{}));c.S.modal=null;c.toast(m.id?'Siswa diperbarui':'Siswa ditambahkan');};
A.modals.import=function(c,m){var rows=[['Rani Kusuma','SDN Pucang 1','Kelas 4 SD'],['Tito Wibowo','SMPN 3','Kelas 8 SMP'],['Lia Permata','SMAN 2','Kelas 10 SMA']];
 return H.modal('Impor siswa dari CSV','<p class="mut">Format kolom: nama, sekolah, tingkat. Contoh berkas di bawah dipratinjau sebelum diimpor.</p><label class="fld"><span class="lbl">Berkas CSV</span><input class="inp" type="file" data-f="file" accept=".csv"></label><div class="tw"><table class="tbl"><thead><tr><th>Nama</th><th>Sekolah</th><th>Tingkat</th></tr></thead><tbody>'+rows.map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td></tr>'}).join('')+'</tbody></table></div><p class="mut">'+(m.f.file?'Berkas dipilih: <b>'+H.esc(m.f.file)+'</b>':'Belum memilih berkas, akan memakai contoh di atas.')+'</p>',H.cancelBtn()+H.submit('Impor 3 siswa'))};
A.submits.import=function(c){var n=E.importStudents([['Rani Kusuma','SDN Pucang 1','Kelas 4 SD'],['Tito Wibowo','SMPN 3','Kelas 8 SMP'],['Lia Permata','SMAN 2','Kelas 10 SMA']]);c.S.modal=null;c.toast(n+' siswa berhasil diimpor')};
A.modals.rapor=function(c,m){var s=E.stu(m.id),res=E.resultsOf(m.id),cl=E.classesOf(m.id).map(E.cls),p=E.par(s.parent);
 return H.modal('Rapor siswa','<div class="paper"><div class="ph1"><b>'+E.D.centre.name+'</b><small>'+E.D.centre.address+'</small></div><h4>Laporan Hasil Belajar</h4><div class="kvs"><div><span>Nama</span><b>'+s.full_name+'</b></div><div><span>Kode</span><b>'+s.code+'</b></div><div><span>Tingkat</span><b>'+s.year+'</b></div><div><span>Orang tua</span><b>'+(p?p.full_name:'—')+'</b></div></div><table class="tbl"><thead><tr><th>Penilaian</th><th>Kelas</th><th class="n">Nilai</th><th>Catatan</th></tr></thead><tbody>'+(res.length?res.map(function(r){return '<tr><td>'+r.a.name+'</td><td>'+E.cls(r.a.cls).subject+'</td><td class="n"><b>'+r.score+'</b></td><td>'+H.esc(r.remark||'—')+'</td></tr>'}).join(''):'<tr><td colspan="4">Belum ada nilai terbit</td></tr>')+'</tbody></table><div class="kvs"><div><span>Kehadiran</span><b>'+E.attPct(s.id)+'%</b></div><div><span>Rata-rata</span><b>'+(E.avgOf(s.id)||'—')+'</b></div><div><span>Kelas</span><b>'+cl.length+'</b></div></div></div>',H.btn('Tutup','mclose',{},'ghost')+H.btn(H.ic('print')+' Cetak','toast',{m:'Rapor dikirim ke printer (demo)'},'pri'),'wide')};

/* ---------- pendidik ---------- */
A.pages.educators=function(c){
 var t=c.table('educators',E.D.educators,{search:function(x){return x.full_name+' '+x.code+' '+x.field+' '+x.subjects},size:7,sorts:{name:function(x){return x.full_name},field:function(x){return x.field}}});
 var rows=t.rows.map(function(x){return '<tr><td data-l="Nama"><span class="nm">'+H.av(x.full_name)+'<span><b>'+x.full_name+'</b><small>'+x.code+'</small></span></span></td><td data-l="Bidang">'+x.field+'</td><td data-l="Mata pelajaran">'+x.subjects+'</td><td data-l="Kualifikasi">'+x.qual+'</td><td data-l="Status">'+H.chip(x.status==='active'?'ok':'mut',x.status==='active'?'Aktif':'Nonaktif')+'</td><td class="act">'+H.ibtn('edit','editEdu',{id:x.id},'Ubah')+H.ibtn('trash','delAsk',{id:x.id,k:'educator'},'Hapus','dg')+'</td></tr>'}).join('');
 return {title:'Pendidik',sub:E.D.educators.length+' pendidik',actions:H.btn(H.ic('plus')+' Tambah pendidik','addEdu',{},'pri sm'),html:'<div class="tools2">'+H.search(t)+'</div>'+(t.total===0?H.noMatch(t):H.card('','<div class="tw"><table class="tbl"><thead><tr>'+H.sortTh(t,'name','Nama')+H.sortTh(t,'field','Bidang')+'<th>Mata pelajaran</th><th>Kualifikasi</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>'+H.pager(t),null,'flush'))};
};
A.acts.addEdu=function(c){c.S.modal={t:'educator',f:{full_name:'',email:'',password:'',phone:'',field:'',subjects:'',qual:'',status:'active'}}};
A.acts.editEdu=function(c,d){var x=E.edu(d.id);c.S.modal={t:'educator',id:x.id,f:{full_name:x.full_name,email:x.email,phone:x.phone,field:x.field,subjects:x.subjects,qual:x.qual,status:x.status}}};
A.modals.educator=function(c,m){var f=m.f;return H.modal(m.id?'Ubah pendidik':'Tambah pendidik','<div class="fg">'+H.field('Nama lengkap','full_name',f.full_name,{cls:'s2'})+H.field('Email','email',f.email,{type:'email'})+(m.id?'':H.field('Kata sandi','password',f.password,{type:'password'}))+H.field('Telepon','phone',f.phone)+H.field('Bidang','field',f.field)+H.field('Mata pelajaran (pisahkan koma)','subjects',f.subjects,{cls:'s2'})+H.field('Kualifikasi','qual',f.qual,{cls:'s2'})+H.sel('Status','status',f.status,[['active','Aktif'],['inactive','Nonaktif']])+'</div>',H.cancelBtn()+H.submit('Simpan'))};
A.submits.educator=function(c,m){if(!m.f.full_name.trim()){c.toast('Nama wajib diisi');return}E.saveEducator(Object.assign({},m.f,m.id?{id:m.id}:{}));c.S.modal=null;c.toast(m.id?'Pendidik diperbarui':'Pendidik ditambahkan')};

/* ---------- orang tua ---------- */
A.pages.parents=function(c){
 var t=c.table('parents',E.D.parents,{search:function(x){return x.full_name+' '+x.email+' '+x.occupation},size:7,sorts:{name:function(x){return x.full_name}}});
 var rows=t.rows.map(function(x){var kids=E.childrenOf(x.id);return '<tr><td data-l="Nama"><span class="nm">'+H.av(x.full_name)+'<span><b>'+x.full_name+'</b><small>'+x.email+'</small></span></span></td><td data-l="Telepon">'+x.phone+'</td><td data-l="Pekerjaan">'+x.occupation+'</td><td data-l="Anak">'+(kids.length?kids.map(function(k){return '<span class="chip mut">'+k.full_name.split(' ')[0]+'</span>'}).join(' '):'—')+'</td><td class="act">'+H.ibtn('edit','editPar',{id:x.id},'Ubah')+H.ibtn('trash','delAsk',{id:x.id,k:'parent'},'Hapus','dg')+'</td></tr>'}).join('');
 return {title:'Orang tua',sub:E.D.parents.length+' akun orang tua',actions:H.btn(H.ic('plus')+' Tambah orang tua','addPar',{},'pri sm'),html:'<div class="tools2">'+H.search(t)+'</div>'+(t.total===0?H.noMatch(t):H.card('','<div class="tw"><table class="tbl"><thead><tr>'+H.sortTh(t,'name','Nama')+'<th>Telepon</th><th>Pekerjaan</th><th>Anak terhubung</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>'+H.pager(t),null,'flush'))};
};
A.acts.addPar=function(c){c.S.modal={t:'parent',f:{full_name:'',email:'',password:'',phone:'',occupation:''}}};
A.acts.editPar=function(c,d){var x=E.par(d.id);c.S.modal={t:'parent',id:x.id,f:{full_name:x.full_name,email:x.email,phone:x.phone,occupation:x.occupation}}};
A.modals.parent=function(c,m){var f=m.f;return H.modal(m.id?'Ubah orang tua':'Tambah orang tua','<div class="fg">'+H.field('Nama lengkap','full_name',f.full_name,{cls:'s2'})+H.field('Email','email',f.email,{type:'email'})+(m.id?'':H.field('Kata sandi','password',f.password,{type:'password'}))+H.field('Telepon','phone',f.phone)+H.field('Pekerjaan','occupation',f.occupation)+'</div>',H.cancelBtn()+H.submit('Simpan'))};
A.submits.parent=function(c,m){if(!m.f.full_name.trim()){c.toast('Nama wajib diisi');return}E.saveParent(Object.assign({},m.f,m.id?{id:m.id}:{}));c.S.modal=null;c.toast(m.id?'Data diperbarui':'Orang tua ditambahkan')};
})();
