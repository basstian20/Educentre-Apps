/* EduCentre V3: data sintetis + semua tindakan (CRUD, absensi, nilai, tagihan, pengumuman, notifikasi). */
(function(){
'use strict';
var TODAY='2026-10-23',NOW='15.42';
var DAYS=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
var MON=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
function pad(n){return (n<10?'0':'')+n}
function parse(d){var p=d.split('-');return new Date(+p[0],+p[1]-1,+p[2])}
function iso(dt){return dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate())}
function fmtDate(d){if(!d)return '—';var p=d.split('-');return +p[2]+' '+MON[+p[1]-1]+' '+p[0]}
function fmtIDR(n){return 'Rp '+String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}
function short(n){if(n>=1e6){var v=(n/1e6).toFixed(2).replace('.',',');v=v.replace(/,?0+$/,'');return 'Rp '+v+' jt'}return fmtIDR(n)}
function hash(s){var h=7;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%100003;return h}
var seq=100;function uid(p){seq++;return p+seq}

function seed(){
 var D={today:TODAY,now:NOW};
 D.centre={name:'Bimbel Cerdas',address:'Jl. Melati No. 12, Surabaya',phone:'031-555-1234',email:'halo@bimbelcerdas.id'};
 D.users=[
  {id:'u-admin',role:'admin',full_name:'Sari Dewi',email:'admin@educentre.id',phone:'0812-0000-0001'},
  {id:'u-fariz',role:'educator',full_name:'Fariz Abdullah',email:'fariz@educentre.id',phone:'0812-0000-0002'},
  {id:'u-aiman',role:'student',full_name:'Aiman Haziq',email:'aiman@educentre.id',phone:'0812-0000-0003'},
  {id:'u-nur',role:'parent',full_name:'Nurhayati',email:'nurhayati@educentre.id',phone:'0812-0000-0004'}];
 D.educators=[
  {id:'e-fariz',user:'u-fariz',full_name:'Fariz Abdullah',code:'ED-001',email:'fariz@educentre.id',phone:'0812-0000-0002',field:'Matematika',subjects:'Matematika, UTBK',qual:'S1 Pendidikan Matematika',status:'active'},
  {id:'e-rina',full_name:'Rina Wulandari',code:'ED-002',email:'rina@educentre.id',phone:'0812-0000-0010',field:'IPA',subjects:'IPA, Biologi',qual:'S1 Biologi',status:'active'},
  {id:'e-dita',full_name:'Dita Anggraini',code:'ED-003',email:'dita@educentre.id',phone:'0812-0000-0011',field:'Bahasa Inggris',subjects:'Bahasa Inggris',qual:'S1 Sastra Inggris',status:'active'},
  {id:'e-hendra',full_name:'Hendra Saputra',code:'ED-004',email:'hendra@educentre.id',phone:'0812-0000-0012',field:'Fisika',subjects:'Fisika, Kimia',qual:'S1 Fisika',status:'active'},
  {id:'e-sinta',full_name:'Sinta Maharani',code:'ED-005',email:'sinta@educentre.id',phone:'0812-0000-0013',field:'Calistung',subjects:'Calistung',qual:'S1 PGSD',status:'active'}];
 D.parents=[
  {id:'p-nur',user:'u-nur',full_name:'Nurhayati',email:'nurhayati@educentre.id',phone:'0812-0000-0004',occupation:'Karyawan swasta'},
  {id:'p-hadi',full_name:'Hadi Susanto',email:'hadi@mail.id',phone:'0813-1111-0001',occupation:'Wiraswasta'},
  {id:'p-wulan',full_name:'Wulan Sari',email:'wulan@mail.id',phone:'0813-1111-0002',occupation:'Guru'},
  {id:'p-rahma',full_name:'Rahma Wati',email:'rahma@mail.id',phone:'0813-1111-0003',occupation:'Perawat'},
  {id:'p-joko',full_name:'Joko Prasetyo',email:'joko@mail.id',phone:'0813-1111-0004',occupation:'PNS'},
  {id:'p-dewi',full_name:'Dewi Lestari',email:'dewi@mail.id',phone:'0813-1111-0005',occupation:'Pedagang'},
  {id:'p-agus',full_name:'Agus Salim',email:'agus@mail.id',phone:'0813-1111-0006',occupation:'Teknisi'},
  {id:'p-sekar',full_name:'Sekar Arum',email:'sekar@mail.id',phone:'0813-1111-0007',occupation:'Dokter'},
  {id:'p-lina',full_name:'Lina Marlina',email:'lina@mail.id',phone:'0813-1111-0008',occupation:'Apoteker'},
  {id:'p-rudi',full_name:'Rudi Hartono',email:'rudi@mail.id',phone:'0813-1111-0009',occupation:'Pengacara'},
  {id:'p-bambang',full_name:'Bambang Heru',email:'bambang@mail.id',phone:'0813-1111-0010',occupation:'Petani'}];
 var S=[
  ['aiman','ST-0001','Aiman Haziq','SDN Pucang 1','Kelas 5 SD','2015-03-14','p-nur','active','u-aiman'],
  ['nadia','ST-0002','Nadia Putri','SDN Gubeng 2','Kelas 6 SD','2014-07-02','p-hadi','active'],
  ['raka','ST-0003','Raka Pratama','SMPN 3','Kelas 8 SMP','2012-11-21','p-wulan','active'],
  ['salsa','ST-0004','Salsa Amelia','SMPN 5','Kelas 7 SMP','2013-05-09','p-rahma','active'],
  ['dimas','ST-0005','Dimas Arya','SMAN 2','Kelas 11 SMA','2010-01-30','p-joko','active'],
  ['kirana','ST-0006','Kirana Haziq','SDN Pucang 1','Kelas 3 SD','2017-09-18','p-nur','active'],
  ['bayu','ST-0007','Bayu Santoso','SMPN 3','Kelas 9 SMP','2011-12-05','p-dewi','active'],
  ['putri','ST-0008','Putri Lestari','SMAN 2','Kelas 10 SMA','2011-04-12','p-agus','active'],
  ['mira','ST-0009','Mira Anjani','SDN Gubeng 2','Kelas 4 SD','2016-02-27','p-sekar','active'],
  ['fajar','ST-0010','Fajar Ramadhan','SDN Pucang 1','Kelas 6 SD','2014-10-08','p-lina','active'],
  ['citra','ST-0011','Citra Dewi','SDN Gubeng 2','Kelas 5 SD','2015-06-23','p-rudi','active'],
  ['tania','ST-0012','Tania Oktaviani','SMPN 5','Kelas 7 SMP','2013-10-14','p-bambang','inactive']];
 D.students=S.map(function(r){return {id:r[0],code:r[1],full_name:r[2],school:r[3],year:r[4],dob:r[5],parent:r[6],status:r[7],user:r[8]||null,phone:'0857-'+(2000+hash(r[0])%7000)+'-'+(1000+hash(r[2])%8000),email:r[0]+'@mail.id'}});
 D.classes=[
  {id:'mtk5',subject:'Matematika K5',level:'Kelas 5 SD',educator:'e-fariz',room:'Ruang B',cap:12,color:'#2563eb',days:['Sen','Rab','Jum'],start:'15.30',end:'17.00',fee:200000},
  {id:'ipa6',subject:'IPA Kelas 6',level:'Kelas 6 SD',educator:'e-rina',room:'Ruang A',cap:12,color:'#059669',days:['Sel','Kam','Jum'],start:'13.00',end:'14.30',fee:200000},
  {id:'eng',subject:'B. Inggris SMP',level:'SMP',educator:'e-dita',room:'Ruang C',cap:15,color:'#d97706',days:['Jum'],start:'16.00',end:'17.30',fee:150000},
  {id:'fis',subject:'Fisika SMA',level:'SMA',educator:'e-hendra',room:'Ruang A',cap:12,color:'#7c3aed',days:['Jum','Sab'],start:'17.30',end:'19.00',fee:300000},
  {id:'cal3',subject:'Calistung K3',level:'Kelas 3 SD',educator:'e-sinta',room:'Ruang C',cap:10,color:'#db2777',days:['Sel','Kam','Jum'],start:'09.00',end:'10.30',fee:175000},
  {id:'utbk',subject:'UTBK Dasar',level:'SMA',educator:'e-fariz',room:'Ruang C',cap:12,color:'#0891b2',days:['Sab'],start:'13.00',end:'15.00',fee:400000}];
 var R={mtk5:['aiman','nadia','citra','fajar','mira'],ipa6:['aiman','nadia','fajar','citra'],eng:['aiman','salsa','raka','bayu'],fis:['dimas','putri'],cal3:['kirana','mira'],utbk:['raka','putri','dimas']};
 D.enroll=[];Object.keys(R).forEach(function(c){R[c].forEach(function(s){D.enroll.push({id:uid('en'),student:s,cls:c,status:'active'})})});
 /* absensi: riwayat Oktober + hari ini */
 D.att={};D.attSaved={};
 var base={aiman:92,nadia:88,raka:95,salsa:97,dimas:84,kirana:100,bayu:79,putri:91,mira:96,fajar:80,citra:90};
 D.classes.forEach(function(c){
  for(var d=new Date(2026,8,1);iso(d)<=TODAY;d.setDate(d.getDate()+1)){
   var ds=iso(d);if(c.days.indexOf(DAYS[d.getDay()])<0)continue;
   if(ds===TODAY&&c.id!=='cal3'&&c.id!=='ipa6')continue;
   var key=c.id+'|'+ds,rec={};
   R[c.id].forEach(function(s){var h=hash(c.id+s+ds)%100;rec[s]=h<base[s]-6?'present':h<base[s]?'late':h<base[s]+5?'excused':'absent'});
   D.att[key]=rec;D.attSaved[key]=true;
  }
 });
 D.att['cal3|'+TODAY]={kirana:'present',mira:'present'};
 D.att['ipa6|'+TODAY]={aiman:'present',nadia:'present',fajar:'absent',citra:'late'};
 /* penilaian */
 D.assess=[
  {id:'a1',cls:'mtk5',name:'Kuis 1 Pecahan',type:'quiz',date:'2026-09-18',max:100,pass:60,weight:20,published:true},
  {id:'a2',cls:'mtk5',name:'Ulangan 3',type:'test',date:'2026-10-16',max:100,pass:60,weight:30,published:true},
  {id:'a3',cls:'mtk5',name:'Latihan Desimal',type:'assignment',date:'2026-10-30',max:100,pass:60,weight:10,published:false},
  {id:'a4',cls:'ipa6',name:'Kuis 2 Ekosistem',type:'quiz',date:'2026-10-14',max:100,pass:60,weight:20,published:true},
  {id:'a5',cls:'eng',name:'Tes Lisan',type:'test',date:'2026-10-09',max:100,pass:60,weight:30,published:true},
  {id:'a6',cls:'fis',name:'Ulangan 1 Gerak',type:'test',date:'2026-10-20',max:100,pass:60,weight:30,published:false}];
 D.grades={
  a1:{aiman:[84,''],nadia:[90,'Teliti'],citra:[74,''],fajar:[70,'Perlu latihan'],mira:[90,'']},
  a2:{aiman:[88,'Baik, rapi'],nadia:[92,'Sangat baik'],citra:[79,''],fajar:[62,'Remedial pecahan'],mira:[94,'Sangat baik']},
  a3:{},
  a4:{aiman:[86,''],nadia:[89,''],fajar:[66,'Remedial'],citra:[77,'']},
  a5:{aiman:[79,'Perlu lebih berani bicara'],salsa:[79,''],raka:[96,'Sangat baik'],bayu:[71,'']},
  a6:{dimas:[62,'Perlu penguatan konsep'],putri:[91,'']}};
 D.mats=[
  {id:'m1',cls:'mtk5',title:'Ringkasan Pecahan Campuran',type:'file',file_name:'pecahan-campuran.pdf',desc:'Rangkuman dan contoh soal bab 4.',by:'Fariz Abdullah',date:'2026-10-20'},
  {id:'m2',cls:'mtk5',title:'Video Penjumlahan Pecahan',type:'video',url:'https://video.example/pecahan',desc:'Penjelasan 12 menit.',by:'Fariz Abdullah',date:'2026-10-12'},
  {id:'m3',cls:'ipa6',title:'Infografis Rantai Makanan',type:'link',url:'https://example.com/rantai-makanan',desc:'Bahan bacaan bab ekosistem.',by:'Rina Wulandari',date:'2026-10-14'},
  {id:'m4',cls:'ipa6',title:'LKS Ekosistem',type:'file',file_name:'lks-ekosistem.pdf',desc:'Lembar kerja untuk dikumpulkan Kamis.',by:'Rina Wulandari',date:'2026-10-15'},
  {id:'m5',cls:'eng',title:'Daftar Kosakata Unit 3',type:'file',file_name:'vocab-unit3.pdf',desc:'60 kata dengan contoh kalimat.',by:'Dita Anggraini',date:'2026-10-08'},
  {id:'m6',cls:'eng',title:'Podcast Listening Practice',type:'link',url:'https://example.com/podcast',desc:'Latihan menyimak 10 menit.',by:'Dita Anggraini',date:'2026-10-18'},
  {id:'m7',cls:'fis',title:'Rumus Gerak Lurus',type:'file',file_name:'gerak-lurus.pdf',desc:'Kartu rumus satu halaman.',by:'Hendra Saputra',date:'2026-10-19'},
  {id:'m8',cls:'cal3',title:'Latihan Membaca Suku Kata',type:'file',file_name:'suku-kata.pdf',desc:'Untuk dilatih di rumah.',by:'Sinta Maharani',date:'2026-10-13'}];
 /* tagihan */
 D.inv=[];D.pay=[];
 function feeOf(stu){return D.enroll.filter(function(e){return e.student===stu}).map(function(e){var c=D.classes.filter(function(x){return x.id===e.cls})[0];return [c.subject,c.fee]})}
 var stat={aiman:['unpaid',25],nadia:['unpaid',20],raka:['unpaid',28],salsa:['paid',18],dimas:['unpaid',30],kirana:['paid',25],bayu:['unpaid',15],putri:['paid',30],mira:['paid',25],fajar:['paid',25],citra:['partial',25]};
 var n=0;
 Object.keys(stat).forEach(function(s){
  [['2026-09','SPP September',5,true],['2026-10','SPP Oktober',stat[s][1],false]].forEach(function(m){
   var items=feeOf(s).map(function(x){return {desc:x[0],amount:x[1]}});
   if(s==='aiman'||s==='kirana'){var sub=items.reduce(function(a,b){return a+b.amount},0);items.push({desc:'Diskon saudara 10%',amount:-Math.round(sub*0.1)})}
   var total=items.reduce(function(a,b){return a+b.amount},0),paid=m[3]?total:stat[s][0]==='paid'?total:stat[s][0]==='partial'?200000:0;
   n++;var inv={id:'inv'+n,number:'INV-'+m[0].replace('-','')+'-'+pad(n),student:s,month:m[0],desc:m[1],due:m[0]+'-'+pad(m[2]),items:items,amount:total,paid:paid};
   D.inv.push(inv);
   if(paid>0)D.pay.push({id:uid('pay'),inv:inv.id,amount:paid,method:m[3]?'Transfer':(s==='putri'?'Tunai':'Transfer'),date:m[3]?m[0]+'-05':(s==='salsa'?'2026-10-10':s==='kirana'?'2026-10-12':s==='putri'?'2026-10-12':'2026-10-14')});
  });
 });
 D.ann=[
  {id:'an1',title:'Libur Hari Sumpah Pemuda',body:'Kelas diliburkan Rabu 28 Oktober 2026. Jadwal pengganti dilaksanakan Sabtu 31 Oktober pada jam yang sama.',audience:'all',by:'Sari Dewi',byRole:'admin',date:'2026-10-22'},
  {id:'an2',title:'Jadwal Ulangan Fisika SMA',body:'Ulangan 1 Gerak sudah dinilai. Hasil akan dipublikasikan setelah remedial selesai.',audience:'students',by:'Hendra Saputra',byRole:'educator',date:'2026-10-21'},
  {id:'an3',title:'Pembayaran SPP Oktober',body:'SPP Oktober jatuh tempo tanggal 25. Mohon melapor ke admin setelah transfer agar segera dikonfirmasi.',audience:'parents',by:'Sari Dewi',byRole:'admin',date:'2026-10-19'},
  {id:'an4',title:'Rapat Educator Bulanan',body:'Rapat evaluasi bulan Oktober hari Sabtu 24 Oktober pukul 12.00 di Ruang A.',audience:'educators',by:'Sari Dewi',byRole:'admin',date:'2026-10-18'},
  {id:'an5',title:'Bawa Buku Latihan',body:'Untuk kelas Matematika K5, mohon membawa buku latihan pecahan pada pertemuan berikutnya.',audience:'class',by:'Fariz Abdullah',byRole:'educator',date:'2026-10-17'}];
 D.readN={};
 return D;
}

var D=seed();
function reset(){seq=100;D=seed();E.D=D}
var E=window.EDUDATA={D:D,TODAY:TODAY,NOW:NOW,DAYS:DAYS,fmtDate:fmtDate,fmtIDR:fmtIDR,short:short,pad:pad,iso:iso,parse:parse,reset:reset,uid:uid};

/* ----- selektor ----- */
E.stu=function(id){return E.D.students.filter(function(s){return s.id===id})[0]};
E.cls=function(id){return E.D.classes.filter(function(c){return c.id===id})[0]};
E.edu=function(id){return E.D.educators.filter(function(x){return x.id===id})[0]};
E.par=function(id){return E.D.parents.filter(function(x){return x.id===id})[0]};
E.inv=function(id){return E.D.inv.filter(function(x){return x.id===id})[0]};
E.rosterIds=function(c){return E.D.enroll.filter(function(e){return e.cls===c&&e.status==='active'}).map(function(e){return e.student})};
E.classesOf=function(s){return E.D.enroll.filter(function(e){return e.student===s&&e.status==='active'}).map(function(e){return e.cls})};
E.eduOfUser=function(uid2){return E.D.educators.filter(function(x){return x.user===uid2})[0]};
E.childrenOf=function(pid){return E.D.students.filter(function(s){return s.parent===pid})};
E.parentOfUser=function(u){return E.D.parents.filter(function(x){return x.user===u})[0]};
E.studentOfUser=function(u){return E.D.students.filter(function(x){return x.user===u})[0]};
E.invStatus=function(i){if(i.paid>=i.amount)return 'paid';if(i.paid>0)return i.due<TODAY?'overdue':'partial';return i.due<TODAY?'overdue':'unpaid'};
E.attPct=function(stu){var a=0,t=0;Object.keys(E.D.att).forEach(function(k){var r=E.D.att[k][stu];if(r){t++;if(r==='present'||r==='late')a++}});return t?Math.round(100*a/t):0};
E.attHistory=function(stu){var out=[];Object.keys(E.D.att).forEach(function(k){var r=E.D.att[k][stu];if(r){var p=k.split('|');out.push({cls:p[0],date:p[1],status:r})}});return out.sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:0})};
E.avgOf=function(stu){var s=0,n=0;E.D.assess.forEach(function(a){if(a.published&&E.D.grades[a.id]&&E.D.grades[a.id][stu]){s+=E.D.grades[a.id][stu][0];n++}});return n?Math.round(s/n):0};
E.resultsOf=function(stu){var out=[];E.D.assess.forEach(function(a){if(a.published&&E.D.grades[a.id]&&E.D.grades[a.id][stu])out.push({a:a,score:E.D.grades[a.id][stu][0],remark:E.D.grades[a.id][stu][1]})});return out.sort(function(x,y){return x.a.date<y.a.date?1:-1})};
E.todaySessions=function(){var d=E.DAYS[E.parse(TODAY).getDay()];return E.D.classes.filter(function(c){return c.days.indexOf(d)>=0}).sort(function(a,b){return a.start<b.start?-1:1})};
E.sessStatus=function(c){var n=NOW.replace('.',':'),s=c.start.replace('.',':'),e=c.end.replace('.',':');return n>=e?'done':n>=s?'now':'next'};
E.stats=function(){
 var D2=E.D,inv=D2.inv.filter(function(i){return i.month==='2026-10'}),rev=D2.pay.filter(function(p){return p.date>='2026-10-01'}).reduce(function(a,p){return a+p.amount},0),out=0,od=0;
 D2.inv.forEach(function(i){var r=i.amount-i.paid;if(r>0){out+=r;if(i.due<TODAY)od++}});
 return {students:D2.students.filter(function(s){return s.status==='active'}).length,educators:D2.educators.filter(function(x){return x.status==='active'}).length,classes:D2.classes.length,revenue:rev,outstanding:out,overdue:od,invCount:inv.length};
};
E.notifs=function(user){
 var D2=E.D,out=[],role=user.role;
 D2.ann.slice().sort(function(a,b){return a.date<b.date?1:-1}).forEach(function(a){var ok=a.audience==='all'||(a.audience==='parents'&&role==='parent')||(a.audience==='students'&&role==='student')||(a.audience==='educators'&&role==='educator')||(a.audience==='class'&&role!=='admin')||role==='admin';if(ok)out.push({id:'n-'+a.id,t:a.title,sub:fmtDate(a.date),kind:'ann',route:'announcements'})});
 if(role==='parent'||role==='student'){var kids=role==='parent'?E.childrenOf(E.parentOfUser(user.id).id):[E.studentOfUser(user.id)];kids.forEach(function(k){D2.inv.forEach(function(i){if(i.student===k.id&&E.invStatus(i)!=='paid'&&i.month==='2026-10')out.unshift({id:'n-'+i.id,t:'Tagihan '+i.desc+' · '+k.full_name.split(' ')[0],sub:'Jatuh tempo '+fmtDate(i.due),kind:'inv',route:'invoices'})});E.resultsOf(k.id).slice(0,1).forEach(function(r){out.push({id:'n-g-'+k.id,t:'Nilai baru: '+r.a.name+' ('+r.score+')',sub:k.full_name.split(' ')[0],kind:'grade',route:'results'})})})}
 if(role==='admin'){var od=E.stats().overdue;if(od)out.unshift({id:'n-od',t:od+' tagihan terlambat',sub:'Perlu pengingat',kind:'inv',route:'invoices'})}
 return out.slice(0,7);
};

/* ----- tindakan ----- */
function find(arr,id){return arr.filter(function(x){return x.id===id})[0]}
E.saveStudent=function(f){var D2=E.D,s=f.id&&find(D2.students,f.id);if(s){Object.assign(s,f)}else{var id='s'+uid('');D2.students.push(Object.assign({id:id,code:'ST-'+pad(D2.students.length+1).padStart(4,'0'),status:'active',user:null},f,{id:id}))}};
E.setStudentStatus=function(id,st){E.stu(id).status=st};
E.delStudent=function(id){var D2=E.D;D2.students=D2.students.filter(function(s){return s.id!==id});D2.enroll=D2.enroll.filter(function(e){return e.student!==id})};
E.importStudents=function(rows){rows.forEach(function(r){E.saveStudent({full_name:r[0],school:r[1],year:r[2],dob:'2015-01-01',parent:r[3]||'p-nur',phone:'0857-0000-0000',email:''})});return rows.length};
E.saveEducator=function(f){var D2=E.D,x=f.id&&find(D2.educators,f.id);if(x)Object.assign(x,f);else D2.educators.push(Object.assign({id:uid('e'),code:'ED-'+pad(D2.educators.length+1).padStart(3,'0'),status:'active',user:null},f))};
E.delEducator=function(id){E.D.educators=E.D.educators.filter(function(x){return x.id!==id})};
E.saveParent=function(f){var D2=E.D,x=f.id&&find(D2.parents,f.id);if(x)Object.assign(x,f);else D2.parents.push(Object.assign({id:uid('p')},f))};
E.delParent=function(id){E.D.parents=E.D.parents.filter(function(x){return x.id!==id})};
E.saveClass=function(f){var D2=E.D,x=f.id&&find(D2.classes,f.id);if(x)Object.assign(x,f);else D2.classes.push(Object.assign({id:uid('c'),color:'#2563eb',fee:200000},f))};
E.delClass=function(id){var D2=E.D;D2.classes=D2.classes.filter(function(x){return x.id!==id});D2.enroll=D2.enroll.filter(function(e){return e.cls!==id})};
E.enrollStudent=function(stu,classIds){classIds.forEach(function(c){if(!E.D.enroll.some(function(e){return e.student===stu&&e.cls===c&&e.status==='active'}))E.D.enroll.push({id:uid('en'),student:stu,cls:c,status:'active'})});
 var items=classIds.map(function(c){var k=E.cls(c);return {desc:k.subject,amount:k.fee}});var tot=items.reduce(function(a,b){return a+b.amount},0);
 var n=E.D.inv.length+1;E.D.inv.push({id:'inv'+uid(''),number:'INV-202611-'+pad(n),student:stu,month:'2026-11',desc:'SPP November',due:'2026-11-05',items:items,amount:tot,paid:0})};
E.setAtt=function(cls,date,stu,v){var k=cls+'|'+date;E.D.att[k]=E.D.att[k]||{};E.D.att[k][stu]=v;E.D.attSaved[k]=false};
E.markAllAtt=function(cls,date){E.rosterIds(cls).forEach(function(s){E.setAtt(cls,date,s,'present')})};
E.saveAtt=function(cls,date){var k=cls+'|'+date;E.D.att[k]=E.D.att[k]||{};E.rosterIds(cls).forEach(function(s){if(!E.D.att[k][s])E.D.att[k][s]='present'});E.D.attSaved[k]=true};
E.saveAssessment=function(f){E.D.assess.push(Object.assign({id:uid('a'),published:false},f));var a=E.D.assess[E.D.assess.length-1];E.D.grades[a.id]={};return a.id};
E.setScore=function(aid,stu,score,remark){var g=E.D.grades[aid]=E.D.grades[aid]||{};if(score===''||score==null){delete g[stu];return}g[stu]=[Math.max(0,Math.min(100,+score)),remark||(g[stu]?g[stu][1]:'')]};
E.setRemark=function(aid,stu,r){var g=E.D.grades[aid]=E.D.grades[aid]||{};if(g[stu])g[stu][1]=r;else g[stu]=[0,r]};
E.publish=function(aid){find(E.D.assess,aid).published=true};
E.saveMaterial=function(f){E.D.mats.unshift(Object.assign({id:uid('m'),date:TODAY},f))};
E.delMaterial=function(id){E.D.mats=E.D.mats.filter(function(m){return m.id!==id})};
E.saveInvoice=function(f){var st=E.stu(f.student),n=E.D.inv.length+1;E.D.inv.push({id:'inv'+uid(''),number:'INV-'+f.month.replace('-','')+'-'+pad(n),student:f.student,month:f.month,desc:f.desc||'SPP',due:f.due,items:[{desc:f.desc||'SPP',amount:+f.amount}],amount:+f.amount,paid:0})};
E.payInvoice=function(id,amount,method){var i=E.inv(id);amount=Math.min(+amount,i.amount-i.paid);if(amount<=0)return;i.paid+=amount;E.D.pay.push({id:uid('pay'),inv:id,amount:amount,method:method,date:TODAY})};
E.delInvoice=function(id){E.D.inv=E.D.inv.filter(function(i){return i.id!==id})};
E.saveAnnouncement=function(f,by,role){var a=f.id&&find(E.D.ann,f.id);if(a)Object.assign(a,f);else E.D.ann.unshift(Object.assign({id:uid('an'),by:by,byRole:role,date:TODAY},f))};
E.delAnnouncement=function(id){E.D.ann=E.D.ann.filter(function(a){return a.id!==id})};
E.markRead=function(uid2,nid){E.D.readN[uid2+'|'+nid]=true};
E.isRead=function(uid2,nid){return !!E.D.readN[uid2+'|'+nid]};
E.saveProfile=function(user,f){var u=find(E.D.users,user.id);Object.assign(u,f);Object.assign(user,f)};
E.saveCentre=function(f){Object.assign(E.D.centre,f)};
})();
