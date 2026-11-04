/* Arah 4 · Kartu Siswa 360 (prototipe klik) */
(function(){
var E=window.EDU;
var COL=['#dcd5ff','#ffd4d9','#d5f5e6','#fff0b8','#ffd4d9','#d5f5e6','#ffd4d9','#dcd5ff','#fff0b8','#ffd4d9','#d5f5e6'];
function tagFor(v){return v.k==='lunas'?'ok':v.k==='terlambat'?'b':v.k==='menunggu'?'ok':'w'}
function last(S,id){return S.grade.scores[id]!=null&&S.grade.published?S.grade.scores[id]:S.stu[id].tr[2]}
function filt(S,f){return S.sorder.filter(function(id){var i=E.invOf(id),v=E.invState(i);
 if(f==='attn')return E.attention(id);if(f==='tung')return v.k!=='lunas';if(f==='hadir')return S.stu[id].att<86;return true})}
function drawer(S,id){
 if(!id){var st=E.stats();return '<div class="dr"><div class="big" style="background:#e6e1ff">360°</div><div><h4>Pilih seorang siswa</h4><small>Ketuk kartu untuk membuka profil lengkap.</small></div><div class="row"><span>Perlu perhatian</span><b>'+filt(S,'attn').length+'</b></div><div class="row"><span>Hadir hari ini</span><b>'+st.presentPct+'%</b></div><div class="row"><span>Belum lunas</span><b>'+E.short(st.unpaidAmt)+'</b></div></div>'}
 var s=S.stu[id],i=E.invOf(id),v=E.invState(i),mk=E.lastMark(id);
 return '<div class="dr"><div class="big" style="background:'+COL[S.sorder.indexOf(id)]+'">'+E.ini(s.name)+'</div><div><h4>'+s.name+'</h4><small>'+s.lv+' · wali: '+s.ortu+'</small></div>'+
  '<div class="row"><span>Kehadiran</span><b>'+s.att+'%</b></div><div class="row"><span>Hari ini</span><b>'+(mk?E.LBL[mk]:'belum dicatat')+'</b></div><div class="row"><span>Nilai terakhir</span><b>'+last(S,id)+'</b></div><div class="row"><span>Tagihan</span><b>Rp '+E.rp(i.amt)+' · '+v.l+'</b></div><div class="row"><span>Tren nilai</span><b>'+s.tr.join(' → ')+'</b></div>'+
  (i.status!=='lunas'?'<div class="cta" data-act="'+(i.pending?'confirm':'payAsk')+'" data-id="'+i.id+'">'+(i.pending?'Konfirmasi pembayaran':'Catat pembayaran')+'</div>'+(i.pending?'':'<div class="cta alt" data-act="remind" data-id="'+i.id+'">'+(i.reminded?'Ingatkan lagi':'Kirim pengingat')+'</div>'):'')+
  '<div class="cta alt" data-act="toast" data-msg="Menghubungi '+s.ortu+' (demo)">Hubungi orang tua</div></div>';
}
E.reg('d4','admin',{init:{view:'siswa',filter:'all',sel:'dimas'},
 render:function(ui,S){
  var st=E.stats(),tabs=[['siswa','Siswa'],['absen','Absensi'],['tagih','Tagihan']].map(function(t){return '<span class="'+(ui.view===t[0]?'on':'')+'" data-act="go" data-v="'+t[0]+'">'+t[1]+'</span>'}).join('');
  var body='',right='';
  if(ui.view==='siswa'){
   var f=ui.filter||'all',list=filt(S,f);
   var chips=[['all','Semua '+st.students],['attn','Perlu perhatian '+filt(S,'attn').length],['tung','Tunggakan '+filt(S,'tung').length],['hadir','Hadir rendah '+filt(S,'hadir').length]].map(function(c){return '<span class="'+(f===c[0]?'on':'')+(c[0]==='attn'?' att':'')+'" data-act="filter" data-f="'+c[0]+'">'+c[1]+'</span>'}).join('');
   body='<div class="ch2">'+chips+'</div><div class="grid scr" data-keep="g">'+list.map(function(id){var s=S.stu[id],i=E.invOf(id),v=E.invState(i),warn=E.attention(id);
    return '<div class="s '+(warn?'warn':'good')+(ui.sel===id?' sel':'')+'" data-act="sel" data-id="'+id+'"><div class="t"><span class="av" style="--c:'+COL[S.sorder.indexOf(id)]+'">'+E.ini(s.name)+'</span><div><b>'+s.name+'</b><small>'+s.lv+'</small></div><span class="ring" style="--p:'+s.att+';--rc:'+(s.att<86?'#ef4565':'#16a870')+'"><i>'+s.att+'</i></span></div><div class="bars">'+s.tr.map(function(h,k){return '<i style="height:'+Math.max(4,((k===2?last(S,id):h)-50)*0.6)+'px"></i>'}).join('')+'</div><span class="tag '+tagFor(v)+'">'+v.l+'</span></div>'}).join('')+'</div>';
   right=drawer(S,ui.sel);
  }else if(ui.view==='absen'){
   body='<div class="grid scr two" data-keep="g">'+S.corder.map(function(id){var c=S.cls[id],k=E.counts(id),pct=k.total-k.n?Math.round(100*(k.H+k.T)/(k.total-k.n)):0,ss=E.sessStatus(id);
    return '<div class="s good" data-act="roster" data-s="'+id+'"><div class="t"><span class="av" style="--c:'+(S.saved[id]?'#d5f5e6':'#fff0b8')+'">'+E.time(c.start).slice(0,2)+'</span><div><b>'+c.name+'</b><small>'+c.tutor+' · '+c.room+'</small></div><span class="ring" style="--p:'+pct+';--rc:#16a870"><i>'+(k.total-k.n?pct:'–')+'</i></span></div><div style="margin-top:10px"><span class="tag '+(S.saved[id]?'ok':ss==='next'?'w':'b')+'">'+(S.saved[id]?'Tersimpan':ss==='next'?'Belum mulai':'Belum disimpan')+'</span></div></div>'}).join('')+'</div>';
   right='<div class="dr"><div class="big" style="background:#d5f5e6">'+st.presentPct+'%</div><div><h4>Kehadiran hari ini</h4><small>Ketuk kartu sesi untuk mengisi absensi.</small></div><div class="row"><span>Sesi hari ini</span><b>'+S.corder.length+'</b></div><div class="row"><span>Tersimpan</span><b>'+S.corder.filter(function(i){return S.saved[i]}).length+'</b></div></div>';
  }else{
   body='<div class="ch2"><span class="on att">Perlu tindakan</span><span data-act="invNew">+ Buat tagihan</span><span data-act="remindAll">Ingatkan yang terlambat</span></div><div class="grid scr two" data-keep="g">'+S.inv.filter(function(i){return i.status!=='lunas'}).sort(function(a,b){return (b.pending?1:0)-(a.pending?1:0)||a.due-b.due}).map(function(i){var s=S.stu[i.stu],v=E.invState(i);
    return '<div class="s '+(v.k==='terlambat'?'warn':'good')+'"><div class="t"><span class="av" style="--c:'+COL[S.sorder.indexOf(i.stu)]+'">'+E.ini(s.name)+'</span><div><b>'+s.name+'</b><small>'+i.item+' · '+E.dueLabel(i.due)+'</small></div></div><div style="margin:8px 0;font:700 18px Outfit">Rp '+E.rp(i.amt)+'</div><span class="tag '+tagFor(v)+'">'+v.l+'</span> <span class="mini" data-act="'+(i.pending?'confirm':'payAsk')+'" data-id="'+i.id+'">'+(i.pending?'Konfirmasi':'Catat bayar')+'</span></div>'}).join('')+'</div>';
   right='<div class="dr"><div class="big" style="background:#ffd4d9">Rp</div><div><h4>Tagihan terbuka</h4><small>'+E.short(st.unpaidAmt)+' belum lunas</small></div><div class="row"><span>Terlambat</span><b>'+st.overdue+'</b></div><div class="row"><span>Menunggu konfirmasi</span><b>'+st.pending+'</b></div><div class="row"><span>Masuk hari ini</span><b>'+E.short(st.collected)+'</b></div></div>';
  }
  return '<div class="dk"><div class="main"><div class="top"><b>EduCentre</b><div class="ch">'+tabs+'</div></div>'+body+'</div>'+right+'<div class="credit">Dikembangkan oleh NobleDev</div></div>';
 }});

E.reg('d4','educator',{init:{view:'absen'},
 render:function(ui,S){
  var c=S.cls.mtk5,a=S.att.mtk5||{},k=E.counts('mtk5'),body='';
  var tabs='<div class="ptabs"><span class="'+(ui.view==='absen'?'on':'')+'" data-act="go" data-v="absen">Absensi</span><span class="'+(ui.view==='nilai'?'on':'')+'" data-act="go" data-v="nilai">Nilai</span></div>';
  if(ui.view==='absen'){
   body='<div class="g2">'+c.roster.map(function(id){var v=a[id];return '<div class="tile '+(v==='T'?'t':v==='A'?'a':v==='I'?'i':v?'':'n')+'" data-act="mark" data-s="mtk5" data-st="'+id+'"><span class="av">'+E.ini(S.stu[id].name)+'</span>'+S.stu[id].name.split(' ')[0]+'<small>'+(v?E.LBL[v]:'Ketuk')+'</small></div>'}).join('')+'</div><div class="save" data-act="saveAtt" data-s="mtk5">'+(S.saved.mtk5?'Tersimpan ✓':'Simpan absensi · '+(k.H+k.T)+' hadir')+'</div>';
  }else{
   body='<div class="g2">'+c.roster.map(function(id){return '<div class="tile n"><span class="av">'+E.ini(S.stu[id].name)+'</span>'+S.stu[id].name.split(' ')[0]+'<div class="stp"><b data-act="grade" data-st="'+id+'" data-d="-1">−</b><i>'+S.grade.scores[id]+'</i><b data-act="grade" data-st="'+id+'" data-d="1">+</b></div></div>'}).join('')+'</div><div class="save" data-act="pub">'+(S.grade.published?'Nilai sudah terbit':'Terbitkan nilai')+'</div>';
  }
  return '<div class="ph"><div class="sb"><span>09:41</span><span>●●● 87%</span></div><div class="hd"><small>Pak Fariz · Matematika K5</small><h5>'+(ui.view==='absen'?'Siapa yang hadir?':'Nilai Ulangan 3')+'</h5></div>'+tabs+'<div class="scr" data-keep="e" style="height:350px">'+body.split('<div class="save"')[0]+'</div><div class="save'+(S.saved.mtk5&&ui.view==='absen'?' done':'')+'"'+body.split('<div class="save"')[1]+'</div>';
 }});

E.reg('d4','parent',{init:{kid:'aiman',view:'home'},
 render:function(ui,S){
  var kid=ui.kid,s=S.stu[kid],invs=E.invs(kid),open=invs.filter(function(i){return i.status!=='lunas'}),sc=S.grade.pub[kid]!=null&&kid==='aiman'?S.grade.pub[kid]:s.tr[2];
  var kids='<div class="kidsw"><span class="'+(kid==='aiman'?'on':'')+'" data-act="kid" data-id="aiman">Aiman</span><span class="'+(kid==='kirana'?'on':'')+'" data-act="kid" data-id="kirana">Kirana</span></div>';
  var hero='<div class="hero"><div class="t"><span class="av">'+E.ini(s.name)+'</span><div><b>'+s.name+'</b><br><small>'+s.lv+'</small></div></div><div class="rings"><div><div class="ring" style="--p:'+s.att+'"><i>'+s.att+'%</i></div>Hadir</div><div><div class="ring" style="--p:'+sc+'"><i>'+sc+'</i></div>Nilai</div><div><div class="ring" style="--p:'+(open.length?50:100)+'"><i>'+open.length+'</i></div>Tagihan</div></div></div>';
  var need=open.map(function(i){var v=E.invState(i);return '<div class="need" data-act="'+(i.pending?'toast':'reqAsk')+'" '+(i.pending?'data-msg="Menunggu konfirmasi admin"':'data-id="'+i.id+'"')+'><b>Perlu perhatian · '+v.l+'</b>'+i.item+' Rp '+E.rp(i.amt)+' · jatuh tempo '+E.dueLabel(i.due)+(i.pending?'':'<span class="pay">Lapor sudah bayar</span>')+'</div>'}).join('')||'<div class="need"><b>Semua tagihan lunas ✓</b>Terima kasih, Ibu.</div>';
  var mk=E.classesOf(kid).map(function(id){var v=(S.att[id]||{})[kid];return S.saved[id]&&v?'<div class="need"><b>Hari ini</b>'+S.cls[id].name+': '+E.LBL[v]+'</div>':''}).join('');
  return '<div class="ph"><div class="sb"><span>09:41</span><span>●●● 87%</span></div><div class="hd"><small>Ibu Nurhayati</small><h5>Aiman &amp; Kirana</h5></div>'+kids+'<div class="scr" data-keep="p" style="height:380px">'+hero+need+mk+(kid==='aiman'&&S.grade.published?'<div class="need"><b>Nilai terbaru</b>'+S.grade.title+': '+S.grade.pub.aiman+'</div>':'')+'</div></div>';
 }});
})();
