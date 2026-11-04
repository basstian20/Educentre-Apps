/* Arah 1 · Buku Induk (prototipe klik) */
(function(){
var E=window.EDU;
function stamp(i,act){var s=E.invState(i);
 var cls=s.k==='lunas'?'ok':s.k==='menunggu'?'wt':'no',txt=s.k==='lunas'?'LUNAS':s.k==='menunggu'?'MENUNGGU':s.k==='terlambat'?'TERLAMBAT':'BELUM';
 var a=act&&s.k!=='lunas'?(s.k==='menunggu'?' data-act="confirm" data-id="'+i.id+'"':' data-act="payAsk" data-id="'+i.id+'"'):'';
 return '<span class="stamp '+cls+'"'+a+'>'+txt+'</span>'}
function mk(v){return v?({H:'✓',T:'T',A:'A',I:'I'})[v]:'·'}
function catat(id){var i=E.invOf(id),v=E.lastMark(id);
 if(i&&E.invState(i).k==='menunggu')return 'Konfirmasi!';
 if(i&&E.invState(i).k==='terlambat')return 'Tagih '+E.dueLabel(i.due);
 if(v==='A')return 'Hubungi ortu';if(v==='T')return 'Telat hari ini';return '—'}
function rows(ids){return ids.map(function(id,n){var s=E.stu(id),i=E.invOf(id);
 return '<tr class="hov" data-act="profile" data-id="'+id+'"><td class="no">'+(n+1)+'.</td><td>'+s.name+'</td><td>'+s.lv+'</td><td class="hand">'+mk(E.lastMark(id))+'</td><td>'+stamp(i,true)+'</td><td class="hand" style="font-size:18px">'+catat(id)+'</td></tr>'}).join('')}

E.reg('d1','admin',{init:{view:'dash'},
 render:function(ui,S){var st=E.stats(),tabs=[['dash','Hari ini'],['siswa','Siswa'],['absen','Absensi'],['tagih','Tagihan']].map(function(t){return '<span class="'+(ui.view===t[0]?'on':'')+'" data-act="go" data-v="'+t[0]+'">'+t[1]+'</span>'}).join('');
  var body='';
  if(ui.view==='dash'){
   var td=E.todos();
   body='<div class="tally"><span><b>'+st.students+'</b>siswa</span><span><b>'+st.presentPct+'%</b>hadir</span><span><b>'+E.short(st.unpaidAmt)+'</b>belum lunas</span></div>'+
    '<table><thead><tr><th>No</th><th>Nama siswa</th><th>Kelas</th><th>Hadir</th><th>Iuran</th><th>Catatan</th></tr></thead><tbody>'+rows(S.sorder.slice(0,8))+'</tbody></table>'+
    '<div class="sticky"><b style="display:block;font-size:15px">Hari ini:</b>'+(td.length?td.map(function(t){return '<div class="hov" data-act="go" data-v="'+t.go+'">• '+t.text+'</div>'}).join(''):'Semua beres ✓')+'</div>';
  }else if(ui.view==='siswa'){
   body='<div class="tally"><span><b>'+st.students+'</b>siswa terdaftar</span><span style="font:italic 15px Newsreader">11 contoh ditampilkan · ketuk nama untuk profil</span></div>'+
    '<table><thead><tr><th>No</th><th>Nama siswa</th><th>Kelas</th><th>Hadir</th><th>Iuran</th><th>Catatan</th></tr></thead><tbody>'+rows(S.sorder)+'</tbody></table>';
  }else if(ui.view==='absen'){
   body='<div class="tally"><span><b>'+st.presentPct+'%</b>hadir</span><span style="font:italic 15px Newsreader">Ketuk sesi untuk membuka daftar hadir</span></div>'+
    '<table><thead><tr><th>Jam</th><th>Kelas</th><th>Pengajar</th><th>Ruang</th><th>Status</th><th>Hadir</th></tr></thead><tbody>'+S.corder.map(function(id){var c=S.cls[id],k=E.counts(id),ss=E.sessStatus(id);
    return '<tr class="hov" data-act="roster" data-s="'+id+'"><td>'+E.time(c.start)+'</td><td>'+c.name+'</td><td>'+c.tutor+'</td><td>'+c.room+'</td><td>'+(S.saved[id]?'<span class="stamp ok">DISIMPAN</span>':ss==='next'?'<span class="hand">akan datang</span>':'<span class="stamp no">BELUM</span>')+'</td><td class="hand">'+(k.H+k.T)+'/'+k.total+'</td></tr>'}).join('')+'</tbody></table>';
  }else{
   body='<div class="tally"><span><b>'+E.short(st.unpaidAmt)+'</b>belum lunas</span><span><b>'+st.pending+'</b>menunggu konfirmasi</span><span data-act="invNew" class="hov" style="cursor:pointer;border-bottom:2px solid;font-size:15px">+ Buat tagihan</span></div>'+
    '<table><thead><tr><th>No</th><th>Siswa</th><th>Item</th><th>Jatuh tempo</th><th>Jumlah</th><th>Status</th></tr></thead><tbody>'+S.inv.filter(function(i){return i.status!=='lunas'}).concat(S.inv.filter(function(i){return i.status==='lunas'}).slice(0,3)).map(function(i,n){
    return '<tr><td class="no">'+(n+1)+'.</td><td>'+S.stu[i.stu].name+'</td><td>'+i.item+'</td><td>'+E.dueLabel(i.due)+'</td><td>'+E.rp(i.amt)+'</td><td>'+stamp(i,true)+(i.status!=='lunas'&&!i.pending?' <span class="hand hov" data-act="remind" data-id="'+i.id+'" style="font-size:16px">ingatkan</span>':'')+'</td></tr>'}).join('')+'</tbody></table>';
  }
  return '<div class="dk"><div class="tabs">'+tabs+'</div><div class="page"><div class="hd"><h5>Buku Induk · Bimbel Cerdas</h5><small>Jumat, 23 Oktober 2026 · pukul '+E.time(S.clock)+'</small></div>'+body+'</div><div class="credit">Dikembangkan oleh NobleDev</div></div>';
 }});

E.reg('d1','educator',{init:{view:'absen'},
 render:function(ui,S){
  var tabs='<div class="pt"><span class="'+(ui.view==='absen'?'on':'')+'" data-act="go" data-v="absen">Buku absen</span><span class="'+(ui.view==='nilai'?'on':'')+'" data-act="go" data-v="nilai">Buku nilai</span></div>';
  var c=S.cls.mtk5,k=E.counts('mtk5'),body='';
  if(ui.view==='absen'){
   body='<div class="rows">'+c.roster.map(function(id,n){var v=(S.att.mtk5||{})[id];return '<div class="r"><span>'+(n+1)+'. '+S.stu[id].name+'</span><i class="'+(v==='T'?'t':v==='A'?'a':v==='I'?'iz':'')+'" data-act="mark" data-s="mtk5" data-st="'+id+'">'+(v?mk(v):'')+'</i></div>'}).join('')+
    '<div class="r" style="margin-top:6px;font-style:italic;font-size:14px">'+(k.n?k.n+' belum diisi · ':'')+'ketuk bulatan: ✓ T A I</div><div class="r hov" data-act="markAll" data-s="mtk5" style="text-decoration:underline;font-size:15px">Tandai semua hadir</div></div>'+
    '<div class="sign" data-act="saveAtt" data-s="mtk5">'+(S.saved.mtk5?'Tersimpan ✓ · paraf Pak Fariz':'Simpan &amp; paraf')+'</div>';
  }else{
   body='<div class="rows">'+c.roster.map(function(id,n){var v=S.grade.scores[id];return '<div class="r"><span>'+(n+1)+'. '+S.stu[id].name.split(' ')[0]+'</span><span style="margin-left:auto;display:flex;gap:8px;align-items:center"><b class="hov" data-act="grade" data-st="'+id+'" data-d="-1" style="width:24px;height:24px;border:1.5px solid #1d3a6b;border-radius:50%;text-align:center;line-height:20px">−</b><span class="hand" style="font-size:22px;min-width:30px;text-align:center">'+v+'</span><b class="hov" data-act="grade" data-st="'+id+'" data-d="1" style="width:24px;height:24px;border:1.5px solid #1d3a6b;border-radius:50%;text-align:center;line-height:20px">+</b></span></div>'}).join('')+
    '<div class="r" style="font-style:italic;font-size:14px;margin-top:6px">'+S.grade.title+' · '+(S.grade.published?'terbit ✓':'draf (belum terbit)')+'</div></div><div class="sign" data-act="pub">'+(S.grade.published?'Sudah diterbitkan':'Terbitkan nilai')+'</div>';
  }
  return '<div class="ph"><div class="sb"><span>09:41</span><span>●●● 87%</span></div><div class="top"><small>Pak Fariz · 23 Okt · '+c.name+'</small><h5>'+(ui.view==='absen'?'Buku Absen':'Buku Nilai')+'</h5></div>'+tabs+body+'</div>';
 }});

E.reg('d1','parent',{init:{view:'rapor',kid:'aiman'},
 render:function(ui,S){
  var kid=ui.kid,s=S.stu[kid],kids='<div class="pt"><span class="'+(kid==='aiman'?'on':'')+'" data-act="kid" data-id="aiman">Aiman</span><span class="'+(kid==='kirana'?'on':'')+'" data-act="kid" data-id="kirana">Kirana</span><span style="margin-left:auto" class="'+(ui.view==='rapor'?'on':'')+'" data-act="go" data-v="rapor">Rapor</span><span class="'+(ui.view==='iuran'?'on':'')+'" data-act="go" data-v="iuran">Iuran</span></div>';
  var i=E.invOf(kid),body='';
  if(ui.view==='rapor'){
   body='<div class="rp"><table><thead><tr><th style="font-size:12px;text-align:left;border-bottom:2px solid #1d3a6b">Pelajaran</th><th style="font-size:12px;border-bottom:2px solid #1d3a6b">Nilai</th></tr></thead><tbody>'+E.subj(kid).map(function(r){return '<tr><td>'+r[0]+'</td><td class="hand">'+r[1]+'</td></tr>'}).join('')+'<tr><td>Kehadiran</td><td class="hand">'+s.att+'%</td></tr></tbody></table>'+
    '<div style="margin:10px 0 0;font:italic 15px/1.3 Newsreader">“'+(kid==='aiman'?'Aiman makin percaya diri saat presentasi.':'Kirana rajin dan cepat mengenal huruf.')+'”<br><small style="font-style:normal;font-size:12px">— wali kelas</small></div>'+
    '<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center"><span>Iuran<br><small style="font-size:12px">jatuh tempo '+E.dueLabel(i.due)+'</small></span>'+stamp(i,false)+'</div>'+
    (i.status!=='lunas'&&!i.pending?'<div class="sign2" data-act="reqAsk" data-id="'+i.id+'">Lapor sudah bayar</div>':'')+'</div>';
  }else{
   body='<div class="rp">'+E.invs(kid).map(function(v){return '<div style="border-bottom:1px solid #c9d6ea;padding:8px 0"><div style="display:flex;justify-content:space-between"><b>'+v.item+'</b>'+stamp(v,false)+'</div><div>Rp '+E.rp(v.amt)+' · '+E.dueLabel(v.due)+'</div>'+(v.lines?v.lines.map(function(l){return '<small style="display:block;font-size:13px;color:#4a5a7a">'+l[0]+' · '+E.rp(l[1])+'</small>'}).join(''):'')+(v.status!=='lunas'&&!v.pending?'<div class="sign2" data-act="reqAsk" data-id="'+v.id+'">Lapor sudah bayar</div>':'')+'</div>'}).join('')+'</div>';
  }
  return '<div class="ph"><div class="sb"><span>09:41</span><span>●●● 87%</span></div><div class="top"><small>Ibu Nurhayati · 2 anak</small><h5>'+(ui.view==='rapor'?'Buku Rapor':'Buku Iuran')+'<br>'+s.name+'</h5></div>'+kids+body+'</div>';
 }});
})();
