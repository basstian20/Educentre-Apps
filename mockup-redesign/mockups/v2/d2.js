/* Arah 2 · Linimasa Hari Ini (prototipe klik) */
(function(){
var E=window.EDU;
var LANE={'Ruang A':0,'Ruang B':1,'Ruang C':2};
function Y(m){return (m/60-8)*37}
function chipH(sid,id,v){return '<button type="button" class="mc '+(v||'N')+'" data-act="mark" data-s="'+sid+'" data-st="'+id+'">'+(v?E.LBL[v]:'Isi')+'</button>'}
function sessPanel(id,S){
 var c=S.cls[id],a=S.att[id]||{},ss=E.sessStatus(id),k=E.counts(id);
 var inv=c.roster.map(function(sid){return E.invOf(sid)}).filter(function(i){return i&&i.status!=='lunas'});
 return '<div class="it" style="border-left-color:#0f4c58"><b>'+c.name+' · '+E.time(c.start)+'–'+E.time(c.end)+'</b><small>'+c.tutor+' · '+c.room+' · '+(ss==='done'?'selesai':ss==='now'?'berjalan':'akan datang')+'</small></div>'+
  '<h4>Daftar hadir</h4>'+c.roster.map(function(sid){return '<div class="rr"><span>'+S.stu[sid].name+'</span>'+chipH(id,sid,a[sid])+'</div>'}).join('')+
  '<div class="acts"><span class="go" data-act="markAll" data-s="'+id+'">Semua hadir</span><span class="go" data-act="saveAtt" data-s="'+id+'">'+(S.saved[id]?'Tersimpan ✓':'Simpan absensi')+'</span></div>'+
  (inv.length?'<h4 style="margin-top:12px">Tagihan siswa kelas ini</h4>'+inv.map(function(i){var s=E.invState(i);return '<div class="rr"><span>'+S.stu[i.stu].name+'<br><small>Rp '+E.rp(i.amt)+' · '+s.l+'</small></span><span class="go" data-act="'+(i.pending?'confirm':'payAsk')+'" data-id="'+i.id+'">'+(i.pending?'Konfirmasi':'Catat bayar')+'</span></div>'}).join(''):'');
}
E.reg('d2','admin',{init:{view:'dash'},
 render:function(ui,S){
  var st=E.stats(),tabs=[['dash','Hari ini'],['siswa','Siswa'],['tagih','Tagihan']].map(function(t){return '<span class="tab'+(ui.view===t[0]?' on':'')+'" data-act="go" data-v="'+t[0]+'">'+t[1]+'</span>'}).join('');
  var top='<div class="topbar"><b>EduCentre</b>'+tabs+'<div class="st"><span><b>'+st.students+'</b>siswa</span><span><b>'+st.presentPct+'%</b>hadir</span><span><b>'+E.short(st.unpaidAmt)+'</b>belum lunas</span></div></div>';
  var body='';
  if(ui.view==='dash'){
   var hrs='';for(var h=8;h<=19;h++)hrs+='<span class="hr" style="top:'+(Y(h*60)-8)+'px">'+(h<10?'0':'')+h+'.00</span>';
   var evs=S.corder.map(function(id){var c=S.cls[id],ss=E.sessStatus(id),k=E.counts(id),l=LANE[c.room];
    return '<div class="ev '+ss+(ui.sel===id?' sel':'')+'" data-act="sel" data-id="'+id+'" style="left:calc(56px + (100% - 56px)/3*'+l+' + 6px);width:calc((100% - 56px)/3 - 12px);top:'+(Y(c.start)+2)+'px;height:'+((c.end-c.start)/60*37-4)+'px">'+c.name+'<small>'+c.tutor+' · '+(S.saved[id]?'absen ✓ '+(k.H+k.T)+'/'+k.total:ss==='next'?'belum mulai':'absen belum disimpan')+'</small></div>'}).join('');
   var side;
   if(ui.sel)side='<div class="side scr" data-keep="s">'+sessPanel(ui.sel,S)+'<div class="go2" data-act="sel" data-id="'+ui.sel+'">← Kembali ke daftar</div></div>';
   else{var td=E.todos();side='<div class="side"><h4>Menempel pada sesi</h4>'+(td.length?td.map(function(t){return '<div class="it"><b>'+t.text+'</b><span class="go" data-act="'+(t.s?'sel':'go')+'" '+(t.s?'data-id="'+t.s+'"':'data-v="'+t.go+'"')+'>'+(t.s?'Buka sesi':'Lihat')+'</span></div>'}).join(''):'<div class="it"><b>Semua beres ✓</b><small>Tidak ada tindakan tertunda.</small></div>')+'<div class="it" style="border-left-color:#6f8f95"><b>Aktivitas terbaru</b>'+S.feed.slice(-3).reverse().map(function(f){return '<small style="display:block">'+f.t+' · '+f.text+'</small>'}).join('')+'</div></div>'}
   body='<div class="days">'+['Sen 19','Sel 20','Rab 21','Kam 22','Jum 23','Sab 24'].map(function(d,i){return '<span class="'+(i===4?'on':'')+'"'+(i===4?'':' data-act="toast" data-msg="Demo ini hanya berisi data hari Jumat 23 Okt"')+'>'+d+'</span>'}).join('')+'</div>'+
    '<div class="body"><div class="grid"><div class="lanes"><span></span><span>Ruang A</span><span>Ruang B</span><span>Ruang C</span></div><div class="tl">'+hrs+evs+'<div class="now-line" data-time="'+E.time(S.clock)+'" style="top:'+Y(S.clock)+'px"></div></div></div>'+side+'</div>';
  }else if(ui.view==='siswa'){
   body='<div class="pgt"><table><thead><tr><th>Siswa</th><th>Kelas</th><th>Wali</th><th>Hadir</th><th>Tagihan</th></tr></thead><tbody>'+S.sorder.map(function(id){var s=S.stu[id],i=E.invOf(id),v=E.invState(i);return '<tr data-act="profile" data-id="'+id+'"><td><b>'+s.name+'</b></td><td>'+s.lv+'</td><td>'+s.ortu+'</td><td>'+s.att+'%</td><td><span class="chp '+v.k+'">'+v.l+'</span></td></tr>'}).join('')+'</tbody></table></div>';
  }else{
   body='<div class="pgt"><div class="bar2"><span>'+st.pending+' menunggu konfirmasi · '+st.overdue+' terlambat</span><span class="go" data-act="invNew">+ Buat tagihan</span><span class="go" data-act="remindAll">Ingatkan semua terlambat</span></div><table><thead><tr><th>Siswa</th><th>Item</th><th>Jatuh tempo</th><th>Jumlah</th><th>Status</th><th></th></tr></thead><tbody>'+S.inv.slice().sort(function(a,b){return (a.status==='lunas')-(b.status==='lunas')}).map(function(i){var v=E.invState(i);return '<tr><td><b>'+S.stu[i.stu].name+'</b></td><td>'+i.item+'</td><td>'+E.dueLabel(i.due)+'</td><td>Rp '+E.rp(i.amt)+'</td><td><span class="chp '+v.k+'">'+v.l+'</span></td><td>'+(i.status==='lunas'?'':'<span class="go" data-act="'+(i.pending?'confirm':'payAsk')+'" data-id="'+i.id+'">'+(i.pending?'Konfirmasi':'Catat bayar')+'</span>')+'</td></tr>'}).join('')+'</tbody></table></div>';
  }
  return '<div class="dk">'+top+body+'<div class="credit">Dikembangkan oleh NobleDev</div></div>';
 }});

E.reg('d2','educator',{init:{view:'list'},
 act:function(a,d,ui){if(a==='open'){ui.view='sess';ui.sel=d.id;return true}if(a==='back'){ui.view='list';ui.sel=null;return true}return false},
 render:function(ui,S){
  var mine=E.sessionsOf('Pak Fariz'),body='',title='Jadwal hari ini';
  if(ui.view==='list'){
   body='<div class="tlm">'+mine.map(function(id){var c=S.cls[id],ss=E.sessStatus(id),k=E.counts(id);return '<div class="e'+(ss==='now'?' now':'')+'" data-act="open" data-id="'+id+'"><time>'+E.time(c.start)+'</time><span class="dot"></span><div class="c"><b>'+c.name+'</b><small>'+c.room+' · '+(ss==='now'?'sedang berjalan':ss==='done'?'selesai':'akan datang')+' · '+c.roster.length+' siswa</small>'+(ss==='now'||S.saved[id]?'<br><span class="chipx">'+(S.saved[id]?'Absensi tersimpan ✓':'Absensi '+(k.total-k.n)+'/'+k.total)+'</span>':'')+(ss==='now'&&!S.saved[id]?'<span class="btn">Isi absensi sekarang</span>':'')+'</div></div>'}).join('')+
    '<div class="e" data-act="go" data-v="nilai"><time>—</time><span class="dot"></span><div class="c"><b>Nilai</b><small>'+S.grade.title+' · '+(S.grade.published?'terbit ✓':'draf')+'</small></div></div></div>';
  }else if(ui.view==='sess'){
   var c2=S.cls[ui.sel],a=S.att[ui.sel]||{},ss2=E.sessStatus(ui.sel);title=c2.name;
   body='<div class="tlm"><div class="back" data-act="back">← Jadwal</div>'+c2.roster.map(function(sid){return '<div class="rr2"><span>'+S.stu[sid].name+'</span>'+chipH(ui.sel,sid,a[sid])+'</div>'}).join('')+
    (ss2==='next'?'<div class="chipx" style="margin-top:8px">Sesi belum dimulai, absensi bisa diisi lebih awal</div>':'')+
    '<span class="btn" data-act="markAll" data-s="'+ui.sel+'" style="background:#fff;color:#0f4c58;border:2px solid #0f4c58">Tandai semua hadir</span><span class="btn" data-act="saveAtt" data-s="'+ui.sel+'">'+(S.saved[ui.sel]?'Tersimpan ✓':'Simpan absensi')+'</span></div>';
  }else{
   title='Nilai';var c3=S.cls.mtk5;
   body='<div class="tlm"><div class="back" data-act="back">← Jadwal</div><div class="chipx">'+S.grade.title+' · '+(S.grade.published?'terbit':'draf')+'</div>'+c3.roster.map(function(sid){return '<div class="rr2"><span>'+S.stu[sid].name.split(' ')[0]+'</span><span class="stp"><b data-act="grade" data-st="'+sid+'" data-d="-1">−</b><i>'+S.grade.scores[sid]+'</i><b data-act="grade" data-st="'+sid+'" data-d="1">+</b></span></div>'}).join('')+'<span class="btn" data-act="pub">'+(S.grade.published?'Sudah diterbitkan':'Terbitkan nilai')+'</span></div>';
  }
  return '<div class="ph"><div class="sb" style="background:#0f4c58;color:#e9f5f3"><span>09:41</span><span>●●● 87%</span></div><div class="hd"><small>Pak Fariz · Jumat, 23 Okt · '+E.time(S.clock)+'</small><h5>'+title+'</h5></div><div class="scr" data-keep="m" style="height:430px">'+body+'</div></div>';
 }});

E.reg('d2','parent',{init:{kid:'aiman'},
 render:function(ui,S){
  var kid=ui.kid,s=S.stu[kid],cl=E.classesOf(kid).filter(function(id){return id!=='ipa6'||kid!=='aiman'});
  var today=cl.map(function(id){var c=S.cls[id],v=(S.att[id]||{})[kid],ss=E.sessStatus(id);return '<div class="e'+(ss==='now'?' now':'')+'"><time>Hari ini</time><span class="dot"></span><div class="c"><b>'+c.name+'</b><small>'+E.time(c.start)+' · '+(v&&S.saved[id]?'hadir tercatat: '+E.LBL[v]:ss==='now'?'berjalan':ss==='done'?'selesai':'akan datang')+'</small></div></div>'}).join('');
  var inv=E.invs(kid).map(function(i){var v=E.invState(i);return '<div class="e" data-act="'+(i.status==='lunas'||i.pending?'toast':'reqAsk')+'" '+(i.status==='lunas'||i.pending?'data-msg="'+(i.pending?'Menunggu konfirmasi admin':'Tagihan sudah lunas')+'"':'data-id="'+i.id+'"')+'><time>'+E.dueLabel(i.due)+'</time><span class="dot"></span><div class="c"><b>'+i.item+' · Rp '+E.rp(i.amt)+'</b><small>'+v.l+'</small>'+(i.status==='lunas'||i.pending?'':'<span class="btn">Lapor sudah bayar</span>')+'</div></div>'}).join('');
  var g=S.grade.pub[kid];
  return '<div class="ph"><div class="sb" style="background:#0f4c58;color:#e9f5f3"><span>09:41</span><span>●●● 87%</span></div><div class="hd"><small>Ibu Nurhayati · '+s.name+'</small><h5>Pekan ini</h5></div><div class="kidsw"><span class="'+(kid==='aiman'?'on':'')+'" data-act="kid" data-id="aiman">Aiman</span><span class="'+(kid==='kirana'?'on':'')+'" data-act="kid" data-id="kirana">Kirana</span></div><div class="scr" data-keep="p" style="height:410px"><div class="tlm"><div class="e"><time>Sen</time><span class="dot"></span><div class="c"><b>'+(kid==='aiman'?'Matematika':'Calistung')+'</b><small>hadir ✓</small></div></div>'+today+(g!=null&&kid==='aiman'?'<div class="e"><time>Nilai</time><span class="dot"></span><div class="c"><b>'+S.grade.title+'</b><small>Nilai Aiman: '+g+'</small></div></div>':'')+inv+'<div class="e"><time>28 Okt</time><span class="dot"></span><div class="c"><b>Libur kelas</b><small>Hari Sumpah Pemuda</small></div></div></div></div></div>';
 }});
})();
