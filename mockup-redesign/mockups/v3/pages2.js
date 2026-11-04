/* V3 halaman bagian 2: kelas, pendaftaran, absensi, nilai, hasil, materi, tagihan, pengumuman, pengaturan. */
(function(){
var A=window.EduApp,H=A.H,E=window.EDUDATA,fmt=E.fmtDate,idr=E.fmtIDR;
var DAYS=['Sen','Sel','Rab','Kam','Jum','Sab'],COLORS=['#2563eb','#059669','#d97706','#7c3aed','#db2777','#0891b2'];
var AS={present:['Hadir','ok'],late:['Telat','warn'],absent:['Absen','bad'],excused:['Izin','mut']};
var ST_LBL={paid:'Lunas',unpaid:'Belum bayar',overdue:'Terlambat',partial:'Sebagian'},ST_CLS={paid:'ok',unpaid:'warn',overdue:'bad',partial:'info'};
function invChip(i){var s=E.invStatus(i);return H.chip(ST_CLS[s],ST_LBL[s])}
function kidBar(c){return c.role==='parent'?'<div class="kids">'+c.kids.map(function(k){return '<button type="button" class="kidc'+(k.id===c.kid.id?' on':'')+'" data-a="kid" data-id="'+k.id+'">'+H.av(k.full_name)+'<span><b>'+k.full_name+'</b><small>'+k.year+'</small></span></button>'}).join('')+'</div>':''}
function subj(c){return c.role==='student'?c.stu:c.role==='parent'?c.kid:null}
function visibleClasses(c){
 if(c.role==='admin')return E.D.classes;
 if(c.role==='educator')return E.D.classes.filter(function(k){return k.educator===c.edu.id});
 return E.classesOf(subj(c).id).map(E.cls);
}
function deepSet(o,path,v){var p=path.split('.');for(var i=0;i<p.length-1;i++){o=o[p[i]]=o[p[i]]||{}}o[p[p.length-1]]=v}

/* ---------- kelas ---------- */
function timetable(list){
 var slots=[];list.forEach(function(k){if(slots.indexOf(k.start)<0)slots.push(k.start)});slots.sort();
 if(!list.length)return H.empty('Belum ada jadwal','cal');
 var g='<div class="ttg"><div class="th"></div>'+DAYS.map(function(d){return '<div class="th'+(d==='Jum'?' today':'')+'">'+d+'</div>'}).join('');
 slots.forEach(function(s){g+='<div class="tt">'+s+'</div>';DAYS.forEach(function(d){var items=list.filter(function(k){return k.start===s&&k.days.indexOf(d)>=0});g+='<div class="tc">'+items.map(function(k){return '<div class="tb" style="--c:'+k.color+'"><b>'+k.subject+'</b><small>'+k.start+'–'+k.end+' · '+k.room+'</small></div>'}).join('')+'</div>'})});
 return g+'</div>';
}
A.pages.classes=function(c){
 var list=visibleClasses(c),isA=c.role==='admin',sub=subj(c),S=c.S;
 var title=c.role==='student'?'Jadwal saya':c.role==='educator'?'Kelas saya':'Kelas';
 var toggle='<div class="seg"><button type="button" class="'+(S.cal==='cards'?'on':'')+'" data-a="calv" data-v="cards">Kartu</button><button type="button" class="'+(S.cal==='tt'?'on':'')+'" data-a="calv" data-v="tt">Jadwal mingguan</button></div>';
 var cards=list.length?'<div class="cgrid">'+list.map(function(k){var n=E.rosterIds(k.id).length,e=E.edu(k.educator);
  return '<article class="cc" style="--c:'+k.color+'"><div class="cc-h"><div><h4>'+k.subject+'</h4><small>'+k.level+'</small></div>'+(isA?'<div class="act">'+H.ibtn('edit','editClass',{id:k.id},'Ubah')+H.ibtn('trash','delClassAsk',{id:k.id},'Hapus','dg')+'</div>':'')+'</div><div class="cc-m"><span>'+H.ic('user')+e.full_name+'</span><span>'+H.ic('clock')+k.days.join(', ')+' · '+k.start+'–'+k.end+'</span><span>'+H.ic('book')+k.room+'</span></div><div class="cc-f"><div class="bar"><i style="width:'+Math.round(100*n/k.cap)+'%"></i></div><small>'+n+'/'+k.cap+' siswa</small>'+(isA?'<b>'+idr(k.fee)+'/bln</b>':'')+'</div>'+(c.role==='educator'?'<div class="cc-a">'+H.btn('Absensi','toAtt',{c:k.id},'sm')+H.btn('Nilai','toGr',{c:k.id,a:''},'sm')+'</div>':'')+'</article>'}).join('')+'</div>':H.empty('Belum ada kelas','cal',isA?H.btn('Tambah kelas','addClass',{},'pri sm'):'');
 return {title:title,sub:list.length+' kelas',actions:toggle+(isA?H.btn(H.ic('plus')+' Tambah kelas','addClass',{},'pri sm'):''),html:kidBar(c)+(S.cal==='cards'?cards:H.card('Jadwal mingguan',timetable(list)))};
};
A.acts.calv=function(c,d){c.S.cal=d.v};
A.acts.addClass=function(c){c.S.modal={t:'class',f:{subject:'',level:'Kelas 5 SD',educator:E.D.educators[0].id,room:'Ruang A',cap:12,color:COLORS[0],days:['Sen'],start:'15.30',end:'17.00',fee:200000}}};
A.acts.editClass=function(c,d){var k=E.cls(d.id);c.S.modal={t:'class',id:k.id,f:{subject:k.subject,level:k.level,educator:k.educator,room:k.room,cap:k.cap,color:k.color,days:k.days.slice(),start:k.start,end:k.end,fee:k.fee}}};
A.acts.toggleDay=function(c,d){var a=c.S.modal.f.days,i=a.indexOf(d.v);if(i>=0)a.splice(i,1);else a.push(d.v)};
A.acts.pickColor=function(c,d){c.S.modal.f.color=d.v};
A.acts.delClassAsk=function(c,d){c.S.modal={t:'confirm',act:'delClass',id:d.id,msg:'Hapus kelas <b>'+H.esc(E.cls(d.id).subject)+'</b> beserta pendaftarannya?'}};
A.acts.delClass=function(c){E.delClass(c.S.modal.id);c.S.modal=null;c.toast('Kelas dihapus')};
A.modals.class=function(c,m){var f=m.f;return H.modal(m.id?'Ubah kelas':'Tambah kelas','<div class="fg">'+H.field('Mata pelajaran','subject',f.subject,{cls:'s2'})+H.field('Tingkat','level',f.level)+H.sel('Pendidik','educator',f.educator,E.D.educators.map(function(x){return [x.id,x.full_name]}))+H.field('Ruang','room',f.room)+H.field('Kapasitas','cap',f.cap,{type:'number'})+H.field('Jam mulai','start',f.start)+H.field('Jam selesai','end',f.end)+H.field('Biaya per bulan (Rp)','fee',f.fee,{type:'number'})+'<div class="fld s2"><span class="lbl">Hari</span><div class="chips">'+DAYS.map(function(d){return '<button type="button" class="fc'+(f.days.indexOf(d)>=0?' on':'')+'" data-a="toggleDay" data-v="'+d+'">'+d+'</button>'}).join('')+'</div></div><div class="fld s2"><span class="lbl">Warna</span><div class="swatches">'+COLORS.map(function(x){return '<button type="button" class="swb'+(f.color===x?' on':'')+'" style="background:'+x+'" data-a="pickColor" data-v="'+x+'" aria-label="Warna '+x+'"></button>'}).join('')+'</div></div></div>',H.cancelBtn()+H.submit('Simpan'))};
A.submits.class=function(c,m){var f=m.f;if(!f.subject.trim()||!f.days.length){c.toast('Isi mata pelajaran dan pilih hari');return}E.saveClass(Object.assign({},f,{cap:+f.cap,fee:+f.fee},m.id?{id:m.id}:{}));c.S.modal=null;c.toast(m.id?'Kelas diperbarui':'Kelas ditambahkan')};

/* ---------- pendaftaran ---------- */
A.pages.enrollment=function(c){
 var W=c.S.wiz,steps=['Data siswa','Pilih mata pelajaran','Rencana biaya','Konfirmasi'],total=W.cls.reduce(function(a,id){return a+E.cls(id).fee},0),stu=W.stu&&E.stu(W.stu);
 var stepper='<div class="stepper">'+steps.map(function(s,i){return '<div class="st'+(W.step===i+1?' on':W.step>i+1?' done':'')+'"><b>'+(W.step>i+1?H.ic('check'):i+1)+'</b><span>'+s+'</span></div>'}).join('')+'</div>';
 var body='';
 if(W.step===1)body=H.card('Data siswa','<label class="fld"><span class="lbl">Pilih siswa</span><select class="inp" data-g="wiz.stu"><option value="">—</option>'+E.D.students.filter(function(s){return s.status==='active'}).map(function(s){return '<option value="'+s.id+'"'+(W.stu===s.id?' selected':'')+'>'+s.full_name+' ('+s.code+')</option>'}).join('')+'</select></label>'+(stu?'<div class="mini">'+H.av(stu.full_name)+'<span><b>'+stu.full_name+'</b><small>'+stu.year+' · '+stu.school+' · terdaftar di '+E.classesOf(stu.id).length+' kelas</small></span></div>':'')+'<div class="wf">'+'<button type="button" class="btn pri" data-a="wizNext"'+(W.stu?'':' disabled')+'>Lanjut</button></div>');
 else if(W.step===2)body=H.card('Pilih mata pelajaran','<div class="opts">'+E.D.classes.map(function(k){var on=W.cls.indexOf(k.id)>=0,already=stu&&E.classesOf(stu.id).indexOf(k.id)>=0;return '<button type="button" class="opt'+(on?' on':'')+'" style="--c:'+k.color+'" data-a="wizToggle" data-id="'+k.id+'"'+(already?' disabled':'')+'><span class="ck">'+(on?H.ic('check'):'')+'</span><b>'+k.subject+'</b><small>'+E.edu(k.educator).full_name+' · '+k.room+'</small><small>'+k.days.join(', ')+' · '+k.start+'–'+k.end+'</small><em>'+idr(k.fee)+'</em>'+(already?'<i class="tag">Sudah terdaftar</i>':'')+'</button>'}).join('')+'</div><div class="wf"><button type="button" class="btn ghost" data-a="wizBack">Kembali</button><button type="button" class="btn pri" data-a="wizNext"'+(W.cls.length?'':' disabled')+'>Lanjut</button></div>');
 else if(W.step===3)body=H.card('Rencana biaya','<div class="list">'+W.cls.map(function(id){var k=E.cls(id);return '<div class="li"><span class="grow"><b>'+k.subject+'</b></span><b class="nm">'+idr(k.fee)+'</b></div>'}).join('')+'<div class="li tot"><span class="grow"><b>Total per bulan</b></span><b class="nm big">'+idr(total)+'</b></div></div><div class="wf"><button type="button" class="btn ghost" data-a="wizBack">Kembali</button><button type="button" class="btn pri" data-a="wizNext">Lanjut</button></div>');
 else body=H.card('Konfirmasi','<div class="kvs col"><div><span>Siswa</span><b>'+stu.full_name+'</b></div><div><span>Kelas</span><b>'+W.cls.map(function(id){return E.cls(id).subject}).join(', ')+'</b></div><div><span>Total per bulan</span><b>'+idr(total)+'</b></div><div><span>Tagihan pertama</span><b>SPP November · jatuh tempo 5 Nov 2026</b></div></div><div class="wf"><button type="button" class="btn ghost" data-a="wizBack">Kembali</button><button type="button" class="btn ok" data-a="wizSubmit">Konfirmasi pendaftaran</button></div>');
 return {title:'Pendaftaran',sub:'Pendaftaran siswa ke kelas, 4 langkah',html:stepper+body};
};
A.acts.wizNext=function(c){c.S.wiz.step++};A.acts.wizBack=function(c){c.S.wiz.step--};
A.acts.wizToggle=function(c,d){var a=c.S.wiz.cls,i=a.indexOf(d.id);if(i>=0)a.splice(i,1);else a.push(d.id)};
A.acts.wizSubmit=function(c){var W=c.S.wiz;E.enrollStudent(W.stu,W.cls);c.S.wiz={step:1,stu:'',cls:[]};c.toast('Pendaftaran dikonfirmasi. Tagihan SPP November dibuat.')};

/* ---------- absensi ---------- */
function ensureAtt(c){var S=c.S,list=visibleClasses(c);if(c.role==='admin'||c.role==='educator'){if(!S.att.cls||!list.some(function(k){return k.id===S.att.cls}))S.att.cls=(list.filter(function(k){return k.days.indexOf('Jum')>=0})[0]||list[0]||{}).id||''}}
A.pages.attendance=function(c){
 var S=c.S;
 if(c.role==='student'||c.role==='parent'){
  var s=subj(c),hist=E.attHistory(s.id),pct=E.attPct(s.id),by={};
  hist.forEach(function(h){var b=by[h.cls]=by[h.cls]||{a:0,t:0};b.t++;if(h.status==='present'||h.status==='late')b.a++});
  var t=c.table('att-'+s.id,hist,{search:function(h){return E.cls(h.cls).subject+' '+h.date+' '+AS[h.status][0]},size:8,filter:function(h,st){return st.f==='all'||h.status===st.f},sorts:{date:function(h){return h.date},cls:function(h){return h.cls}}});
  return {title:c.role==='student'?'Kehadiran':'Kehadiran',sub:s.full_name+' · '+hist.length+' pertemuan tercatat',html:kidBar(c)+'<div class="kpis k4"><div class="kpi a"><span class="ki">'+H.ic('check')+'</span><div class="kl">Kehadiran</div><div class="kv">'+pct+'%</div><div class="ks">sejak September</div></div>'+['present','late','absent','excused'].map(function(k){return '<div class="kpi"><div class="kl">'+AS[k][0]+'</div><div class="kv">'+hist.filter(function(h){return h.status===k}).length+'</div></div>'}).join('').replace(/(<div class="kpi">.*?<\/div><\/div>)(?=<div class="kpi">)/,'$1')+'</div>'+
   '<div class="g2"><div>'+H.card('Per kelas',Object.keys(by).map(function(k){var b=by[k];return '<div class="br"><div class="brl"><span><i class="sdot" style="--c:'+E.cls(k).color+'"></i>'+E.cls(k).subject+'</span><b>'+Math.round(100*b.a/b.t)+'% · '+b.a+'/'+b.t+'</b></div><div class="bar"><i style="width:'+Math.round(100*b.a/b.t)+'%"></i></div></div>'}).join('')||H.empty('Belum ada data','check'))+'</div><div class="span2x">'+H.card('Riwayat','<div class="tools2">'+H.search(t)+H.filterChips(t,[['all','Semua'],['present','Hadir'],['late','Telat'],['absent','Absen'],['excused','Izin']])+'</div>'+(t.total?'<div class="tw"><table class="tbl"><thead><tr>'+H.sortTh(t,'date','Tanggal')+H.sortTh(t,'cls','Kelas')+'<th>Status</th></tr></thead><tbody>'+t.rows.map(function(h){return '<tr><td data-l="Tanggal">'+fmt(h.date)+'</td><td data-l="Kelas">'+E.cls(h.cls).subject+'</td><td data-l="Status">'+H.chip(AS[h.status][1],AS[h.status][0])+'</td></tr>'}).join('')+'</tbody></table></div>'+H.pager(t):H.noMatch(t)),null,'')+'</div></div>'};
 }
 ensureAtt(c);var list=visibleClasses(c),cls=S.att.cls,date=S.att.date,key=cls+'|'+date;
 var k=cls&&E.cls(cls),ids=cls?E.rosterIds(cls):[],rec=E.D.att[key]||{},saved=E.D.attSaved[key];
 var cnt={present:0,late:0,absent:0,excused:0,none:0};ids.forEach(function(id){if(rec[id])cnt[rec[id]]++;else cnt.none++});
 var rows=ids.map(function(id){var s=E.stu(id),v=rec[id];return '<div class="ar"><span class="nm">'+H.av(s.full_name)+'<span><b>'+s.full_name+'</b><small>'+s.code+'</small></span></span><span class="seg4" role="group">'+Object.keys(AS).map(function(st){return '<button type="button" class="'+AS[st][1]+(v===st?' on':'')+'" data-a="setAtt" data-s="'+id+'" data-v="'+st+'" aria-pressed="'+(v===st)+'">'+AS[st][0]+'</button>'}).join('')+'</span></div>'}).join('');
 var hist=Object.keys(E.D.att).filter(function(x){return x.indexOf(cls+'|')===0}).sort().reverse().slice(0,5).map(function(x){var r=E.D.att[x],n=Object.keys(r).length,p=Object.keys(r).filter(function(s){return r[s]==='present'||r[s]==='late'}).length;return '<div class="li"><span class="grow"><b>'+fmt(x.split('|')[1])+'</b></span><span class="mut">'+p+'/'+n+' hadir</span></div>'}).join('');
 return {title:c.role==='educator'?'Isi absensi':'Absensi',sub:k?k.subject+' · '+fmt(date):'Pilih kelas',html:
  H.card('','<div class="fg"><label class="fld"><span class="lbl">Kelas</span><select class="inp" data-g="att.cls">'+list.map(function(x){return '<option value="'+x.id+'"'+(cls===x.id?' selected':'')+'>'+x.subject+'</option>'}).join('')+'</select></label><label class="fld"><span class="lbl">Tanggal</span><input class="inp" type="date" data-g="att.date" value="'+date+'"></label></div>')+
  (ids.length?'<div class="g2 wide-l"><div>'+H.card('Daftar hadir · '+ids.length+' siswa','<div class="sumbar">'+Object.keys(AS).map(function(st){return H.chip(AS[st][1],AS[st][0]+' '+cnt[st])}).join('')+(cnt.none?H.chip('mut','Belum diisi '+cnt.none):'')+(saved?H.chip('ok','Tersimpan ✓'):'')+'</div><div class="arl">'+rows+'</div><div class="wf">'+H.btn('Tandai semua hadir','markAll',{},'ghost')+H.btn('Simpan absensi','saveAtt',{},'pri')+'</div>')+'</div><div>'+H.card('Riwayat pertemuan',hist?'<div class="list">'+hist+'</div>':H.empty('Belum ada riwayat','clock'))+'</div></div>':H.card('',H.empty('Belum ada siswa terdaftar di kelas ini','users')))};
};
A.acts.setAtt=function(c,d){E.setAtt(c.S.att.cls,c.S.att.date,d.s,d.v)};
A.acts.markAll=function(c){E.markAllAtt(c.S.att.cls,c.S.att.date);c.toast('Semua ditandai hadir')};
A.acts.saveAtt=function(c){E.saveAtt(c.S.att.cls,c.S.att.date);c.toast('Absensi disimpan')};

/* ---------- nilai ---------- */
A.onG=function(c,path){if(path==='gr.cls')c.S.gr.aid='';};
A.pages.grades=function(c){
 var S=c.S,list=visibleClasses(c);
 if(!S.gr.cls||!list.some(function(k){return k.id===S.gr.cls}))S.gr.cls=list[0]?list[0].id:'';
 var ass=E.D.assess.filter(function(a){return a.cls===S.gr.cls});
 if(!S.gr.aid||!ass.some(function(a){return a.id===S.gr.aid}))S.gr.aid=ass[0]?ass[0].id:'';
 var a=ass.filter(function(x){return x.id===S.gr.aid})[0],ids=S.gr.cls?E.rosterIds(S.gr.cls):[];
 S.grd=S.grd||{};if(a&&!S.grd[a.id]){var g=E.D.grades[a.id]||{},d={};ids.forEach(function(id){d[id]={score:g[id]?String(g[id][0]):'',remark:g[id]?g[id][1]:''}});S.grd[a.id]=d}
 var draft=a?S.grd[a.id]:{};
 var rows=a?ids.map(function(id){var s=E.stu(id),d=draft[id]||{score:'',remark:''};return '<tr><td data-l="Siswa"><span class="nm">'+H.av(s.full_name)+'<span><b>'+s.full_name+'</b><small>'+s.code+'</small></span></span></td><td data-l="Nilai / '+a.max+'"><input class="inp sc" type="number" min="0" max="'+a.max+'" data-gd="grd.'+a.id+'.'+id+'.score" value="'+H.esc(d.score)+'" placeholder="—" aria-label="Nilai '+s.full_name+'"></td><td data-l="Catatan"><input class="inp" type="text" data-gd="grd.'+a.id+'.'+id+'.remark" value="'+H.esc(d.remark)+'" placeholder="—" aria-label="Catatan '+s.full_name+'"></td></tr>'}).join(''):'';
 var vals=a?ids.map(function(id){return draft[id]&&draft[id].score!==''?+draft[id].score:null}).filter(function(x){return x!=null}):[];
 var avg=vals.length?Math.round(vals.reduce(function(x,y){return x+y},0)/vals.length):'—';
 return {title:c.role==='educator'?'Input nilai':'Nilai',sub:'Penilaian, input nilai, dan penerbitan',actions:S.gr.cls?H.btn(H.ic('plus')+' Penilaian baru','addAss',{},'pri sm'):'',html:
  H.card('','<div class="fg"><label class="fld"><span class="lbl">Kelas</span><select class="inp" data-g="gr.cls">'+list.map(function(x){return '<option value="'+x.id+'"'+(S.gr.cls===x.id?' selected':'')+'>'+x.subject+'</option>'}).join('')+'</select></label><label class="fld"><span class="lbl">Penilaian</span><select class="inp" data-g="gr.aid">'+(ass.length?ass.map(function(x){return '<option value="'+x.id+'"'+(S.gr.aid===x.id?' selected':'')+'>'+x.name+' ('+x.type+')</option>'}).join(''):'<option value="">—</option>')+'</select></label></div>')+
  (a?H.card(a.name,'<div class="sumbar">'+H.chip(a.published?'ok':'warn',a.published?'Terbit':'Draf')+H.chip('mut',fmt(a.date))+H.chip('mut','Maks '+a.max+' · lulus '+a.pass+' · bobot '+a.weight+'%')+H.chip('info','Rata-rata '+avg)+'</div>'+(ids.length?'<div class="tw"><table class="tbl"><thead><tr><th>Siswa</th><th>Nilai / '+a.max+'</th><th>Catatan</th></tr></thead><tbody>'+rows+'</tbody></table></div>':H.empty('Belum ada siswa terdaftar','users'))+'<div class="wf">'+H.btn('Simpan semua','saveGrades',{},'ghost')+(a.published?'':H.btn('Terbitkan','publishGr',{},'ok'))+'</div>'):H.card('',H.empty('Belum ada penilaian untuk kelas ini','award',H.btn('Penilaian baru','addAss',{},'pri sm'))))};
};
A.acts.saveGrades=function(c){var a=c.S.gr.aid,d=c.S.grd[a];Object.keys(d).forEach(function(id){E.setScore(a,id,d[id].score,d[id].remark)});c.toast('Nilai disimpan')};
A.acts.publishGr=function(c){var a=c.S.gr.aid,d=c.S.grd[a];Object.keys(d).forEach(function(id){E.setScore(a,id,d[id].score,d[id].remark)});E.publish(a);c.toast('Nilai diterbitkan ke siswa dan orang tua')};
A.acts.addAss=function(c){c.S.modal={t:'assess',f:{name:'',type:'test',date:E.TODAY,max:100,pass:60,weight:30}}};
A.modals.assess=function(c,m){var f=m.f;return H.modal('Penilaian baru','<div class="fg">'+H.field('Nama penilaian','name',f.name,{cls:'s2'})+H.sel('Jenis','type',f.type,[['quiz','Kuis'],['test','Ulangan'],['assignment','Tugas'],['project','Proyek']])+H.field('Tanggal','date',f.date,{type:'date'})+H.field('Nilai maksimal','max',f.max,{type:'number'})+H.field('Nilai lulus','pass',f.pass,{type:'number'})+H.field('Bobot (%)','weight',f.weight,{type:'number'})+'</div>',H.cancelBtn()+H.submit('Simpan'))};
A.submits.assess=function(c,m){var f=m.f;if(!f.name.trim()){c.toast('Nama wajib diisi');return}var id=E.saveAssessment({cls:c.S.gr.cls,name:f.name,type:f.type,date:f.date,max:+f.max,pass:+f.pass,weight:+f.weight});c.S.gr.aid=id;c.S.modal=null;c.toast('Penilaian dibuat sebagai draf')};

/* ---------- hasil (siswa/orang tua) ---------- */
A.pages.results=function(c){
 var s=subj(c),res=E.resultsOf(s.id),by={};res.forEach(function(r){(by[r.a.cls]=by[r.a.cls]||[]).push(r)});
 var avg=E.avgOf(s.id);
 return {title:c.role==='student'?'Hasil saya':'Hasil',sub:s.full_name+' · '+res.length+' penilaian terbit',actions:c.role==='parent'?H.btn(H.ic('print')+' Rapor','rapor',{id:s.id},'sm'):'',html:kidBar(c)+'<div class="kpis k4"><div class="kpi b"><span class="ki">'+H.ic('award')+'</span><div class="kl">Rata-rata</div><div class="kv">'+(avg||'—')+'</div></div><div class="kpi"><div class="kl">Penilaian</div><div class="kv">'+res.length+'</div></div><div class="kpi"><div class="kl">Tertinggi</div><div class="kv">'+(res.length?Math.max.apply(null,res.map(function(r){return r.score})):'—')+'</div></div><div class="kpi"><div class="kl">Perlu remedial</div><div class="kv">'+res.filter(function(r){return r.score<r.a.pass}).length+'</div></div></div>'+
  (res.length?Object.keys(by).map(function(k){var cl=E.cls(k);return H.card('<i class="sdot" style="--c:'+cl.color+'"></i>'+cl.subject,'<div class="list">'+by[k].map(function(r){var ok=r.score>=r.a.pass;return '<div class="li"><span class="grow"><b>'+r.a.name+'</b><small>'+fmt(r.a.date)+' · '+r.a.type+' · bobot '+r.a.weight+'%'+(r.remark?' · '+H.esc(r.remark):'')+'</small></span><div class="pbar"><i style="width:'+r.score+'%" class="'+(ok?'ok':'bad')+'"></i></div><span class="score '+(ok?'ok':'bad')+'">'+r.score+'</span></div>'}).join('')+'</div>')}).join(''):H.card('',H.empty('Belum ada hasil yang diterbitkan','award')))};
};

/* ---------- materi ---------- */
A.pages.materials=function(c){
 var can=c.role==='admin'||c.role==='educator',cls=visibleClasses(c).map(function(k){return k.id}),list=E.D.mats.filter(function(m){return cls.indexOf(m.cls)>=0});
 var t=c.table('materials',list,{search:function(m){return m.title+' '+m.desc+' '+m.by+' '+E.cls(m.cls).subject},size:6,filter:function(m,st){return st.f==='all'||m.type===st.f}});
 var IC={file:'file',link:'link',video:'video'};
 return {title:'Materi',sub:list.length+' sumber belajar',actions:can?H.btn(H.ic('plus')+' Tambah materi','addMat',{},'pri sm'):'',html:'<div class="tools2">'+H.search(t)+H.filterChips(t,[['all','Semua'],['file','Berkas'],['link','Tautan'],['video','Video']])+'</div>'+(t.all===0?H.empty('Belum ada materi','folder',can?H.btn('Tambah materi','addMat',{},'pri sm'):''):t.total===0?H.noMatch(t):'<div class="mgrid">'+t.rows.map(function(m){var k=E.cls(m.cls);return '<article class="mc2"><div class="mc-h"><span class="mi" style="--c:'+k.color+'">'+H.ic(IC[m.type])+'</span><div class="grow"><b>'+H.esc(m.title)+'</b><small>'+k.subject+'</small></div>'+(can?H.ibtn('trash','delMatAsk',{id:m.id},'Hapus','dg'):'')+'</div><p>'+H.esc(m.desc||'')+'</p><div class="mc-f"><small>'+fmt(m.date)+' · '+m.by+'</small>'+H.btn(m.type==='file'?H.ic('dl')+' '+H.esc(m.file_name||'Unduh'):'Buka tautan','openMat',{t:m.title},'ghost sm')+'</div></article>'}).join('')+'</div>'+H.pager(t))};
};
A.acts.openMat=function(c,d){c.toast('Membuka: '+d.t+' (demo)')};
A.acts.addMat=function(c){c.S.modal={t:'material',f:{cls:visibleClasses(c)[0].id,title:'',type:'link',url:'',desc:'',file:''}}};
A.acts.delMatAsk=function(c,d){var m=E.D.mats.filter(function(x){return x.id===d.id})[0];c.S.modal={t:'confirm',act:'delMat',id:d.id,msg:'Hapus materi <b>'+H.esc(m.title)+'</b>?'}};
A.acts.delMat=function(c){E.delMaterial(c.S.modal.id);c.S.modal=null;c.toast('Materi dihapus')};
A.modals.material=function(c,m){var f=m.f;return H.modal('Tambah materi','<div class="fg">'+H.sel('Kelas','cls',f.cls,visibleClasses(c).map(function(k){return [k.id,k.subject]}),{cls:'s2'})+H.field('Judul','title',f.title,{cls:'s2'})+H.sel('Jenis','type',f.type,[['link','Tautan'],['file','Berkas'],['video','Video']],{rr:1})+(f.type==='file'?'<label class="fld"><span class="lbl">Unggah berkas</span><input class="inp" type="file" data-f="file"></label>':H.field('URL','url',f.url,{ph:'https://'}))+H.area('Deskripsi','desc',f.desc,{cls:'s2'})+'</div>',H.cancelBtn()+H.submit('Simpan'))};
A.submits.material=function(c,m){var f=m.f;if(!f.title.trim()){c.toast('Judul wajib diisi');return}if(f.type==='file'&&!f.file){c.toast('Pilih berkas terlebih dulu');return}E.saveMaterial({cls:f.cls,title:f.title,type:f.type,url:f.url,file_name:f.file,desc:f.desc,by:c.user.full_name});c.S.modal=null;c.toast('Materi ditambahkan')};

/* ---------- tagihan ---------- */
A.pages.invoices=function(c){
 var isA=c.role==='admin',S=c.S,list=isA?E.D.inv:E.D.inv.filter(function(i){return i.student===subj(c).id});
 var t=c.table('inv'+(isA?'':subj(c).id),list,{search:function(i){return i.number+' '+i.desc+' '+E.stu(i.student).full_name},size:7,filter:function(i,st){return st.f==='all'||E.invStatus(i)===st.f},sorts:{no:function(i){return i.number},stu:function(i){return E.stu(i.student).full_name},due:function(i){return i.due},amt:function(i){return i.amount}}});
 var rows=t.rows.map(function(i){var s=E.stu(i.student);return '<tr><td data-l="No.">'+i.number+'</td>'+(isA?'<td data-l="Siswa">'+s.full_name+'</td>':'')+'<td data-l="Keterangan">'+i.desc+'</td><td data-l="Jatuh tempo">'+fmt(i.due)+'</td><td data-l="Jumlah" class="n">'+idr(i.amount)+'</td><td data-l="Terbayar" class="n">'+idr(i.paid)+'</td><td data-l="Status">'+invChip(i)+'</td><td class="act">'+H.ibtn('print','printInv',{id:i.id},'Cetak tagihan')+(isA&&i.paid<i.amount?H.ibtn('rcpt','payAsk',{id:i.id},'Catat pembayaran'):'')+(isA&&i.paid===0?H.ibtn('trash','delInvAsk',{id:i.id},'Hapus','dg'):'')+'</td></tr>'}).join('');
 var out=list.reduce(function(a,i){return a+i.amount-i.paid},0);
 return {title:c.role==='parent'?'Biaya':c.role==='student'?'Biaya saya':'Tagihan',sub:t.all+' tagihan · sisa '+idr(out),actions:isA?H.btn(H.ic('dl')+' Ekspor','toast',{m:'invoices.csv diunduh (demo)'},'sm')+H.btn(H.ic('plus')+' Buat tagihan','addInv',{},'pri sm'):'',html:kidBar(c)+'<div class="tools2">'+H.search(t)+H.filterChips(t,[['all','Semua'],['unpaid','Belum bayar'],['partial','Sebagian'],['paid','Lunas'],['overdue','Terlambat']])+'</div>'+(t.all===0?H.empty('Belum ada tagihan','rcpt'):t.total===0?H.noMatch(t):H.card('','<div class="tw"><table class="tbl"><thead><tr>'+H.sortTh(t,'no','No.')+(isA?H.sortTh(t,'stu','Siswa'):'')+'<th>Keterangan</th>'+H.sortTh(t,'due','Jatuh tempo')+H.sortTh(t,'amt','Jumlah','n')+'<th class="n">Terbayar</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>'+H.pager(t),null,'flush'))};
};
A.acts.addInv=function(c){c.S.modal={t:'invoice',f:{student:E.D.students.filter(function(s){return s.status==='active'})[0].id,month:'2026-11',due:'2026-11-05',desc:'SPP November',amount:400000}}};
A.modals.invoice=function(c,m){var f=m.f;return H.modal('Buat tagihan','<div class="fg">'+H.sel('Siswa','student',f.student,E.D.students.filter(function(s){return s.status==='active'}).map(function(s){return [s.id,s.full_name]}),{cls:'s2'})+H.field('Bulan tagihan','month',f.month,{type:'month'})+H.field('Jatuh tempo','due',f.due,{type:'date'})+H.field('Keterangan','desc',f.desc,{cls:'s2'})+H.field('Jumlah (Rp)','amount',f.amount,{type:'number',cls:'s2'})+'</div>',H.cancelBtn()+H.submit('Terbitkan'))};
A.submits.invoice=function(c,m){var f=m.f;if(!(+f.amount>0)){c.toast('Jumlah harus lebih dari 0');return}E.saveInvoice(f);c.S.modal=null;c.toast('Tagihan diterbitkan')};
A.acts.payAsk=function(c,d){var i=E.inv(d.id);c.S.modal={t:'payment',id:i.id,f:{amount:i.amount-i.paid,method:'Tunai'}}};
A.modals.payment=function(c,m){var i=E.inv(m.id),s=E.stu(i.student);return H.modal('Catat pembayaran','<div class="kvs col"><div><span>Tagihan</span><b>'+i.number+' · '+s.full_name+'</b></div><div><span>Total</span><b>'+idr(i.amount)+'</b></div><div><span>Sisa</span><b>'+idr(i.amount-i.paid)+'</b></div></div><div class="fg">'+H.field('Jumlah dibayar (Rp)','amount',m.f.amount,{type:'number'})+H.sel('Cara bayar','method',m.f.method,[['Tunai','Tunai'],['Transfer bank','Transfer bank'],['E-wallet','E-wallet']])+'</div><p class="mut">Pembayaran dicatat manual oleh admin.</p>',H.cancelBtn()+H.submit('Catat pembayaran'))};
A.submits.payment=function(c,m){E.payInvoice(m.id,m.f.amount,m.f.method);c.S.modal=null;c.toast('Pembayaran dicatat')};
A.acts.delInvAsk=function(c,d){c.S.modal={t:'confirm',act:'delInv',id:d.id,msg:'Hapus tagihan <b>'+E.inv(d.id).number+'</b>?'}};
A.acts.delInv=function(c){E.delInvoice(c.S.modal.id);c.S.modal=null;c.toast('Tagihan dihapus')};
A.acts.printInv=function(c,d){c.S.modal={t:'printInv',id:d.id}};
A.modals.printInv=function(c,m){var i=E.inv(m.id),s=E.stu(i.student),p=E.par(s.parent);
 return H.modal('Tagihan '+i.number,'<div class="paper"><div class="ph1"><b>'+E.D.centre.name+'</b><small>'+E.D.centre.address+' · '+E.D.centre.phone+'</small></div><div class="kvs"><div><span>No. tagihan</span><b>'+i.number+'</b></div><div><span>Jatuh tempo</span><b>'+fmt(i.due)+'</b></div><div><span>Siswa</span><b>'+s.full_name+'</b></div><div><span>Orang tua</span><b>'+(p?p.full_name:'—')+'</b></div></div><table class="tbl"><thead><tr><th>Rincian</th><th class="n">Jumlah</th></tr></thead><tbody>'+i.items.map(function(x){return '<tr><td>'+x.desc+'</td><td class="n">'+idr(x.amount)+'</td></tr>'}).join('')+'<tr class="tot"><td><b>Total</b></td><td class="n"><b>'+idr(i.amount)+'</b></td></tr><tr><td>Terbayar</td><td class="n">'+idr(i.paid)+'</td></tr><tr class="tot"><td><b>Sisa</b></td><td class="n"><b>'+idr(i.amount-i.paid)+'</b></td></tr></tbody></table><p>Status: '+invChip(i)+'</p></div>',H.btn('Tutup','mclose',{},'ghost')+H.btn(H.ic('print')+' Cetak','toast',{m:'Tagihan dikirim ke printer (demo)'},'pri'),'wide')};

/* ---------- pengumuman ---------- */
var AUD={all:'Semua',parents:'Orang tua',students:'Siswa',educators:'Pendidik','class':'Kelas'};
A.pages.announcements=function(c){
 var role=c.role,can=role==='admin'||role==='educator';
 var list=E.D.ann.filter(function(a){return role==='admin'||a.audience==='all'||(a.audience==='parents'&&role==='parent')||(a.audience==='students'&&role==='student')||(a.audience==='educators'&&role==='educator')||(a.audience==='class'&&role!=='admin')||a.by===c.user.full_name});
 var t=c.table('ann',list,{search:function(a){return a.title+' '+a.body+' '+a.by},size:5});
 return {title:'Pengumuman',sub:list.length+' pengumuman',actions:can?H.btn(H.ic('plus')+' Buat pengumuman','addAnn',{},'pri sm'):'',html:'<div class="tools2">'+H.search(t)+'</div>'+(t.all===0?H.empty('Belum ada pengumuman','mega'):t.total===0?H.noMatch(t):'<div class="alist">'+t.rows.map(function(a){var mine=role==='admin'||a.by===c.user.full_name;return '<article class="ac"><div class="ac-h"><h4>'+H.esc(a.title)+'</h4>'+(mine&&can?'<div class="act">'+H.ibtn('edit','editAnn',{id:a.id},'Ubah')+H.ibtn('trash','delAnnAsk',{id:a.id},'Hapus','dg')+'</div>':'')+'</div><p>'+H.esc(a.body)+'</p><div class="ac-f">'+H.av(a.by)+'<small>'+a.by+' · '+fmt(a.date)+'</small>'+H.chip('info',AUD[a.audience])+'</div></article>'}).join('')+'</div>'+H.pager(t))};
};
A.acts.addAnn=function(c){c.S.modal={t:'announcement',f:{title:'',body:'',audience:'all'}}};
A.acts.editAnn=function(c,d){var a=E.D.ann.filter(function(x){return x.id===d.id})[0];c.S.modal={t:'announcement',id:a.id,f:{title:a.title,body:a.body,audience:a.audience}}};
A.acts.delAnnAsk=function(c,d){c.S.modal={t:'confirm',act:'delAnn',id:d.id,msg:'Hapus pengumuman ini?'}};
A.acts.delAnn=function(c){E.delAnnouncement(c.S.modal.id);c.S.modal=null;c.toast('Pengumuman dihapus')};
A.modals.announcement=function(c,m){var f=m.f;return H.modal(m.id?'Ubah pengumuman':'Buat pengumuman','<div class="fg">'+H.field('Judul','title',f.title,{cls:'s2'})+H.area('Isi','body',f.body,{cls:'s2'})+H.sel('Audiens','audience',f.audience,[['all','Semua'],['parents','Orang tua'],['students','Siswa'],['educators','Pendidik'],['class','Kelas tertentu']],{cls:'s2'})+'</div>',H.cancelBtn()+H.submit('Kirim'))};
A.submits.announcement=function(c,m){var f=m.f;if(!f.title.trim()||!f.body.trim()){c.toast('Judul dan isi wajib diisi');return}E.saveAnnouncement(Object.assign({},f,m.id?{id:m.id}:{}),c.user.full_name,c.role);c.S.modal=null;c.toast(m.id?'Pengumuman diperbarui':'Pengumuman terkirim')};

/* ---------- pengaturan ---------- */
A.pages.settings=function(c){
 var S=c.S;S.sets=S.sets||{};
 if(!S.sets.uid||S.sets.uid!==c.user.id){S.sets={uid:c.user.id,profile:{full_name:c.user.full_name,email:c.user.email,phone:c.user.phone},pw:{cur:'',nw:'',cf:''},centre:Object.assign({},E.D.centre)}}
 var P=S.sets.profile,W=S.sets.pw,C=S.sets.centre;
 function inp(label,path,val,type,cls){return '<label class="fld '+(cls||'')+'"><span class="lbl">'+label+'</span><input class="inp" type="'+(type||'text')+'" data-gd="sets.'+path+'" value="'+H.esc(val)+'"></label>'}
 return {title:'Pengaturan',sub:'Profil, kata sandi'+(c.role==='admin'?', dan data pusat bimbel':''),html:'<div class="g2"><div>'+H.card('Profil','<div class="uprof">'+H.av(c.user.full_name,'lg')+'<div><b>'+H.esc(c.user.full_name)+'</b><small>'+({admin:'Admin',educator:'Educator',student:'Siswa',parent:'Orang tua'})[c.role]+'</small></div></div><div class="fg">'+inp('Nama lengkap','profile.full_name',P.full_name,'text','s2')+inp('Email','profile.email',P.email,'email')+inp('Telepon','profile.phone',P.phone)+'</div><div class="wf">'+H.btn('Simpan profil','saveProfile',{},'pri')+'</div>')+
  H.card('Ganti kata sandi','<div class="fg">'+inp('Kata sandi saat ini','pw.cur',W.cur,'password','s2')+inp('Kata sandi baru','pw.nw',W.nw,'password')+inp('Konfirmasi kata sandi','pw.cf',W.cf,'password')+'</div><div class="wf">'+H.btn('Ganti kata sandi','savePw',{},'pri')+'</div>')+'</div><div>'+
  (c.role==='admin'?H.card('Pusat bimbel','<div class="fg">'+inp('Nama pusat bimbel','centre.name',C.name,'text','s2')+inp('Alamat','centre.address',C.address,'text','s2')+inp('Telepon','centre.phone',C.phone)+inp('Email','centre.email',C.email,'email')+'</div><div class="wf">'+H.btn('Simpan data pusat','saveCentre',{},'pri')+'</div>'):H.card('Preferensi','<p class="mut">Bahasa, mode gelap, dan notifikasi dapat diubah dari bilah atas. Pengaturan data pusat bimbel hanya tersedia untuk admin.</p>'))+'</div></div>'};
};
A.acts.saveProfile=function(c){var p=c.S.sets.profile;if(!p.full_name.trim()){c.toast('Nama wajib diisi');return}E.saveProfile(c.S.user,p);c.toast('Profil disimpan')};
A.acts.savePw=function(c){var w=c.S.sets.pw;if(!w.cur){c.toast('Isi kata sandi saat ini');return false}if((w.nw||'').length<6){c.toast('Kata sandi baru minimal 6 karakter');return false}if(w.nw!==w.cf){c.toast('Konfirmasi tidak sama');return false}c.S.sets.pw={cur:'',nw:'',cf:''};c.toast('Kata sandi diganti')};
A.acts.saveCentre=function(c){E.saveCentre(c.S.sets.centre);c.toast('Data pusat bimbel disimpan')};
})();
