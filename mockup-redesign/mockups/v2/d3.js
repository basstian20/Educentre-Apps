/* Arah 3 · Ruang Obrolan (prototipe klik) */
(function(){
var E=window.EDU;
function bubble(f){var me=/Sari/.test(f.who);return '<div class="m'+(me?' me':'')+'"><div class="who">'+f.who+' <time>'+f.t+'</time></div>'+f.text+'</div>'}
function card(f,extra,warn){return '<div class="card'+(warn?' warn':'')+'"><b>'+(f.title||f.who)+'</b><span style="color:#5a6e65">'+f.t+' · '+f.text+'</span>'+(extra||'')+'</div>'}
function invCard(i,S,adm){var s=S.stu[i.stu],v=E.invState(i);
 var acts=adm?(i.pending?'<span class="p" data-act="confirm" data-id="'+i.id+'">Konfirmasi</span>':'<span class="p" data-act="payAsk" data-id="'+i.id+'">Catat bayar</span><span data-act="remind" data-id="'+i.id+'">'+(i.reminded?'Ingatkan lagi':'Kirim pengingat')+'</span>'):(i.status==='lunas'||i.pending?'':'<span class="p" data-act="reqAsk" data-id="'+i.id+'">Lapor sudah bayar</span>');
 return '<div class="card'+(v.k==='lunas'?'':' warn')+'"><b>Tagihan '+i.item+' · '+s.name+'</b><span style="color:#5a6e65">Rp '+E.rp(i.amt)+' · jatuh tempo '+E.dueLabel(i.due)+' · <b style="display:inline">'+v.l+'</b></span>'+(acts?'<div class="acts">'+acts+'</div>':'')+'</div>'}
function feedFor(S,pred){return S.feed.filter(pred).map(function(f){
 if(f.kind==='att'||f.kind==='grade'||f.kind==='pay'||f.kind==='sys')return card({t:f.t,who:f.who,text:f.text},'',false);
 return bubble(f)}).join('')}
function ctx(S,room){
 if(S.cls[room]){var c=S.cls[room],k=E.counts(room),att=Math.round(100*(k.H+k.T)/Math.max(1,k.total-k.n));var un=c.roster.map(function(id){return E.invOf(id)}).filter(function(i){return i.status!=='lunas'}).length;
  return '<h4>Konteks ruang</h4><div class="kv"><span>Educator</span><b>'+c.tutor+'</b></div><div class="kv"><span>Jadwal</span><b>'+E.time(c.start)+'–'+E.time(c.end)+'</b></div><div class="kv"><span>Ruang</span><b>'+c.room+'</b></div><div class="kv"><span>Hadir hari ini</span><b>'+(k.total-k.n?att+'%':'—')+'</b></div><div class="kv"><span>Absensi</span><b>'+(S.saved[room]?'tersimpan':'belum')+'</b></div><div class="kv"><span>Tagihan belum lunas</span><b>'+un+'</b></div><div class="kv"><span>Rata-rata nilai</span><b>'+(room==='mtk5'?(Object.keys(S.grade.pub).reduce(function(a,k2){return a+S.grade.pub[k2]},0)/5).toFixed(1).replace('.',','):'—')+'</b></div>'}
 var st=E.stats();return '<h4>Ringkasan</h4><div class="kv"><span>Siswa</span><b>'+st.students+'</b></div><div class="kv"><span>Hadir hari ini</span><b>'+st.presentPct+'%</b></div><div class="kv"><span>Belum lunas</span><b>'+E.short(st.unpaidAmt)+'</b></div><div class="kv"><span>Menunggu konfirmasi</span><b>'+st.pending+'</b></div>';
}
E.reg('d3','admin',{init:{room:'mtk5'},
 act:function(a,d,ui){if(a==='room'){ui.room=d.r;ui.modal=null;return true}if(a==='chat'){E.say('Sari (Admin)',d.text,d.room||ui.room);ui.toast='Pesan terkirim';return true}return false},
 render:function(ui,S){
  var st=E.stats(),room=ui.room;
  function r(id,label,badge){return '<div class="room'+(room===id?' on':'')+'" data-act="room" data-r="'+id+'"><span>'+label+'</span>'+(badge?'<em>'+badge+'</em>':'')+'</div>'}
  var unsaved=function(id){return E.sessStatus(id)!=='next'&&!S.saved[id]?1:0};
  var left='<div class="l"><div class="brand"><b></b>EduCentre</div><div class="s">Umum</div>'+r('ann','Pengumuman',0)+r('bill','Tagihan',st.pending+st.overdue)+r('inbox','Pesan orang tua',S.feed.filter(function(f){return f.room==='inbox'}).length)+r('siswa','Siswa ('+st.students+')',0)+'<div class="s">Kelas</div>'+['mtk5','ipa6','eng','fis'].map(function(id){return r(id,S.cls[id].name,unsaved(id))}).join('')+'<div class="credit" style="margin-top:auto">Dikembangkan oleh NobleDev</div></div>';
  var title,sub,feed='';
  if(room==='ann'){title='Pengumuman';sub='Untuk semua orang tua dan siswa';feed='<span class="day">Jumat, 23 Oktober</span>'+feedFor(S,function(f){return f.kind==='ann'||(f.kind==='msg'&&f.room==='ann')})}
  else if(room==='inbox'){title='Pesan orang tua';sub='Pertanyaan dari orang tua';feed=feedFor(S,function(f){return f.room==='inbox'})||'<span class="day">Belum ada pesan</span>'}
  else if(room==='bill'){title='Tagihan';sub=st.pending+' menunggu konfirmasi · '+st.overdue+' terlambat';feed='<span class="day">Perlu tindakan</span>'+S.inv.filter(function(i){return i.status!=='lunas'}).sort(function(a,b){return (b.pending?1:0)-(a.pending?1:0)||a.due-b.due}).map(function(i){return invCard(i,S,true)}).join('')+feedFor(S,function(f){return f.kind==='pay'})}
  else if(room==='siswa'){title='Direktori siswa';sub='Ketuk nama untuk profil';feed='<div class="dirl">'+S.sorder.map(function(id){var s=S.stu[id],v=E.invState(E.invOf(id));return '<div class="dr" data-act="profile" data-id="'+id+'"><span class="av2">'+E.ini(s.name)+'</span><span><b>'+s.name+'</b><br><small>'+s.lv+' · wali '+s.ortu+'</small></span><em class="'+v.k+'">'+v.l+'</em></div>'}).join('')+'</div>'}
  else{var c=S.cls[room];title=c.name;sub=S.cls[room].roster.length+' siswa · '+c.tutor+' · '+c.room;
   feed='<span class="day">Jumat, 23 Oktober</span>'+feedFor(S,function(f){return f.cls===room||(f.kind==='msg'&&f.room===room)});
   if(!S.saved[room]&&E.sessStatus(room)!=='next')feed+='<div class="card warn"><b>Absensi '+c.name+' belum disimpan</b><span style="color:#5a6e65">Sesi '+E.time(c.start)+' sedang/selesai berjalan</span><div class="acts"><span class="p" data-act="roster" data-s="'+room+'">Buka daftar hadir</span><span data-act="toast" data-msg="Pengingat dikirim ke '+c.tutor+'">Ingatkan educator</span></div></div>';
   feed+=c.roster.map(function(id){return E.invOf(id)}).filter(function(i){return i&&i.status!=='lunas'}).map(function(i){return invCard(i,S,true)}).join('')}
  var chips=S.cls[room]?'<span data-act="roster" data-s="'+room+'">Absensi</span>':'<span data-act="toast" data-msg="Pilih ruang kelas untuk membuka absensi">Absensi</span>';
  chips+='<span data-act="toast" data-msg="Rata-rata nilai Ulangan 3 Matematika K5: 83,0">Nilai</span><span data-act="room" data-r="bill">Tagihan</span><span data-act="chat" data-room="ann" data-text="Pengumuman: besok tetap masuk seperti biasa.">Pengumuman</span>';
  var center='<div class="c"><div class="h"><span>'+title+'</span><small>'+sub+'</small></div><div class="feed scr" data-keep="f">'+feed+'</div><div class="comp"><div class="q">'+chips+'</div><div class="in" data-act="chat" data-text="Selamat sore, jangan lupa bawa buku latihan besok.">Tulis pesan ke '+title+'…</div></div></div>';
  return '<div class="dk">'+left+center+'<div class="r">'+ctx(S,room)+'</div></div>';
 }});

E.reg('d3','educator',{init:{view:'chat'},
 render:function(ui,S){
  var c=S.cls.mtk5,a=S.att.mtk5||{},body='';
  if(ui.view==='chat'){
   body='<span class="day">Hari ini</span>'+feedFor(S,function(f){return f.cls==='mtk5'||(f.kind==='msg'&&f.room==='mtk5')})+(S.saved.mtk5?'':'<div class="card warn"><b>Absensi 15.30 belum disimpan</b><span style="color:#5a6e65">'+E.counts('mtk5').n+' siswa belum diisi</span><div class="acts" style="display:flex;gap:6px;margin-top:8px"><span class="p" data-act="go" data-v="absen">Isi sekarang</span></div></div>');
  }else if(ui.view==='absen'){
   body='<div class="card warn" style="width:100%"><b>Absensi Matematika K5</b><span style="color:#5a6e65">Ketuk nama untuk ganti status</span><div class="stu">'+c.roster.map(function(id){var v=a[id];return '<span class="'+(v==='T'?'t':v==='A'||v==='I'?'a':'')+'" data-act="mark" data-s="mtk5" data-st="'+id+'">'+S.stu[id].name.split(' ')[0]+' '+(v?v:'?')+'</span>'}).join('')+'</div><div class="acts" style="display:flex;gap:6px;margin-top:8px"><span data-act="markAll" data-s="mtk5">Semua hadir</span><span class="p" data-act="saveAtt" data-s="mtk5">'+(S.saved.mtk5?'Tersimpan ✓':'Simpan absensi')+'</span></div></div>';
  }else{
   body='<div class="card" style="width:100%"><b>'+S.grade.title+'</b><span style="color:#5a6e65">'+(S.grade.published?'sudah terbit':'draf, belum terbit')+'</span>'+c.roster.map(function(id){return '<div class="nrow"><span>'+S.stu[id].name.split(' ')[0]+'</span><span class="stp"><b data-act="grade" data-st="'+id+'" data-d="-1">−</b><i>'+S.grade.scores[id]+'</i><b data-act="grade" data-st="'+id+'" data-d="1">+</b></span></div>'}).join('')+'<div class="acts" style="display:flex;gap:6px;margin-top:8px"><span class="p" data-act="pub">'+(S.grade.published?'Sudah terbit':'Terbitkan nilai')+'</span></div></div>';
  }
  return '<div class="ph"><div class="sb" style="background:#0b6b4f;color:#fff"><span>09:41</span><span>●●● 87%</span></div><div class="hd"><span class="av">M5</span><div><b>Matematika K5</b><small>'+c.roster.length+' siswa · '+c.room+'</small></div></div><div class="f scr" data-keep="e">'+body+'</div><div class="in"><span class="'+(ui.view==='absen'?'on':'')+'" data-act="go" data-v="absen">Absensi</span><span class="'+(ui.view==='nilai'?'on':'')+'" data-act="go" data-v="nilai">Nilai</span><span class="'+(ui.view==='chat'?'on':'')+'" data-act="go" data-v="chat">Pesan</span></div></div>';
 }});

E.reg('d3','parent',{init:{kid:'aiman'},
 render:function(ui,S){
  var kid=ui.kid,s=S.stu[kid],items='';
  items+=feedFor(S,function(f){return f.kind==='ann'});
  E.classesOf(kid).forEach(function(id){var v=(S.att[id]||{})[kid];if(S.saved[id]&&v)items+=card({t:E.time(S.cls[id].end),who:s.name+' · '+S.cls[id].name,text:'tercatat '+E.LBL[v].toLowerCase()},'',false)});
  if(S.grade.pub[kid]!=null&&kid==='aiman')items+=card({t:'15.10',who:'Nilai baru · '+S.grade.title,text:'Nilai '+s.name+': '+S.grade.pub[kid]},'',false);
  items+=E.invs(kid).map(function(i){return invCard(i,S,false)}).join('');
  items+=feedFor(S,function(f){return f.stu===kid&&(f.kind==='pay'||f.kind==='sys'||f.kind==='msg')||(f.kind==='msg'&&/Nurhayati/.test(f.who))});
  return '<div class="ph"><div class="sb" style="background:#0b6b4f;color:#fff"><span>09:41</span><span>●●● 87%</span></div><div class="hd"><span class="av">'+E.ini(s.name)+'</span><div><b>Info '+s.name.split(' ')[0]+'</b><small>'+s.lv+' · Bimbel Cerdas</small></div></div><div class="f scr" data-keep="p">'+items+'</div><div class="in"><span class="'+(kid==='aiman'?'on':'')+'" data-act="kid" data-id="aiman">Aiman</span><span class="'+(kid==='kirana'?'on':'')+'" data-act="kid" data-id="kirana">Kirana</span><span data-act="say" data-who="Ibu Nurhayati" data-room="inbox" data-text="Mohon info jadwal pengganti Sabtu, terima kasih.">Tanya admin</span></div></div>';
 }});
})();
