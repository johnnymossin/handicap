  var deltager = []; // array af deltagere
  // navn
  // starttid i sekunder
  // sluttid i sekunder
  // tilst: tilstand: 0=init, 10=tæller ned, 20=tæller ned tæt på nul, 30=tæller op, 40=er kommet i mål
  // plads: placering i løbet, 1,2,3,..
  // ny: 1 (sand), hvis det er første gang 'navn' deltager

  var sluttider = []; // array af sluttider, hvor der IKKE er nogen deltager tilknyttet
  // tid : sekunder
  // foto: 'pointer' til foto, i øjeblikket bare tidspunkt for hvornår foto ville være blevet taget.
  var valgt_slut_ix = -1;
  var valgt_delt_ix = -1;
  var retDeltagerIx = -1;
  var indtastTidIx = -1;
  var placering = 0; // første mand i mål har placering=1, osv
  var ct_slut_deltager = 0; // antal slut tider med deltager på
  var last_foto_ms = 0; // sidste gang et foto blev taget
  var naeste_handicap_dato; // ÅÅÅÅ-MM-DD
  
  var timerMsg;
  
  
  var org = []; // record: navn, starttid i sek
  var org_dato = "";
  
  // variable til stopur
  var start_ms = 0;    // millisekunder
  var start_klok = ""; // klokken for start af stopur
  var stopur_status = 0; // 0=stopped, 1=running, 2=auto cycle
  var stopur_elap = 0;   // antal sekunder siden start af stopur
  var stopur_elap_ms = 0;   // antal milli sekunder siden start af stopur
  var timerStopur;
  var timerKlokken;
  var auto_temp = 0;
  
  var fontsize = 2; // start fontsize
  
  // vars til http requests
  var HTTP_Response_holder = null;
  
  // diverse 'konstanter', skal nok gemmes et eller andet sted
  var handicap_ugedag = 3; // onsdag

function init_page() {
  document.getElementById('trc').innerText='init_page';
  init_lob(0);
}

function init_lob(t) {
  saetMsg('init_lob',10);
  if (t == 0) {
    dat = new Date();
  } else {
    dat = new Date(t);
  }
  dd = format_dato(dat);
  ugedag = dat.getDay();
  // find næste handicap dag hvk:onsdag:3
  rel = handicap_ugedag - ugedag;
  if (rel < 0) {rel+= 7}
  naeste_handicap_dato = format_dato(new Date(dat.getTime() + rel *24*60*60*1000));
  saetMsg('h_dato'+naeste_handicap_dato,10);  
  loadOrgData(naeste_handicap_dato);	  
  saetMsg('',0);
  vis_klokken();
  timerKlokken = setInterval(function() {vis_klokken()},2000);
}

// formater dato til ÅÅÅÅ-MM-DD, input: date objekt
function format_dato(d) {
  return d.getFullYear() + "-" + ("0"+(d.getMonth() + 1)).slice(-2) + "-" + ("0"+d.getDate()).slice(-2);
}

function stopur_start(t) {
  document.getElementById('stopur_st').disabled=true;
  document.getElementById('stopur_st').value="started";  
  stopur_status = 2;
  if (t == 0) {
    dat = new Date();
  } else {
    dat = new Date(t);
  }
  start_ms = dat.getTime();
  start_klok = dat.toLocaleTimeString();
  // document.getElementById('startklok').innerText=start_klok.substr(0,8);
  stopur_showauto();
  saetMsg('Startet',5);  
}

function stopur_restart() {
  document.getElementById('stopur_st').disabled=true;
  document.getElementById('stopur_st').value="started";  
  stopur_status = 2;

  stopur_showauto();
}
  
function stopur_stop() {
  document.getElementById('stopur_st').disabled=false;
  document.getElementById('stopur_st').value="start";   
  clearInterval(timerStopur);
  stopur_status = 1; // kører stadig, men ikke auto show
}

function stopur_show() {
  stopur_take_1();
  opdater_tider(); 
}

function stopur_showauto() {  
  stopur_show();
  timerStopur=setInterval(function() {stopur_show()}, 1000); // time is in milliseconds
}

function stopur_take_1() {
  dat = new Date();
  stopur_elap_ms = dat.getTime() - start_ms; // millisekunder siden start af stopur
  stopur_elap = Math.floor(stopur_elap_ms / 1000); // afrund til hele sekunder
}

function vis_klokken() {
  dat = new Date();
  document.getElementById('startklok').innerText=dat.toLocaleTimeString().substr(0,8);
}

function hent_ms() {
  dat = new Date();
  return dat.getTime();
}


// hent data fra dagens start liste
function loadOrgData(dato) {
  HTTP_Response_Holder = new XMLHttpRequest();      
  HTTP_Response_Holder.onload = processOrg ;
  HTTP_Response_Holder.open( "GET", "http://www.johnnymossin.dk//Handicap/Handicap start " + dato + ".csv", true );
  HTTP_Response_Holder.send( null );
}

// csv fil kommer som et langt felt med newline og komma  
function processOrg() {
  if ( HTTP_Response_Holder.readyState = 4 ) { 
	var lin = HTTP_Response_Holder.responseText;
    var lines = lin.split("\n"); // split i linier ved newline
    var ox = 0;
	for (i=0;i<lines.length;i++) {
	  if (lines[i] != "") {
	    var lin1a = lines[i].split(","); // split linie ved ","
	    if (i == 1) {
          org_dato = lin1a[0] // dato i første felt i linie 2
        } else {
          if (lin1a[1].substr(2,1) == ":") { // klokkeslet i andet felt på linien
	        org[ox]={navn:lin1a[0],starttid:m2s(lin1a[1])};
	        ox++;
	      } // :
	    } // if 1
	  } // linie ikke er blank
	} // for
    if (org.length > 0) {
      udfyld_tborg(); // tilføj alle navne og starttider til tborg
    } // org.length
  } // 4
  else {
    alert("HTTP readyState:" + HTTP_Response_Holder.readyState)
  } // else
} // process()             

// add org navn/starttid to tborg
function udfyld_tborg() {
  var tb = document.getElementById('tborg');
  var row;
  var cell1;
  for (var i=0; i < org.length; i++) {
    row = tb.insertRow(tb.rows.length);
    cell1 = row.insertCell(0);
    cell1.innerHTML='<a href="Javascript:foj_til_lob_ix(' + i + ');">' + org[i].navn + '</a>';
	cell1.className="charsize";
    cell1 = row.insertCell(1);
    cell1.innerText=s2m(org[i].starttid);    
    cell1.className="charsize number color_black";
  }  
}


// hent data fra rokort.dk
function loadRokortData() {
  HTTP_Response_Holder = new XMLHttpRequest();
  HTTP_Response_Holder.onreadystatechange = function() {
    if (HTTP_Response_Holder.readyState == 4 && HTTP_Response_Holder.status == 200) {
       // Action to be performed when the document is read;
	   document.getElementById('trc').innerHTML=HTTP_Response_Holder.responseText;
    }
  };  
  HTTP_Response_Holder.open( "GET", "https://rokort.dk/query.php?site=5&id=571de7ecc53da", true );
  HTTP_Response_Holder.send( null );
}

// hent data fra rokort.dk
function loadRokortData2() {
  HTTP_Response_Holder = new XMLHttpRequest();
  HTTP_Response_Holder.onreadystatechange = function() {
    if (HTTP_Response_Holder.readyState == 4 && HTTP_Response_Holder.status == 200) {
       // Action to be performed when the document is read;
	   document.getElementById('msg').innerHTML=HTTP_Response_Holder.responseText;
    }
  };  
  HTTP_Response_Holder.open( "POST", "loadrokortdata.php", true );
  HTTP_Response_Holder.send( null );
}

// Føj deltager til løbet, fra org array
// ix : index i org array
function foj_til_lob_ix(ix) {
  foj_til_lob(org[ix].navn,org[ix].starttid,0);
}

// Føj deltager til løbet
// navn, starttid, ny (1:ny deltager)
function foj_til_lob(n,s,ny) {
  var fundet = 0;
  for (var i=0; i < deltager.length; i++) {
    if (n == deltager[i].navn) {fundet = 1}; // findes allerede i tabellen
  }
  if (!fundet) {
    i = deltager.length;
    deltager[i]={navn:n,starttid:s,plads:0,sluttid:0,tilst:0,ny:ny};
    tilfoj_til_tb_startliste(i);
    sortStarttid();
    opdater_tb_startliste();
  }
}

// gem række i startliste, sidst i tabellen med index i org_ arrays
function tilfoj_til_tb_startliste(ix) {
  var tb = document.getElementById('tb_startliste');
  opret_celler(tb,3);
  update_1_tb_startliste(tb,ix);  
}

// insert række til sidst i html table, med et antal celler
function opret_celler(tb,antal) {
  var row = tb.insertRow(tb.rows.length);
  var celle;
  for (var i=0; i < antal; i++) {
    celle = row.insertCell(i);
  }  
}

// fjern rækker fra html table
function fjern_rækker(tb,antal) {
  for (var i=0; i < antal; i++) {
    row = tb.deleteRow(tb.rows.length-1)
  }  
}

function start_tilfoj_fra_listen() {
  visPopup('fraListen');
}

function start_tilfoj_ny_deltager() {
  visPopup('indtastNy');
  document.getElementById('i_navn').value='';
  document.getElementById('i_start').value='';
  document.getElementById('i_navn').focus();
}
 
// adder navn,startid, indtastet til start listen
function tilfoj_ny_deltager(navn,starttid) {
  foj_til_lob(formaterNavn(navn),m2s(m92m(starttid)),1);
}

// upper første bogstav i hvert del af navn, virker IKKE for æøå
function formaterNavn(n) {
  var names = n.split(" ");
  var nn = "";
  for (i=0;i<names.length;i++) {
    nn += " "+names[i].substr(0,1).toUpperCase()+names[i].substr(1); // uppercase første tegn
  }
  nn=nn.substr(1); // fjern blank i første position
  return nn;
}

function startRetDeltager(ix) {
  if (ix >= deltager.length) {return};
  retDeltagerIx = ix;
  document.getElementById('ret_navn').value=deltager[ix].navn;
  document.getElementById('ret_start').value=m2m9(s2m(deltager[ix].starttid));
  if (deltager[ix].sluttid == 0) {
    document.getElementById('ret_ur').value="";
  } else {
    document.getElementById('ret_ur').value=m2m9(s2m(deltager[ix].sluttid));
  }
  visPopup('retDeltager');
  document.getElementById('ret_ur').focus();
}

function retDeltager(n,s,u) {
  gemPopup('retDeltager');
  i=retDeltagerIx;
  deltager[i].navn=n;
  deltager[i].starttid=m2s(m92m(s));
  if (deltager[i].sluttid != 0) {
    deltager[i].sluttid=m2s(m92m(u));
  }
  sortStarttid();
  opdater_tb_startliste();
  retDeltagerIx = -1; 
}

function retFjernDeltager() {
  fjernDeltager(retDeltagerIx);
}

function fjernDeltager(ix) {
  if ((ix >= 0) && (ix < deltager.length)) {
    deltager.splice(ix,1);
    fjern_rækker(document.getElementById('tb_startliste'),1);
    opdater_tb_startliste();
  }
}

// sorter navn/starttid på placering stigende
function sortPlacering() {
  deltager.sort(function(a,b) {
    if (a.plads > b.plads) return 1;
    if (a.plads < b.plads) return -1;
    return 0;});
}

// sorter navn/starttid på starttid stigende
function sortStarttid() {
  deltager.sort(function(a,b) {
    if (a.starttid > b.starttid) return 1;
    if (a.starttid < b.starttid) return -1;
    if (a.navn < b.navn) return -1;
    return 0;});
}

// 01:20 to 80 sec
function m2s(m) {
  return (Number(m.substr(0,2))*60)+Number(m.substr(3,2));
}

// 80 sec to 01:20
function s2m(s) {
  if (s < 0) { s = 0 - s}; // remove minus sign
  var ss = s % 60;
  var mm = (s - ss) / 60;
  return ("0" + mm).slice(-2) + ":" + ("0" + ss).slice(-2);
}

// 01:20 til 0120 til editering
function m2m9(m) {
  return (m.substr(0,2)+m.substr(3,2));
}

// 0120 til 01:20 efter editering
function m92m(m9) {
  var m = ("0000" + m9).slice(-4);
  return (m.substr(0,2)+":"+m.substr(2,2));
}

function opdater_tider() {
  opdater_tb_startliste();
  saetTekst('elaptime',s2m(stopur_elap));
  //saetTekst('elaptime',stopur_elap_ms);
  saetTekst('imaal',ct_slut_deltager+sluttider.length);
  // saetTekst('tidp',ct_slut_deltager);
  // saetTekst('tidm',sluttider.length);  
  saetTekst('deltagere',deltager.length);
}

// sæt tekst for innerText for Element id
function saetTekst(id,tekst) {
  document.getElementById(id).innerText=tekst;
}

function opdater_tb_startliste() {
  var tb = document.getElementById('tb_startliste');
  for (var i=0; i < deltager.length; i++) {
    update_1_tb_startliste(tb,i);
  }  
}

function update_1_tb_startliste(tb,i) {
  var r = deltager[i].starttid - stopur_elap;
  if ((stopur_status > 0) && (r < 0) && (deltager[i].sluttid == 0)) { 
    tb.rows[i+1].cells[0].innerHTML='<a href="Javascript:set_slut(' + (i) + ',-1);">' + deltager[i].navn + '</a>';
  } else {
    tb.rows[i+1].cells[0].innerText=deltager[i].navn;
  }
  tb.rows[i+1].cells[1].innerHTML='<a href="Javascript:startRetDeltager(' + (i) + ',-1);">'+s2m(deltager[i].starttid)+ '</a>';
  tb.rows[i+1].cells[1].className="charsize number color_black";
  update_1_resttid(tb,i);
//  if (deltager[i].sluttid == 0) {
//    tb.rows[i+1].cells[3].innerText="";
//  } else {
//    tb.rows[i+1].cells[3].innerText=s2m(deltager[i].sluttid-deltager[i].starttid);
//    tb.rows[i+1].cells[3].className="charsize number color_black";
//  }
  // tb.rows[i+1].cells[4].innerHTML='<input type="button" class="smallbutt" onclick="startRetDeltager(' + (i) + ')" value="Ret" />'
  // tb.rows[i+1].cells[4].innerHTML='<input type="button" class="smallbutt" onclick="fjernDeltager(' + (i) + ')" value="Fjern" />'  
}

function update_1_resttid(tb,i) {
    var r = deltager[i].starttid - stopur_elap;
    if (deltager[i].sluttid == 0) {
      tb.rows[i+1].cells[2].innerHTML='<a href="Javascript:startRetDeltager(' + (i) + ',-1);">'+s2m(r)+ '</a>';
//      tb.rows[i+1].cells[2].innerText=s2m(r);
    } else {
      tb.rows[i+1].cells[2].innerHTML='<a href="Javascript:startRetDeltager(' + (i) + ',-1);">'+s2m(deltager[i].sluttid)+ '</a>';
//      tb.rows[i+1].cells[2].innerText=s2m(deltager[i].sluttid);
    }  
    var c = "color_black";    
    if (stopur_status > 0) { // stopur er kørende
      if (deltager[i].sluttid == 0) { // slut ikke sat endnu
        if (r < 0) {c="color_black";}		
        else {
	      if (r < 30) {c="color_red";} 
	      else {c="color_green";}
	    }
	  }
    }
    tb.rows[i+1].cells[0].className="charsize " + c;
    tb.rows[i+1].cells[2].className="charsize number " + c;
}

// dix: index i deltager, evt. -1, hvis ingen deltager
// six: index i sluttider, evt. -1, hvis ny indgang
// kombinationer: 
// -1,-1: ny indgang i sluttider, ingen deltager knyttet, ny tid
// 99,-1: deltager knyttet, ikke ny indgang i sluttider, ny tid
// 99,99: sæt sluttid i deltager til sluttider.tid og fjern tiden i sluttider
function set_slut(dix,six) {

  if (six == -1) { 
    stopur_take_1();
    elap=stopur_elap;
    placering+=1;
    if (dix == -1) { // index for deltager==-1, betyder at tiden ikke er knyttet til en deltager
      // gem tiden i sluttider
      var ig = sluttider.length;
      sluttider[ig]={tid:elap,plads:placering,foto:0};
      take_foto(ig);
    } else { // index i deltager skal have tiden i sluttid
      deltager[dix].sluttid = elap;
      deltager[dix].plads = placering;
      ct_slut_deltager += 1;
    }  
    if (sluttider.length + ct_slut_deltager == deltager.length) {vis_slut()}
  } else { // brug sluttider.tid i deltager.sluttid
	deltager[dix].sluttid = sluttider[six].tid;
	deltager[dix].plads = sluttider[six].plads;
	sluttider.splice(six,1); // fjern indgang i sluttider, nu er den brugt
    ct_slut_deltager += 1;
    vis_slut();
  }
  
  opdater_tider();
}

function take_foto(i) {
  if (stopur_elap_ms - last_foto_ms > 0001) {
    last_foto_ms = stopur_elap_ms;
    sluttider[i].foto = stopur_elap_ms;
  }
}

function vis_slut() {  
  document.getElementById('visslut').style.visibility = "visible";
  // tæl deltagere uden sluttid
  var ikke_slut = 0;
  for (var i=0; i < deltager.length; i++) {if (deltager[i].sluttid == 0) {ikke_slut+=1;}}  

  var row;
  var i;

  var tb = document.getElementById('tbslut1'); // html tabel med split tider 

  // udvid tabellen hvis der ikke er plads
  var tblen= tb.rows.length;
  var nye_r = sluttider.length - (tblen - 1); // måske negativ, hvis der skal slettes
  for (var i=0; i < nye_r; i++) {opret_celler(tb,3)}    
  for (var i=nye_r; i < 0; i++) {tb.deleteRow(tb.rows.length-1)}      
 
  for (var i=0; i < sluttider.length; i++) {
    tb.rows[i+1].cells[0].innerText=i+1;
    tb.rows[i+1].cells[0].className="charsize";
    tb.rows[i+1].cells[1].innerHTML='<a href="Javascript:vaelg_sluttid(' + i + ');">' + s2m(sluttider[i].tid) + '</a>';
    tb.rows[i+1].cells[1].className="charsize";
    tb.rows[i+1].cells[2].innerText=sluttider[i].foto;
    tb.rows[i+1].cells[2].className="charsize";
  }  // for    

  var tb = document.getElementById('tbslut2'); // html tabel med de navne som ikke har en sluttid
  
  // udvid tabellen hvis der ikke er plads
  var tblen= tb.rows.length;
  var nye_r = ikke_slut - (tblen - 1); // måske negativ, hvis der skal slettes
  for (var i=0; i < nye_r; i++) {opret_celler(tb,1)}    
  for (var i=nye_r; i < 0; i++) {row = tb.deleteRow(tb.rows.length-1)}  

  var ix = 0;   
  for (var i=0; i < deltager.length; i++) {
    if (deltager[i].sluttid == 0) { // ingen sluttid for deltager
      ix+=1;
      tb.rows[ix].cells[0].innerHTML='<a href="Javascript:vaelg_delt(' + i + ');">' + deltager[i].navn + '</a>';
      tb.rows[ix].cells[0].className="charsize";

    } // 
  }  // for   
  if (ikke_slut == 0 && sluttider.length == 0) { // hvis der ikke er flere data at vise, så fjern 'visslut'
    document.getElementById('visslut').style.visibility = "hidden";
  }
}

function saet_celle_vaerdier(tb,row) {
  for (var i=2; i < arguments.length; i++) {
    tb.rows[row].cells[i-2].innerHTML=arguments[i];
  }
}

// vælg tid i sluttider[]
function vaelg_sluttid(i) {
  valgt_slut_ix = i;

  if (valgt_delt_ix == -1) {
    vis_valgt_sluttid();
  } else {
    set_slut(valgt_delt_ix,valgt_slut_ix);
    valgt_slut_ix=-1;
    valgt_delt_ix=-1;
    vis_valgt_sluttid();
    vis_valgt_delt();
    vis_slut();
  }  
}

// vælg deltager i deltager[]
function vaelg_delt(i) {
  valgt_delt_ix = i;

  if (valgt_slut_ix == -1) {
    vis_valgt_delt();
  } else {
    set_slut(valgt_delt_ix,valgt_slut_ix);
    valgt_slut_ix=-1;
    valgt_delt_ix=-1;
    vis_valgt_sluttid();
    vis_valgt_delt();
    vis_slut();
  }
}

function vis_valgt_sluttid() {
  if (valgt_slut_ix == -1 ) {
    saetTekst('valgt_sluttid_tx',"");
  } else {
    saetTekst('valgt_sluttid_tx',s2m(sluttider[valgt_slut_ix].tid));
  }  
}

function vis_valgt_delt() {
  if (valgt_delt_ix == -1 ) {
    saetTekst('valgt_delt_tx',"");
  } else {
    saetTekst('valgt_delt_tx',deltager[valgt_delt_ix].navn);
  }  
}

function startIndtastTider() {
  indtastTidIx = 0;
  udfyldIndtastTid(0);
  visPopup('indtastTid');
  document.getElementById('ind_sluttid').focus();
}

function udfyldIndtastTid(ix) {
  if (indtastTidIx + ix < 0)  {return};
  if (indtastTidIx + ix >= deltager.length) {return};
  indtastTidIx = indtastTidIx + ix;
  document.getElementById('ind_navn').innerText=deltager[indtastTidIx].navn;
  if (deltager[indtastTidIx].sluttid == 0) {
    document.getElementById('ind_sluttid').value="";
  } else {
    document.getElementById('ind_sluttid').value=m2m9(s2m(deltager[indtastTidIx].sluttid));
  }
  visPopup('indtastTid');
  document.getElementById('ind_sluttid').focus();
}

function retIndtastTid(t) {
  i=indtastTidIx;
  deltager[i].sluttid=m2s(m92m(t));
  document.getElementById('trc').innerHTML='i=' + i + ', t=' + t;
}

function slutIndtastTider() {
  gemPopup('indtastTid');
  opdater_tb_startliste();  
}

// gem løbet i localstorage
function gemLob() {
  localStorage.setItem("orglen",org.length);
  for (var i=0; i < org.length; i++) {
    item=org[i].navn+','+org[i].starttid;
    localStorage.setItem("org."+i,item);
  }  // for    

  localStorage.setItem("deltagerlen",deltager.length);
  for (var i=0; i < deltager.length; i++) {
    item=deltager[i].navn+','+deltager[i].starttid+','+deltager[i].plads+','+deltager[i].sluttid+','+deltager[i].sluttid+','+deltager[i].tilst+','+deltager[i].ny;
    localStorage.setItem("deltager."+i,item);
  }  // for    

  localStorage.setItem("sluttiderlen",sluttider.length);
  for (var i=0; i < sluttider.length; i++) {
    item=sluttider[i].tid+','+sluttider[i].plads+','+sluttider[i].foto;
    localStorage.setItem("sluttider."+i,item);
  }  // for    
  
  localStorage.setItem("start_ms",start_ms);
  localStorage.setItem("stopur_status",stopur_status);
  localStorage.setItem("org_dato",org_dato);  
  localStorage.setItem("placering",placering);  
  localStorage.setItem("ct_slut_deltager",ct_slut_deltager);  
  saetMsg('Løb gemt',5);  
}

// hent løbet fra localstorage, og sæt i gang igen
function hentLob() {
  document.getElementById('trc').innerHTML=''
  start_ms=Number(localStorage.getItem("start_ms"));
  stopur_status=Number(localStorage.getItem("stopur_status"));
  org_dato=localStorage.getItem("org_dato");
  placering=Number(localStorage.getItem("placering"));
  ct_slut_deltager=Number(localStorage.getItem("ct_slut_deltager"));
  
  var orglen=Number(localStorage.getItem("orglen"));
  for (var i=0; i < orglen; i++) {
    item=localStorage.getItem("org."+i);
    items=item.split(",");
    org[i]={navn:items[0],starttid:Number(items[1])};
  }  // for 

  var deltagerlen=Number(localStorage.getItem("deltagerlen"));
  for (var i=0; i < deltagerlen; i++) {
    item=localStorage.getItem("deltager."+i);
    items=item.split(",");
    deltager[i]={navn:items[0],starttid:Number(items[1]),plads:Number(items[2]),sluttid:Number(items[3]),tilst:items[4],ny:Number(items[5])};
    tilfoj_til_tb_startliste(i); // få styr på antal rows i tb_startliste
  }  // for    

  var sluttiderlen=Number(localStorage.getItem("sluttiderlen"));
  for (var i=0; i < sluttiderlen; i++) {
    item=localStorage.getItem("sluttider."+i);
    items=item.split(",");
    sluttider[i]={tid:Number(items[0]),plads:Number(items[1]),foto:items[2]};
  }  // for    

  udfyld_tborg(); // tilføj alle navne og starttider til tborg     
  stopur_start(start_ms); // restart stopur
  stopur_take_1(); // tag aktuel tid
  sortStarttid(); // sorter på starttid
  opdater_tb_startliste();  // opdater diverse
}

function uploaddata() {
  // make text to send
  sortPlacering();
  var data = "00,"+org_dato+","+start_ms+";";
  for (i=0;i<deltager.length;i++) {
    data+="10,"+deltager[i].navn+","+s2m(deltager[i].starttid)+","+s2m(deltager[i].sluttid)+","+deltager[i].ny+","+deltager[i].plads+";";
  }
        var fd = new FormData();
        fd.append('data', data);

	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'handicapupload.php', true);

	xhr.onload = function() {
      console.log('onload2' + this.responseText);
      saetMsg(this.responseText,5);
	};
	xhr.send(fd);
};
 
function saetMsg(msg,s) {
  // document.getElementById('trc').innerHTML='s:'+s+',msg:'+msg+'.';
  //clearTimeout(timerMsg);
  document.getElementById('msg').innerText=msg;
  if (msg != '' && s > 0) {
    timerMsg = setTimeout(function() {saetMsg('',0)},s*1000); // fjern msg efter s sekunder
  }
} 

function visPopup(id) {
  document.getElementById(id).style.visibility = "visible";
}

function gemPopup(id) {
  document.getElementById(id).style.visibility = "hidden";
}

function setfontsize(sz_chg) {
  fontsize += sz_chg;	
  var elm = document.getElementsByClassName("charsize");
  for (var i=0; i<elm.length; i++){
	elm[i].style.fontSize = ""+fontsize+"em";  
  }
  var elm = document.getElementsByClassName("keyboard");
  for (var i=0; i<elm.length; i++){
	elm[i].style.fontSize = ""+fontsize+"em";  
	elm[i].style.width = ""+(fontsize*24)+"px";  	
	elm[i].style.height = ""+(fontsize*24)+"px";  	
	
  } 
  document.getElementById('trc').innerText=""+(fontsize*24);
}

function setProfil() {
  var cb = document.getElementById("profilCB1");
  var chk = cb.checked;
  document.getElementById('trc').innerText='chk=' + chk;
}
// virtual keyboard
var lineHTML = "";
var caller

function setKeyboardCaller(theCaller)
{
  caller = theCaller;
}

function clearCaller()
{
  caller = null;
}

function nkey(i)
{
  if (caller != null) {
	lineHTML = caller.value;    
    lineHTML += i;
	caller.value = lineHTML;
	caller.focus();
  }
}

function fkey(i)
{
  if (caller != null) {
    if (i == "bs") { // BackSpace
      lineHTML = caller.value;
      lineHTML = lineHTML.slice(0,(lineHTML.length-1)); // remove last character 
    }
    caller.value = lineHTML;
    caller.focus();
  }
}

function ekey()
{
  caller.value = lineHTML;
  clearCaller();
}