/* Arah 5 · Meja Kasir (prototipe klik) */
(function(){
var E=window.EDU;
function led(S,items){return items.map(function(x){return '<div><small>'+x[0]+'</small><b>'+x[1]+'</b></div>'}).join('')}
function wrap(t,b,f){return '<div class="mdl" data-act="noop0"><div class="mbox"><h4>'+t+'</h4><div class="mb">'+b+'</div><div class="mf">'+f+'</div></div></div>'}
function strukBody(p,S){var s=S.stu[p.stu];return '<div class="rcp"><div class="c">BIMBEL CERDAS</div><div class="c sub">Struk pembayaran · '+p.t+'</div><div class="l"><span>'+s.name+'</span><span>'+s.lv+'</span></div><div class="l"><span>'+p.item+'</span><span>'+E.rp(p.amt)+'</span></div><div class="l tt"><span>TOTAL</span><span>'+E.rp(p.amt)+'</span></div><div class="l"><span>Cara bayar</span><span>'+p.m+'</span></div><div class="c sub">Terima kasih · NobleDev</div></div>'}
function modal(ui,S){
 var m=ui.modal;if(!m)return '';
 if(m.t==='kasPay'){var un=S.inv.filter(function(i){return i.status!=='lunas'});
  return wrap('Catat bayar — pilih nota','<div class="rost">'+(un.map(function(i){var v=E.invState(i);return '<div class="rr hovr" data-act="'+(i.pending?'confirm':'payAsk')+'" data-id="'+i.id+'"><span>'+S.stu[i.stu].name+'<br><small>'+i.item+' · '+v.l+'</small></span><b>'+E.rp(i.amt)+'</b></div>'}).join('')||'Semua nota lunas ✓')+'</div>',E.btn('Tutup','close',{}))}
 if(m.t==='struk'){var p=S.pay[m.i];return wrap('Cetak struk',strukBody(p,S),E.btn('Struk lain','strukNext',{i:m.i})+E.btn('Cetak','toast',{msg:'Struk dikirim ke printer (demo)'},true)+E.btn('Tutup','close',{}))}
 if(m.t==='tutup'){var st=E.stats(),byM={};S.pay.forEach(function(p){byM[p.m]=(byM[p.m]||0)+p.amt});
  return wrap('Tutup kas · rekap hari ini','<div class="rcp"><div class="c">REKAP HARIAN</div><div class="c sub">Jumat, 23 Okt 2026</div><div class="l"><span>Jumlah transaksi</span><span>'+S.pay.length+'</span></div>'+Object.keys(byM).map(function(k){return '<div class="l"><span>'+k+'</span><span>'+E.rp(byM[k])+'</span></div>'}).join('')+'<div class="l tt"><span>TOTAL MASUK</span><span>'+E.rp(st.collected)+'</span></div><div class="l"><span>Masih tertunggak</span><span>'+E.rp(st.unpaidAmt)+'</span></div></div>',E.btn('Kembali','close',{})+E.btn('Tutup kas','toast',{msg:'Kas hari ini ditutup (demo)'},true))}
 return '';
}
function act(a,d,ui,S){
 if(a==='kasPay'){ui.modal={t:'kasPay'};return true}
 if(a==='struk'){ui.modal={t:'struk',i:E.S.pay.length-1};return true}
 if(a==='strukNext'){var n=E.S.pay.length;ui.modal={t:'struk',i:((+d.i)-1+n)%n};return true}
 if(a==='tutup'){ui.modal={t:'tutup'};return true}
 return false;
}
E.reg('d5','admin',{init:{view:'kas'},act:function(a,d,ui){return act(a,d,ui)},modal:function(ui){return modal(ui,E.S)},
 render:function(ui,S){
  var st=E.stats(),nav=[['kas','KAS'],['absen','ABSENSI'],['siswa','SISWA']].map(function(t){return '<span class="'+(ui.view===t[0]?'on':'')+'" data-act="go" data-v="'+t[0]+'">'+t[1]+'</span>'}).join('');
  var ledr='<div class="led">'+led(S,[['MASUK HARI INI',E.rp(st.collected)],['TERTUNGGAK',E.rp(st.unpaidAmt)],['HADIR',st.presentPct+'%']])+'<span class="nbd">Dikembangkan oleh NobleDev</span></div>';
  var main='',right='';
  if(ui.view==='kas'){
   main='<div class="tape scr" data-keep="t"><h5>BIMBEL CERDAS</h5><div class="sub">Pita transaksi · Jumat, 23 Okt 2026</div>'+S.pay.map(function(p,i){return '<div class="ln hovr" data-act="struk" data-i="'+i+'"><time>'+p.t+'</time><span class="n">'+S.stu[p.stu].name+'<small>'+p.item+' · '+p.m+'</small></span><span class="am">'+E.rp(p.amt)+'</span></div>'}).join('')+'<div class="tot"><span>TOTAL MASUK</span><span>'+E.rp(st.collected)+'</span></div></div>';
   right='<div class="rt"><div class="keys"><span class="p" data-act="kasPay">Catat bayar</span><span data-act="invNew">Buat tagihan</span><span data-act="struk">Cetak struk</span><span data-act="remindAll">Kirim pengingat</span><span data-act="go" data-v="absen">Absensi</span><span data-act="tutup">Tutup kas</span></div><div class="nota scr" data-keep="n"><h6>NOTA BELUM LUNAS</h6>'+S.inv.filter(function(i){return i.status!=='lunas'}).sort(function(a,b){return (b.pending?1:0)-(a.pending?1:0)||a.due-b.due}).map(function(i){var v=E.invState(i);return '<div class="it hovr" data-act="'+(i.pending?'confirm':'payAsk')+'" data-id="'+i.id+'"><span>'+(v.k==='lunas'?'':'<mark>')+S.stu[i.stu].name+(v.k==='lunas'?'':'</mark>')+' '+(i.pending?'menunggu':i.due<23?'terlambat':E.dueLabel(i.due))+'</span><b>'+E.rp(i.amt)+'</b></div>'}).join('')+'</div></div>';
  }else if(ui.view==='absen'){
   main='<div class="tape scr" data-keep="t"><h5>ABSENSI HARI INI</h5><div class="sub">Ketuk baris untuk mengisi daftar hadir</div>'+S.corder.map(function(id){var c=S.cls[id],k=E.counts(id);return '<div class="ln hovr" data-act="roster" data-s="'+id+'"><time>'+E.time(c.start)+'</time><span class="n">'+c.name+'<small>'+c.tutor+' · '+c.room+' · '+(S.saved[id]?'tersimpan':'belum disimpan')+'</small></span><span class="am">'+(k.H+k.T)+'/'+k.total+'</span></div>'}).join('')+'</div>';
   right='<div class="rt"><div class="keys"><span data-act="go" data-v="kas">Kembali ke kas</span><span data-act="go" data-v="siswa">Siswa</span></div><div class="nota"><h6>RINGKASAN</h6><div class="it"><span>Hadir hari ini</span><b>'+st.presentPct+'%</b></div><div class="it"><span>Sesi tersimpan</span><b>'+S.corder.filter(function(i){return S.saved[i]}).length+'/'+S.corder.length+'</b></div></div></div>';
  }else{
   main='<div class="tape scr" data-keep="t"><h5>DAFTAR SISWA</h5><div class="sub">128 terdaftar · 11 contoh · ketuk untuk profil</div>'+S.sorder.map(function(id){var s=S.stu[id],v=E.invState(E.invOf(id));return '<div class="ln hovr" data-act="profile" data-id="'+id+'"><time>'+s.lv+'</time><span class="n">'+s.name+'<small>'+s.ortu+'</small></span><span class="am">'+(v.k==='lunas'?'LUNAS':v.k==='menunggu'?'TUNGGU':v.k==='terlambat'?'LEWAT':'BELUM')+'</span></div>'}).join('')+'</div>';
   right='<div class="rt"><div class="keys"><span data-act="go" data-v="kas">Kembali ke kas</span><span data-act="go" data-v="absen">Absensi</span></div></div>';
  }
  return '<div class="dk">'+ledr+main+right+'<div class="knav">'+nav+'</div></div>';
 }});

E.reg('d5','educator',{init:{view:'absen'},
 render:function(ui,S){
  var c=S.cls.mtk5,a=S.att.mtk5||{},k=E.counts('mtk5'),body='';
  var tabs='<div class="ptabs"><span class="'+(ui.view==='absen'?'on':'')+'" data-act="go" data-v="absen">ABSEN</span><span class="'+(ui.view==='nilai'?'on':'')+'" data-act="go" data-v="nilai">NILAI</span></div>';
  if(ui.view==='absen'){
   body='<div class="led2"><div><b>'+k.H+'</b><small>HADIR</small></div><div><b>'+k.T+'</b><small>TELAT</small></div><div><b>'+k.A+'</b><small>ABSEN</small></div><div><b>'+k.I+'</b><small>IZIN</small></div></div><div class="paper"><div class="pt">MATEMATIKA K5 · 23 OKT</div>'+c.roster.map(function(id){var v=a[id];return '<div class="ln"><span class="n" style="flex:1">'+S.stu[id].name+'</span><i class="'+(v==='T'?'t':'')+'" data-act="mark" data-s="mtk5" data-st="'+id+'">'+(v||'?')+'</i></div>'}).join('')+'<div class="ln" data-act="markAll" data-s="mtk5" style="text-decoration:underline;cursor:pointer;border:0"><span>Tandai semua hadir</span></div></div><div class="go" data-act="saveAtt" data-s="mtk5">'+(S.saved.mtk5?'Tersimpan ✓':'Simpan absensi')+'</div>';
  }else{
   var avg=(c.roster.reduce(function(s,id){return s+S.grade.scores[id]},0)/c.roster.length).toFixed(1).replace('.',',');
   body='<div class="led2"><div><b>'+avg+'</b><small>RATA-RATA</small></div><div><b>'+Math.max.apply(null,c.roster.map(function(id){return S.grade.scores[id]}))+'</b><small>TERTINGGI</small></div></div><div class="paper"><div class="pt">'+S.grade.title.toUpperCase()+'</div>'+c.roster.map(function(id){return '<div class="ln"><span class="n" style="flex:1">'+S.stu[id].name.split(' ')[0]+'</span><span class="stp"><b data-act="grade" data-st="'+id+'" data-d="-1">−</b><i>'+S.grade.scores[id]+'</i><b data-act="grade" data-st="'+id+'" data-d="1">+</b></span></div>'}).join('')+'</div><div class="go" data-act="pub">'+(S.grade.published?'Nilai sudah terbit':'Terbitkan nilai')+'</div>';
  }
  return '<div class="ph"><div class="sb"><span>09:41</span><span>●●● 87%</span></div>'+tabs+body+'</div>';
 }});

E.reg('d5','parent',{init:{kid:'aiman',view:'struk'},act:function(a,d,ui){return false},
 render:function(ui,S){
  var kid=ui.kid,s=S.stu[kid],i=E.invOf(kid),v=E.invState(i),kids='<div class="ptabs"><span class="'+(kid==='aiman'?'on':'')+'" data-act="kid" data-id="aiman">AIMAN</span><span class="'+(kid==='kirana'?'on':'')+'" data-act="kid" data-id="kirana">KIRANA</span><span class="'+(ui.view==='riwayat'?'on':'')+'" data-act="go" data-v="riwayat" style="margin-left:auto">RIWAYAT</span></div>';
  var body;
  if(ui.view==='riwayat'){body='<div class="strk"><h6>RIWAYAT TAGIHAN</h6><div class="sub">'+s.name+'</div>'+E.invs(kid).map(function(x){var y=E.invState(x);return '<div class="row"><span>'+x.item+'</span><span>'+E.rp(x.amt)+' '+(y.k==='lunas'?'✓':'')+'</span></div>'}).join('')+'<div class="row" style="margin-top:10px;font-size:12px"><span data-act="go" data-v="struk" style="text-decoration:underline;cursor:pointer">← Kembali ke struk</span></div></div>';}
  else{
   var lines=i.lines||[[i.item,i.amt]];
   body='<div class="strk"><h6>STRUK TAGIHAN</h6><div class="sub">Bimbel Cerdas · '+i.id.toUpperCase()+'</div><div class="row"><span>'+s.name+'</span><span>'+s.lv+'</span></div>'+lines.map(function(l){return '<div class="row"><span>'+l[0]+'</span><span>'+E.rp(l[1])+'</span></div>'}).join('')+'<div class="row tt"><span>TOTAL</span><span>'+E.rp(i.amt)+'</span></div><div style="margin-top:10px;font-size:12px;color:#666">'+(v.k==='lunas'?'<span class="hlt">LUNAS</span> '+(i.method||'')+'':'Jatuh tempo <span class="hlt">'+E.dueLabel(i.due)+' 2026</span> · '+v.l)+'</div></div>'+
    (i.status==='lunas'||i.pending?'<div class="go dis">'+(i.pending?'Menunggu konfirmasi admin':'Tagihan sudah lunas')+'</div>':'<div class="go" data-act="reqAsk" data-id="'+i.id+'">Konfirmasi sudah bayar</div>');
  }
  return '<div class="ph"><div class="sb"><span>09:41</span><span>●●● 87%</span></div>'+kids+body+'</div>';
 }});
})();
