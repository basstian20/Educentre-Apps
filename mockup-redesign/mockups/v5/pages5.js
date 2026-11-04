/* V5: tambahan dasbor untuk C6 (peta panas kehadiran). Membungkus dasbor V4. */
(function(){
var A=window.EduApp,H=A.H,E=window.EDUDATA;
var base=A.pages.dashboard;
function heat(filterCls){
 var start=new Date(2026,8,1),weeks=8,days=['Sen','Sel','Rab','Kam','Jum','Sab'],by={};
 Object.keys(E.D.att).forEach(function(k){var p=k.split('|');if(filterCls&&filterCls.indexOf(p[0])<0)return;var r=E.D.att[k],b=by[p[1]]=by[p[1]]||{a:0,t:0};Object.keys(r).forEach(function(s){b.t++;if(r[s]==='present'||r[s]==='late')b.a++})});
 var cells='',i=0;
 // kolom = pekan, baris = hari (Sen..Sab); 1 Sep 2026 = Selasa
 var mon=new Date(start);mon.setDate(start.getDate()-((start.getDay()+6)%7));
 for(var w=0;w<weeks;w++){for(var d=0;d<6;d++){var dt=new Date(mon.getTime()+(w*7+d)*864e5),key=E.iso(dt),b=by[key],lv=-1,pct=null;
   if(b&&b.t){pct=Math.round(100*b.a/b.t);lv=pct>=95?4:pct>=88?3:pct>=80?2:1}
   cells+='<i class="hc h'+(lv<0?'n':lv)+'" style="--i:'+(i++)+'" title="'+E.fmtDate(key)+(pct!=null?': '+pct+'%':': tidak ada sesi')+'"></i>'}}
 var lab=days.map(function(d){return '<span>'+d+'</span>'}).join('');
 return '<div class="heat"><div class="hl">'+lab+'</div><div class="hg">'+cells+'</div></div><div class="hleg"><span>rendah</span><i class="hc h1"></i><i class="hc h2"></i><i class="hc h3"></i><i class="hc h4"></i><span>tinggi</span></div>';
}
A.pages.dashboard=function(c){
 var r=base(c);
 if((c.S.cls||'')==='th-c6'&&(c.role==='admin'||c.role==='educator')){
  var ids=c.role==='educator'?E.D.classes.filter(function(k){return k.educator===c.edu.id}).map(function(k){return k.id}):null;
  var card='<section class="card dg-heat"><header class="ch"><h3>Peta panas kehadiran</h3><div class="cha">'+H.chip('mut','8 pekan')+'</div></header><div class="cb">'+heat(ids)+'</div></section>';
  var i=r.html.lastIndexOf('</div>');r.html=r.html.slice(0,i)+card+r.html.slice(i);
 }
 return r;
};
})();
