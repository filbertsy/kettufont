
javascript:(()=>{
const ID="ad-save-editor-v10-1",HOOK="__adSaveEditorV10_1",PREFIX="AntimatterDimensionsSavefileFormat",SUFFIX="EndOfSavefile",STORE="ad-save-editor-v7-settings";
window.__adSaveEditorV10?.restore?.();
document.getElementById("ad-save-editor-v10")?.remove();
window[HOOK]?.restore?.();
document.getElementById(ID)?.remove();

const defaults={
 title:"antimatter dimensions",
 brandLabel:"save editor",
 subtitle:"developer console Â· v10.1",
 accent:"#c45361",
 rgb:false,
 background:"#111116",
 text:"#eeeeee",
 border:"#34343e",
 width:510,
 opacity:96,
 blur:0,
 font:12,
 radius:14,
 compact:false,
 animations:true,
 speed:100,
 rate:"1e100",
 generator:false,
 amRate:"1e100",
 dtRate:"1e50",
 amGenerator:false,
 dtGenerator:false,
 universalRate:"1e50",
 universalGenerator:false,
 universalCurrency:"antimatter"
};
let settings={...defaults};
try{settings={...settings,...JSON.parse(localStorage.getItem(STORE)||"{}")}}catch(e){}
let data=null,history=[],mini=false,drag=false,search="",paused=false,lastLive="",native=window.GameStorage||null,originalExport=null,wrappedExport=null,poll=null,gainTimer=null,patches=[];

const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const p=document.createElement("div");
p.id=ID;
p.innerHTML=`
<style>
#ad-save-editor-v10{
 position:fixed;z-index:2147483647;top:14px;left:14px;
 width:min(var(--width),calc(100vw - 28px));max-height:84vh;
 background:var(--bg);color:var(--text);border:1px solid var(--border);
 border-radius:var(--radius);box-shadow:0 18px 60px #000b;
 font:var(--font)/1.4 system-ui;overflow:hidden;
 transform-origin:top left;animation:ad7Bloom .38s cubic-bezier(.16,1,.3,1) both;
 backdrop-filter:blur(var(--blur));-webkit-backdrop-filter:blur(var(--blur));
}
#ad-save-editor-v10 *{box-sizing:border-box}
#ad-save-editor-v10 .top{padding:10px 12px;background:linear-gradient(120deg,#20171c,#15151b 65%);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:8px;touch-action:none;user-select:none;cursor:grab}
#ad-save-editor-v10 .brand{font-weight:750;font-size:14px;white-space:nowrap}
#ad-save-editor-v10 .brand span{color:var(--accent)}
#ad-save-editor-v10 .sub{color:#858590;font-size:10px;margin-top:2px}
#ad-save-editor-v10 .topbuttons{display:flex;gap:5px}
#ad-save-editor-v10 .topbuttons button{min-width:36px;min-height:34px;padding:4px;font-size:18px}
#ad-save-editor-v10 button{background:#25252e;color:var(--text);border:1px solid var(--border);border-radius:7px;padding:7px 10px;font:inherit;cursor:pointer;touch-action:manipulation;transition:background calc(160ms * var(--speed)),border-color calc(160ms * var(--speed)),transform calc(160ms * var(--speed))}
#ad-save-editor-v10 button:hover{background:#383843;border-color:var(--accent)}
#ad-save-editor-v10 button:active{transform:scale(.97)}
#ad-save-editor-v10 button.primary{background:var(--accent);border-color:var(--accent);color:white}
#ad-save-editor-v10 button.active{border-color:var(--accent);background:#69313a}
#ad-save-editor-v10 input,#ad-save-editor-v10 textarea,#ad-save-editor-v10 select{background:#191920;color:var(--text);border:1px solid var(--border);border-radius:7px;padding:8px;font:inherit;outline:none;min-width:0}
#ad-save-editor-v10 input:focus,#ad-save-editor-v10 textarea:focus,#ad-save-editor-v10 select:focus{border-color:var(--accent)}
#ad-save-editor-v10 input[type=color]{height:34px;width:48px;padding:3px;cursor:pointer}
#ad-save-editor-v10 input[type=range]{width:100%;accent-color:var(--accent)}
#ad-save-editor-v10 input[type=checkbox]{accent-color:var(--accent);width:17px;height:17px}
#ad-save-editor-v10 .statusbar{padding:7px 12px;display:flex;align-items:center;justify-content:space-between;gap:7px;border-bottom:1px solid var(--border);color:#aaa;font-size:10px}
#ad-save-editor-v10 .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#7bcf91;margin-right:6px}
#ad-save-editor-v10 .tabs{display:flex;gap:4px;padding:8px 10px 0;overflow-x:auto}
#ad-save-editor-v10 .tab{white-space:nowrap;padding:7px 10px;border-radius:7px 7px 0 0;color:#aaa;background:transparent;border-color:transparent}
#ad-save-editor-v10 .tab.active{color:var(--text);background:#202027;border-color:var(--border);border-bottom-color:#202027}
#ad-save-editor-v10 .body{padding:10px;overflow-y:auto;max-height:calc(84vh - 143px);overscroll-behavior:contain}
#ad-save-editor-v10 .panel{display:none}
#ad-save-editor-v10 .panel.active{display:block;animation:ad7Tab calc(230ms * var(--speed)) ease both}
#ad-save-editor-v10 .sectiontitle{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.9px;margin:2px 0 8px}
#ad-save-editor-v10 .cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
#ad-save-editor-v10 .stat{background:#1c1c24;border:1px solid var(--border);border-radius:8px;padding:9px;min-width:0}
#ad-save-editor-v10 .stat small{display:block;color:#92929e;margin-bottom:4px;font-size:10px}
#ad-save-editor-v10 .stat b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}
#ad-save-editor-v10 .actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
#ad-save-editor-v10 .field{display:flex;align-items:center;gap:9px;padding:8px 9px;background:#1b1b22;border:1px solid var(--border);border-radius:8px;margin-bottom:6px}
#ad-save-editor-v10 .fieldname{flex:1;min-width:0}
#ad-save-editor-v10 .fieldname b{display:block;font-size:12px;font-weight:600;overflow-wrap:anywhere}
#ad-save-editor-v10 .fieldname small{display:block;color:#777783;font:9px monospace;margin-top:2px;overflow-wrap:anywhere}
#ad-save-editor-v10 .field input{width:43%;max-width:175px;text-align:right;font-variant-numeric:tabular-nums}
#ad-save-editor-v10 .search{width:100%;margin-bottom:8px}
#ad-save-editor-v10 .group{color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:.8px;margin:11px 2px 6px}
#ad-save-editor-v10 .empty{padding:18px;text-align:center;color:#858590;background:#1a1a21;border-radius:8px}
#ad-save-editor-v10 textarea{width:100%;resize:vertical;font:10px/1.5 monospace}
#ad-save-editor-v10 #rawjson{height:270px;color:#b9e3c3}
#ad-save-editor-v10 #savestring{height:82px}
#ad-save-editor-v10 .hint{color:#858590;font-size:10px;line-height:1.5;margin:7px 1px}
#ad-save-editor-v10 .footer{padding:8px 11px;border-top:1px solid var(--border);display:flex;justify-content:space-between;gap:8px;color:#777783;font-size:9px}
#ad-save-editor-v10 .gainbox,#ad-save-editor-v10 .settingbox{background:#1b1b22;border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:9px}
#ad-save-editor-v10 .gainrate{display:flex;gap:7px;align-items:center;margin:10px 0}
#ad-save-editor-v10 .gainrate input{flex:1;width:60%;font-family:monospace}
#ad-save-editor-v10 .gainstate{display:flex;align-items:center;justify-content:space-between;gap:8px}
#ad-save-editor-v10 .pill{border:1px solid var(--border);border-radius:30px;padding:4px 8px;color:#aaa;font-size:10px}
#ad-save-editor-v10 .setting{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #ffffff10}
#ad-save-editor-v10 .setting:last-child{border-bottom:0}
#ad-save-editor-v10 .setting label{min-width:0;flex:1}
#ad-save-editor-v10 .setting small{display:block;color:#858590;font-size:10px;margin-top:2px}
#ad-save-editor-v10 .setting input[type=text],#ad-save-editor-v10 .setting input[type=number]{width:44%;max-width:180px}
#ad-save-editor-v10 .setting .rangevalue{width:38px;text-align:right;color:#aaa;font-variant-numeric:tabular-nums}
#ad-save-editor-v10.rgb .primary,#ad-save-editor-v10.rgb .brand span,#ad-save-editor-v10.rgb .group{animation:ad7RGB 5s linear infinite}
@keyframes ad7RGB{to{filter:hue-rotate(360deg)}}
@keyframes ad7Bloom{0%{opacity:0;transform:scale(.87);filter:blur(5px)}65%{opacity:1;transform:scale(1.025);filter:blur(0)}100%{opacity:1;transform:scale(1);filter:blur(0)}}
@keyframes ad7Tab{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
#ad-save-editor-v10.noanim *,#ad-save-editor-v10.noanim *:before,#ad-save-editor-v10.noanim *:after{animation:none!important;transition:none!important}
@media(max-width:430px){#ad-save-editor-v10 .body{padding:8px}#ad-save-editor-v10 .field{gap:6px;padding:7px}#ad-save-editor-v10 .field input{width:40%;padding:8px 6px}#ad-save-editor-v10 .top{padding:9px}#ad-save-editor-v10 .tabs{padding-left:8px;padding-right:8px}}
</style>
<div class="top" id="ad-head"><div style="min-width:0"><div class="brand"><b id="customtitle"></b> <span id="custombrandlabel"></span></div><div class="sub" id="customsubtitle"></div></div><div class="topbuttons"><button id="min" title="Minimize">âˆ’</button><button id="close" title="Close">Ã—</button></div></div>
<div id="mainui">
<div class="statusbar"><span><i class="dot"></i><span id="status">Connecting...</span></span><span id="count">No save loaded</span></div>
<div class="tabs">
<button class="tab active" data-tab="editor">Editor</button><button class="tab" data-tab="dev">Dev panel</button><button class="tab" data-tab="currencies">Currencies</button><button class="tab" data-tab="dilation">DT lab</button><button class="tab" data-tab="dashboard">Overview</button><button class="tab" data-tab="json">JSON</button><button class="tab" data-tab="tools">Save tools</button><button class="tab" data-tab="gains">Gains</button><button class="tab" data-tab="settings">Settings</button>
</div>
<div class="body">
<section class="panel active" id="panel-editor"><div class="sectiontitle">Friendly value editor</div><input class="search" id="search" placeholder="Search currencies and values..."><div id="fieldlist"><div class="empty">Waiting for a save to decode.</div></div><div class="actions"><button class="primary" id="applyfields">Apply edits</button><button id="undo">Undo</button><button id="importfields">Import edits</button></div><div class="hint">Edit the textboxes, then Apply edits. Import edits encodes the changes and sends them to the game's native importer.</div></section>
<section class="panel" id="panel-dev">
<div class="sectiontitle">Developer panel Â· save internals</div>
<div class="cards" id="devruntime"><div class="empty">Runtime mechanics appear when the game exposes their APIs.</div></div>
<div class="hint">Live readings are calculated by the game. Editable values below are save properties; changing them edits the decoded copy. Import through Save tools to load them.</div>
<div class="gainbox">
 <b>Property explorer</b>
 <input class="search" id="devsearch" placeholder="Search all fields: production, cost, multiplier, upgrade..." style="margin-top:9px">
 <div class="actions"><select id="devfilter" style="flex:1;min-width:0;background:#191920;color:var(--text);border:1px solid var(--border);border-radius:7px;padding:8px"><option value="all">All numeric properties</option><option value="production">Production / gains</option><option value="cost">Costs / scaling</option><option value="upgrade">Upgrades / unlocks</option><option value="dimension">Dimensions / tickspeed</option></select><button id="devrefresh">Rescan</button></div>
 <div id="devcount" class="hint">Decode a save to inspect its properties.</div>
 <div id="devlist" style="max-height:390px;overflow:auto"><div class="empty">No save loaded.</div></div>
 <div class="actions"><button class="primary" id="devapply">Apply property edits</button><button id="devundo">Undo</button></div>
</div>
<div class="gainbox">
 <b>Direct property editor</b>
 <div class="hint">Use an exact path from the explorer, such as dimensions.normal[0].cost or the path shown beside a field. This writes into the decoded save.</div>
 <div class="gainrate"><input id="devpath" placeholder="player property path (e.g. dimensions.normal...)" style="width:55%"><input id="devvalue" placeholder="new value" style="width:45%"></div>
 <div class="actions"><button class="primary" id="devset">Set property</button><button id="devget">Read property</button></div>
</div>
</section>
<section class="panel" id="panel-dashboard"><div class="sectiontitle">Save overview</div><div class="cards" id="stats"><div class="empty">No save loaded yet.</div></div><div class="actions"><button class="primary" id="dashdecode">Refresh save</button><button id="dashcopy">Copy save</button><button id="dashbackup">Download backup</button></div><div class="hint">The editor monitors the active game save and refreshes decoded data when it changes.</div></section>
<section class="panel" id="panel-json"><div class="sectiontitle">Advanced JSON editor</div><textarea id="rawjson" spellcheck="false" placeholder="Decoded save JSON appears here..."></textarea><div class="actions"><button class="primary" id="applyjson">Apply JSON</button><button id="copyjson">Copy JSON</button><button id="formatjson">Format</button></div><div class="hint">Use this for properties not listed in the friendly editor. Apply JSON before importing.</div></section>
<section class="panel" id="panel-tools"><div class="sectiontitle">Save string</div><textarea id="savestring" spellcheck="false" placeholder="Paste an exported save string..."></textarea><div class="actions"><button class="primary" id="decode">Decode</button><button id="encode">Encode</button><button id="copysave">Copy save</button></div><div class="sectiontitle" style="margin-top:15px">Backup and import</div><div class="actions"><button class="primary" id="importdecoded">Import decoded</button><button id="download">Download backup</button><button id="restore">Restore backup</button><input id="file" type="file" accept=".txt,.json" style="display:none"></div><div class="hint">Importing replaces the active game save. A confirmation is required before import.</div></section>
<section class="panel" id="panel-currencies">
<div class="sectiontitle">Currency manipulation</div>
<div class="gainbox">
 <div class="hint">Choose a currency, select an operation, and apply it to the decoded save. Import the edited save from Save tools when you're ready.</div>
 <div class="setting"><label>Currency<small>Game save value to edit</small></label><select id="currencyselect" style="width:58%;background:#191920;color:var(--text);border:1px solid var(--border);border-radius:7px;padding:8px;font:inherit">
 <option value="antimatter">Antimatter</option><option value="infinityPoints">Infinity Points</option><option value="eternityPoints">Eternity Points</option><option value="timeShards">Time Shards</option><option value="dilation.tachyonParticles">Tachyon Particles</option><option value="dilation.dilatedTime">Dilated Time</option><option value="reality.realityMachines">Reality Machines</option><option value="reality.imaginaryMachines">Imaginary Machines</option><option value="celestials.laitela.darkMatter">Dark Matter</option><option value="celestials.pelle.realityShards">Reality Shards</option>
 </select></div>
 <div class="stat" style="margin:9px 0"><small>Current decoded value</small><b id="currencycurrent">Decode a save first</b></div>
 <div class="setting"><label>Operation<small>How to change the value</small></label><select id="currencyoperation" style="width:58%;background:#191920;color:var(--text);border:1px solid var(--border);border-radius:7px;padding:8px;font:inherit"><option value="set">Set to</option><option value="add">Add</option><option value="subtract">Subtract</option><option value="multiply">Multiply by</option></select></div>
 <div class="gainrate"><input id="currencyamount" value="1e100" placeholder="Enter amount (e.g. 1e100)"><button class="primary" id="applycurrency">Apply</button></div>
 <div class="actions"><button id="currencyrefresh">Refresh value</button><button id="currencymax">Set to 1e100</button><button id="currencyundo">Undo</button></div>
</div>
<div class="hint">Edits are made in the editor's decoded copy first. They do not affect the live game until you import the edited save.</div>
</section>
<section class="panel" id="panel-dilation">
<div class="sectiontitle">Dilation controls Â· DT</div>
<div class="gainbox">
 <div class="gainstate"><b>Dilated Time</b><span class="pill" id="dtstate">SAVE DATA</span></div>
 <div class="cards" style="margin:10px 0"><div class="stat"><small>Current DT</small><b id="dtcurrent">â€”</b></div><div class="stat"><small>Tachyon Particles</small><b id="tpcurrent">â€”</b></div></div>
 <div class="gainrate"><input id="dtamount" value="1e100" placeholder="DT amount"><button class="primary" id="dtadd">Add DT</button></div>
 <div class="actions"><button id="dtset">Set DT</button><button id="dtmultiply">Multiply DT Ã—2</button><button id="dtzero">Set DT to 0</button></div>
 <div class="hint">These actions edit the decoded save. Use Save tools â†’ Import decoded to apply them to the game.</div>
</div>
<div class="gainbox">
 <b>Tachyon Particles</b>
 <div class="gainrate"><input id="tpamount" value="1e50" placeholder="Tachyon Particle amount"><button class="primary" id="tpset">Set TP</button></div>
 <div class="actions"><button id="tpadd">Add TP</button><button id="tpmultiply">Multiply TP Ã—2</button></div>
</div>
</section>
<section class="panel" id="panel-gains"><div class="sectiontitle">Production controls</div>
<div class="gainbox"><div class="gainstate"><b>Antimatter / second</b><span class="pill" id="genstate">OFF</span></div><div class="hint">Adds a fixed Antimatter amount per second, independently of Dimension production.</div><div class="gainrate"><input id="rate" value="${esc(settings.amRate||settings.rate)}" placeholder="e.g. 1e100"><button class="primary" id="saverate">Save rate</button></div><div class="actions"><button class="primary" id="gentoggle">Enable generator</button></div></div>
<div class="gainbox"><div class="gainstate"><b>Dilated Time / second</b><span class="pill" id="dtgenstate">OFF</span></div><div class="hint">Adds Dilated Time continuously through the game's currency API.</div><div class="gainrate"><input id="dtrate" value="${esc(settings.dtRate)}" placeholder="e.g. 1e50"><button class="primary" id="savedtrate">Save rate</button></div><div class="actions"><button class="primary" id="dtgentoggle">Enable DT generator</button></div></div>
<div class="gainbox"><div class="gainstate"><b>Universal currency / second</b><span class="pill" id="unigenstate">OFF</span></div><div class="hint">Choose any supported currency exposed by the game's Currency API and add a fixed amount every second.</div><div class="gainrate"><select id="unicur" style="flex:1;background:#191920;color:var(--text);border:1px solid var(--border);border-radius:7px;padding:8px"><option value="antimatter">Antimatter</option><option value="infinityPoints">Infinity Points</option><option value="eternityPoints">Eternity Points</option><option value="timeShards">Time Shards</option><option value="tachyonParticles">Tachyon Particles</option><option value="dilatedTime">Dilated Time</option><option value="realityMachines">Reality Machines</option><option value="imaginaryMachines">Imaginary Machines</option><option value="darkMatter">Dark Matter</option><option value="realityShards">Reality Shards</option></select></div><div class="gainrate"><input id="unirate" value="${esc(settings.universalRate)}" placeholder="e.g. 1e100"><button class="primary" id="unisaverate">Save rate</button></div><div class="actions"><button class="primary" id="unitoggle">Enable universal generator</button></div></div>
<div class="gainbox"><div class="gainstate"><b>Pause currency gains</b><span class="pill" id="pausestate">RUNNING</span></div><div class="hint">Blocks intercepted Currency.add calls while paused. It does not freeze game timers or every possible gain source.</div><div class="actions"><button id="pausetoggle">Pause gains</button></div></div></section>
<section class="panel" id="panel-settings">
<div class="sectiontitle">Interface customization</div>
<div class="settingbox">
<div class="setting"><label>Editor name<small>Main heading</small></label><input type="text" data-setting="title"></div>
<div class="setting"><label>Subtitle<small>Text below the heading</small></label><input type="text" data-setting="subtitle"></div>
<div class="setting"><label>Accent color<small>Buttons, highlights and active tabs</small></label><input type="color" data-setting="accent"></div>
<div class="setting"><label>RGB mode<small>Animated rainbow accents</small></label><input type="checkbox" data-setting="rgb"></div>
<div class="setting"><label>Background color<small>Main window background</small></label><input type="color" data-setting="background"></div>
<div class="setting"><label>Text color<small>Main interface text</small></label><input type="color" data-setting="text"></div>
<div class="setting"><label>Border color<small>Window and input outlines</small></label><input type="color" data-setting="border"></div>
<div class="setting"><label>Window width<small>400â€“700 pixels</small></label><input type="range" min="400" max="700" step="5" data-setting="width"><span class="rangevalue" data-value="width"></span></div>
<div class="setting"><label>Opacity<small>Panel transparency</small></label><input type="range" min="65" max="100" data-setting="opacity"><span class="rangevalue" data-value="opacity"></span></div>
<div class="setting"><label>Background blur<small>Glass-style backdrop, 0â€“20px</small></label><input type="range" min="0" max="20" data-setting="blur"><span class="rangevalue" data-value="blur"></span></div>
<div class="setting"><label>Font size<small>Overall interface text</small></label><input type="range" min="10" max="16" data-setting="font"><span class="rangevalue" data-value="font"></span></div>
<div class="setting"><label>Corner radius<small>Window roundness</small></label><input type="range" min="4" max="28" data-setting="radius"><span class="rangevalue" data-value="radius"></span></div>
<div class="setting"><label>Compact mode<small>Reduce spacing and padding</small></label><input type="checkbox" data-setting="compact"></div>
<div class="setting"><label>Animations<small>Enable interface transitions</small></label><input type="checkbox" data-setting="animations"></div>
<div class="setting"><label>Animation speed<small>50% slow Â· 100% normal Â· 200% fast</small></label><input type="range" min="50" max="200" step="10" data-setting="speed"><span class="rangevalue" data-value="speed"></span></div>
<div class="actions"><button class="primary" id="resetsettings">Reset customization</button></div>
<div class="hint">Settings save automatically in this browser. They change the editor's appearance, not your Antimatter Dimensions save.</div>
</div>
</section>
</div>
<div class="footer"><span>local developer panel</span><span id="footerstatus">ready</span></div>
</div>`;

document.body.appendChild(p);
const $=id=>p.querySelector("#"+id);
const say=(s,ok=false)=>{$("status").textContent=s;$("footerstatus").textContent=s;$("status").style.color=ok?"#8cda9d":"#e5a0a0"};
const persist=()=>{try{localStorage.setItem(STORE,JSON.stringify(settings))}catch(e){say("Could not save settings")}};
function hexToRgba(hex,alpha){const h=hex.replace("#","");const n=parseInt(h.length===3?h.split("").map(x=>x+x).join(""):h,16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${alpha})`}
function applySettings(){
 p.style.setProperty("--width",settings.width+"px");
 p.style.setProperty("--bg",hexToRgba(settings.background,settings.opacity/100));
 p.style.setProperty("--text",settings.text);
 p.style.setProperty("--border",settings.border);
 p.style.setProperty("--accent",settings.accent);
 p.style.setProperty("--radius",settings.radius+"px");
 p.style.setProperty("--font",settings.font+"px");
 p.style.setProperty("--blur",settings.blur+"px");
 p.style.setProperty("--speed",settings.speed/100);
 p.classList.toggle("rgb",!!settings.rgb);
 p.classList.toggle("noanim",!settings.animations);
 p.style.setProperty("--compact",settings.compact?"1":"0");
 p.querySelector(".body").style.padding=settings.compact?"6px":"10px";
 p.querySelectorAll(".field").forEach(x=>x.style.padding=settings.compact?"5px 7px":"8px 9px");
 $("customtitle").textContent=settings.title;
 $("customsubtitle").textContent=settings.subtitle;
 p.querySelectorAll("[data-setting]").forEach(el=>{
  const k=el.dataset.setting;
  if(el.type==="checkbox")el.checked=!!settings[k];
  else el.value=settings[k];
 });
 p.querySelectorAll("[data-value]").forEach(el=>el.textContent=settings[el.dataset.value]+(el.dataset.value==="opacity"||el.dataset.value==="speed"?"%":el.dataset.value==="blur"||el.dataset.value==="radius"?"px":el.dataset.value==="font"?"px":""));
}
p.querySelectorAll("[data-setting]").forEach(el=>{
 const update=()=>{
  const k=el.dataset.setting;
  settings[k]=el.type==="checkbox"?el.checked:el.type==="range"?Number(el.value):el.value;
  persist();applySettings();
 };
 el.addEventListener("input",update);
 el.addEventListener("change",update);
});
$("resetsettings").onclick=()=>{if(!confirm("Reset all 16 appearance settings to their defaults?"))return;settings={...defaults,rate:settings.rate,generator:settings.generator};persist();applySettings();say("Customization reset",true)};
applySettings();

const getPath=(o,path)=>path.split(".").reduce((v,k)=>v==null?undefined:v[k],o);
const setPath=(o,path,value)=>{const a=path.split(".");let t=o;for(let i=0;i<a.length-1;i++){if(!t[a[i]]||typeof t[a[i]]!=="object")return false;t=t[a[i]]}const k=a[a.length-1],old=t[k];t[k]=typeof old==="number"?Number(value):String(value);return true};
const formatName=k=>k.replace(/([a-z])([A-Z])/g,"$1 $2").replace(/[_-]/g," ").replace(/\b\w/g,c=>c.toUpperCase());

function normalizePath(path){return String(path).replace(/\[(\d+)\]/g,".$1").replace(/^\./,"")}
function getAnyPath(o,path){return normalizePath(path).split(".").reduce((v,k)=>v==null?undefined:v[k],o)}
function setAnyPath(o,path,value){const parts=normalizePath(path).split(".");let t=o;for(let i=0;i<parts.length-1;i++){if(t==null||!(parts[i] in Object(t)))return false;t=t[parts[i]]}if(t==null)return false;const k=parts.at(-1),old=t[k];if(typeof old==="number"){const n=Number(value);if(!Number.isFinite(n))return false;t[k]=n}else if(typeof old==="boolean"){if(!/^(true|false)$/i.test(String(value)))return false;t[k]=String(value).toLowerCase()==="true"}else if(old===null){t[k]=value==="null"?null:String(value)}else t[k]=String(value);return true}
function classifyPath(path){const x=path.toLowerCase();if(/production|persecond|gain|rate|multiplier|power|effect/.test(x))return"production";if(/cost|price|scal|threshold|requirement/.test(x))return"cost";if(/upgrade|unlock|achievement|study|challenge|perk|bought/.test(x))return"upgrade";if(/dimension|tickspeed|galaxy/.test(x))return"dimension";return"all"}
function deepProperties(){
 if(!data)return[];const out=[];const seen=new WeakSet();
 function walk(v,path,depth){if(out.length>=3500||depth>14||v===null)return;if(typeof v==="number"||typeof v==="string"&&/^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(v)||typeof v==="boolean"){if(path)out.push({path,value:v,type:typeof v});return}if(typeof v!=="object"||seen.has(v))return;seen.add(v);if(Array.isArray(v)){for(let i=0;i<v.length;i++)walk(v[i],path+"["+i+"]",depth+1);return}for(const [k,x] of Object.entries(v)){if(k.startsWith("_")||k==="automator"&&depth>5)continue;walk(x,path?path+"."+k:k,depth+1)}}
 walk(data,"",0);return out;
}
function renderDev(){
 const all=deepProperties(),q=($("devsearch").value||"").toLowerCase(),filter=$("devfilter").value;
 const shown=all.filter(x=>{const c=classifyPath(x.path);return(filter==="all"||c===filter)&&(x.path.toLowerCase().includes(q)||String(x.value).toLowerCase().includes(q))}).slice(0,450);
 $("devcount").textContent=`${all.length} numeric / boolean properties found Â· showing ${shown.length}`;
 if(!shown.length){$("devlist").innerHTML='<div class="empty">No matching properties.</div>';return}
 let html="",last="";for(const f of shown){const group=classifyPath(f.path);if(group!==last){last=group;html+=`<div class="group">${esc(group==="all"?"Other properties":group)}</div>`}html+=`<div class="field"><div class="fieldname"><b>${esc(f.path.split(/[.\[]/).pop())}</b><small>${esc(f.path)} Â· ${f.type}</small></div><input data-devpath="${esc(f.path)}" value="${esc(f.value)}" inputmode="${f.type==="boolean"?"text":"decimal"}"></div>`}
 $("devlist").innerHTML=html;
}
function runtimeReadings(){
 const out=[];const fmt=v=>{try{if(v==null)return"â€”";if(typeof v==="object"&&typeof v.toString==="function")return v.toString();return String(v)}catch(e){return"unavailable"}};
 const C=window.Currency;
 for(const [key,label] of [["antimatter","Antimatter"],["infinityPoints","Infinity Points"],["eternityPoints","Eternity Points"],["dilatedTime","Dilated Time"]]){try{const c=C?.[key];if(!c)continue;const value=fmt(c.value??c.amount);let rate="â€”";try{rate=fmt(c.productionPerSecond)}catch(e){}out.push({label,value,rate})}catch(e){}}
 try{const AD=window.AntimatterDimension;if(typeof AD==="function"){for(let i=1;i<=8;i++){try{const d=AD(i);out.push({label:`Dimension ${i}`,value:`amount ${fmt(d.amount?.value??d.amount)} Â· cost ${fmt(d.cost)}`,rate:fmt(d.productionPerSecond)});}catch(e){}}}}catch(e){}
 const costs=[];try{const root=window.GameDatabase;if(root){const seen=new WeakSet();function scan(v,path,depth){if(!v||typeof v!=="object"||depth>5||seen.has(v)||costs.length>=36)return;seen.add(v);for(const [k,x] of Object.entries(v)){const next=path?path+"."+k:k;if(/cost/i.test(k)&&(typeof x==="number"||typeof x==="string"||x&&typeof x.toString==="function")){costs.push({label:next,value:fmt(x)});continue}if(x&&typeof x==="object")scan(x,next,depth+1)}}scan(root,"GameDatabase",0)}}catch(e){}
 if(costs.length)out.push(...costs.map(x=>({label:"Upgrade cost Â· "+x.label,value:x.value,rate:"catalog value; may be a base cost"})));
 $("devruntime").innerHTML=out.length?out.map(x=>`<div class="stat"><small>${esc(x.label)}</small><b>${esc(x.value)}</b><small>${esc(x.rate)}</small></div>`).join(""):'<div class="empty">Runtime APIs are not exposed on this game build. Save-property explorer remains available.</div>';
}
const fields=[["antimatter","Antimatter","Main"],["infinityPoints","Infinity Points","Main"],["eternityPoints","Eternity Points","Main"],["timeShards","Time Shards","Main"],["dilation.tachyonParticles","Tachyon Particles","Dilation"],["dilation.dilatedTime","Dilated Time","Dilation"],["reality.realityMachines","Reality Machines","Reality"],["reality.imaginaryMachines","Imaginary Machines","Reality"],["celestials.laitela.darkMatter","Dark Matter","Celestials"],["celestials.pelle.realityShards","Reality Shards","Celestials"]];

function collect(){
 if(!data)return[];
 const out=[],seen=new Set();
 for(const[path,label,group]of fields){const v=getPath(data,path);if(v!==undefined&&(typeof v==="string"||typeof v==="number")){out.push({path,label,group,value:v});seen.add(path)}}
 function walk(o,path,depth){
  if(!o||typeof o!=="object"||Array.isArray(o)||depth>7||out.length>=260)return;
  for(const[k,v]of Object.entries(o)){
   const next=path?path+"."+k:k;
   if(Array.isArray(v))continue;
   if(v&&typeof v==="object"){walk(v,next,depth+1);continue}
   if(seen.has(next))continue;
   if((typeof v==="string"||typeof v==="number")&&v!==""&&/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(String(v))){out.push({path:next,label:formatName(k),group:"Other",value:v});seen.add(next)}
  }
 }
 walk(data,"",0);return out;
}
function renderFields(){
 const all=collect(),q=search.toLowerCase(),shown=all.filter(f=>(f.label+" "+f.path+" "+f.group).toLowerCase().includes(q));
 $("count").textContent=data?all.length+" fields":"No save loaded";
 if(!shown.length){$("fieldlist").innerHTML=`<div class="empty">${data?"No matching fields.":"Decode a save to load editable fields."}</div>`;return}
 let html="",last="";
 for(const f of shown){if(f.group!==last){last=f.group;html+=`<div class="group">${esc(last)}</div>`}html+=`<div class="field"><div class="fieldname"><b>${esc(f.label)}</b><small>${esc(f.path)}</small></div><input data-path="${esc(f.path)}" value="${esc(f.value)}" inputmode="decimal"></div>`}
 $("fieldlist").innerHTML=html;
}
function renderStats(){
 if(!data){$("stats").innerHTML='<div class="empty">No save loaded yet.</div>';return}
 const vals=fields.slice(0,6).map(([path,label])=>({label,value:getPath(data,path)})).filter(x=>x.value!==undefined);
 $("stats").innerHTML=vals.length?vals.map(x=>`<div class="stat"><small>${esc(x.label)}</small><b>${esc(x.value)}</b></div>`).join(""):'<div class="empty">No known currencies found.</div>';
}
function syncJSON(){if(data)$("rawjson").value=JSON.stringify(data,null,2)}
function snapshot(){if(data){history.push(JSON.stringify(data));if(history.length>30)history.shift()}}
function refresh(){renderFields();renderStats();syncJSON();renderCurrencyPanels();renderDev();runtimeReadings()}
const currencyPaths=["antimatter","infinityPoints","eternityPoints","timeShards","dilation.tachyonParticles","dilation.dilatedTime","reality.realityMachines","reality.imaginaryMachines","celestials.laitela.darkMatter","celestials.pelle.realityShards"];
function renderCurrencyPanels(){
 const select=$("currencyselect"),previous=select.value;
 const discovered=data?deepProperties().filter(x=>/(currency|antimatter|infinitypoints|eternitypoints|timeShards|tachyon|dilatedtime|machines|darkmatter|realityshards|particles|quarks|dust|essence|relic|memories|matter)/i.test(x.path)):[];
 const paths=new Map(currencyPaths.map(path=>[path,formatName(path.split(".").pop())]));
 for(const item of discovered)if(!paths.has(normalizePath(item.path)))paths.set(normalizePath(item.path),formatName(item.path.split(/[.\[]/).pop()));
 select.innerHTML=[...paths].filter(([path])=>!data||getAnyPath(data,path)!==undefined).map(([path,label])=>`<option value="${esc(path)}">${esc(label)} Â· ${esc(path)}</option>`).join("");
 if([...select.options].some(o=>o.value===previous))select.value=previous;
 const path=select.value;
 $("currencycurrent").textContent=data?String(getAnyPath(data,path)??"Not present"):"Decode a save first";
 $("dtcurrent").textContent=data?String(getPath(data,"dilation.dilatedTime")??"Not present"):"â€”";
 $("tpcurrent").textContent=data?String(getPath(data,"dilation.tachyonParticles")??"Not present"):"â€”";
}
function decimalValue(v){
 const D=window.Decimal;
 const raw=String(v).trim();
 if(!D)throw Error("Game Decimal library is unavailable. Open the game before using currency operations.");
 if(!/^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw))throw Error("Enter a valid number, such as 250 or 1e100");
 let n;
 try{n=new D(raw)}catch(e){throw Error("The game could not parse that number")}
 const normalized=String(n);
 if(!/^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized))throw Error("Invalid number");
 return n;
}
function editCurrency(path,operation,amount){
 if(!data)throw Error("Decode a save first");
 const old=getPath(data,path);
 if(old===undefined)throw Error("This currency is not present in the decoded save");
 const current=decimalValue(old),value=decimalValue(amount);
 if(value.lt(0))throw Error("Enter a non-negative amount");
 let result;
 if(operation==="set")result=value;
 else if(operation==="add")result=current.plus(value);
 else if(operation==="subtract")result=current.minus(value);
 else if(operation==="multiply")result=current.times(value);
 else throw Error("Unknown operation");
 snapshot();
 if(!setPath(data,path,result.toString()))throw Error("Could not update this save path");
 refresh();say("Currency updated in decoded save",true);
}

async function loadPako(){
 if(window.pako)return window.pako;
 await new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js";s.onload=resolve;s.onerror=()=>reject(Error("Could not load compression library"));document.head.appendChild(s)});
 if(!window.pako)throw Error("Compression library unavailable");
 return window.pako;
}
function decodeSave(v,z){
 v=v.trim();
 if(!v.startsWith(PREFIX))throw Error("Unrecognized save format");
 let b=v.slice(PREFIX.length+3);
 if(!b.endsWith(SUFFIX))throw Error("Save ending is missing");
 b=b.slice(0,-SUFFIX.length).replace(/0b/g,"+").replace(/0c/g,"/").replace(/0a/g,"0");
 return z.inflate(Uint8Array.from(atob(b),c=>c.charCodeAt(0)),{to:"string"});
}
function encodeSave(v,z){
 const c=z.deflate(new TextEncoder().encode(v));let b="";
 for(let i=0;i<c.length;i+=32768)b+=String.fromCharCode(...c.subarray(i,i+32768));
 return PREFIX+"AAB"+btoa(b).replace(/=+$/g,"").replace(/0/g,"0a").replace(/\+/g,"0b").replace(/\//g,"0c")+SUFFIX;
}
async function decodeCurrent(){
 try{
  const z=await loadPako(),parsed=JSON.parse(decodeSave($("savestring").value,z));
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error("Save JSON is not an object");
  snapshot();data=parsed;refresh();say("Save decoded successfully",true);return true;
 }catch(e){say("Decode failed: "+e.message);return false}
}
async function acceptLiveSave(v){
 if(typeof v!=="string"||!v||v===lastLive)return;
 lastLive=v;$("savestring").value=v;
 try{
  const z=await loadPako(),parsed=JSON.parse(decodeSave(v,z));
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))return;
  data=parsed;refresh();say("Live save synchronized",true);
 }catch(e){say("Live decode: "+e.message)}
}
async function encodeCurrent(){
 try{if(!data)throw Error("Decode a save first");const z=await loadPako(),out=encodeSave(JSON.stringify(data),z);$("savestring").value=out;lastLive=out;say("Save encoded successfully",true);return out}
 catch(e){say("Encode failed: "+e.message);return null}
}
async function copyText(v){
 if(!v)return say("Nothing to copy");
 try{await navigator.clipboard.writeText(v);say("Copied to clipboard",true)}
 catch(e){const a=document.createElement("textarea");a.value=v;document.body.appendChild(a);a.select();say("Text selected. Copy manually.");setTimeout(()=>a.remove(),1200)}
}
function downloadBackup(){
 const v=data?JSON.stringify(data,null,2):$("savestring").value.trim();if(!v)return say("No save data available");
 const url=URL.createObjectURL(new Blob([v],{type:"text/plain"})),a=document.createElement("a");
 a.href=url;a.download=data?"antimatter-dimensions-save-backup.json":"antimatter-dimensions-save-backup.txt";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);say("Backup downloaded",true);
}
function applyFields(){
 if(!data){say("Decode a save first");return false}
 const inputs=[...$("fieldlist").querySelectorAll("input[data-path]")];
 for(const input of inputs){if(!/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(input.value.trim())){say("Invalid number: "+input.dataset.path);return false}}
 snapshot();for(const input of inputs)setPath(data,input.dataset.path,input.value.trim());
 refresh();say("Field edits applied",true);return true;
}
function applyJSON(){
 try{const parsed=JSON.parse($("rawjson").value);if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error("JSON must be an object");snapshot();data=parsed;refresh();say("JSON changes applied",true);return true}
 catch(e){say("Invalid JSON: "+e.message);return false}
}
function undo(){if(!history.length)return say("Nothing to undo");try{data=JSON.parse(history.pop());refresh();say("Previous state restored",true)}catch(e){say("Undo failed")}}
async function importDecoded(){
 try{
  if(!data)throw Error("Decode a save first");
  const parsed=JSON.parse($("rawjson").value);
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error("JSON must be an object");
  if(!confirm("Import this edited save? Your current game progress will be replaced."))return;
  const z=await loadPako(),encoded=encodeSave(JSON.stringify(parsed),z);
  if(!native||typeof native.import!=="function")throw Error("Game native importer unavailable");
  $("savestring").value=encoded;lastLive=encoded;native.import(encoded);data=parsed;refresh();say("Save sent to native importer",true);
 }catch(e){say("Import failed: "+e.message)}
}

function tab(name){
 p.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
 p.querySelectorAll(".panel").forEach(b=>b.classList.toggle("active",b.id==="panel-"+name));
}
p.querySelectorAll(".tab").forEach(b=>b.onclick=()=>tab(b.dataset.tab));
$("search").oninput=e=>{search=e.target.value;renderFields()};
$("devsearch").oninput=renderDev;$("devfilter").onchange=renderDev;$("devrefresh").onclick=()=>{renderDev();runtimeReadings()};
$("devapply").onclick=()=>{if(!data)return say("Decode a save first");const inputs=[...$("devlist").querySelectorAll("input[data-devpath]")];for(const el of inputs){const old=getAnyPath(data,el.dataset.devpath);if(typeof old==="number"&&!Number.isFinite(Number(el.value))){say("Invalid numeric value: "+el.dataset.devpath);return}if(typeof old==="boolean"&&!/^(true|false)$/i.test(el.value)){say("Boolean values must be true or false: "+el.dataset.devpath);return}}snapshot();for(const el of inputs)if(!setAnyPath(data,el.dataset.devpath,el.value)){say("Could not write: "+el.dataset.devpath);return}refresh();say("Developer property edits applied to decoded save",true)};
$("devundo").onclick=undo;
$("devset").onclick=()=>{if(!data)return say("Decode a save first");const path=$("devpath").value.trim();if(!path)return say("Enter a property path");if(getAnyPath(data,path)===undefined)return say("Property path not found");snapshot();if(!setAnyPath(data,path,$("devvalue").value)){say("Invalid value for this property type");return}refresh();say("Property updated in decoded save",true)};
$("devget").onclick=()=>{if(!data)return say("Decode a save first");const v=getAnyPath(data,$("devpath").value.trim());if(v===undefined)return say("Property path not found");$("devvalue").value=typeof v==="object"?JSON.stringify(v):String(v);say("Property read",true)};
$("applyfields").onclick=applyFields;$("undo").onclick=undo;$("applyjson").onclick=applyJSON;
$("formatjson").onclick=()=>{try{$("rawjson").value=JSON.stringify(JSON.parse($("rawjson").value),null,2);say("JSON formatted",true)}catch(e){say("Invalid JSON: "+e.message)}};
$("copyjson").onclick=()=>copyText($("rawjson").value);
$("decode").onclick=decodeCurrent;
$("dashdecode").onclick=()=>{tab("tools");if(native?.exportModifiedSave)acceptLiveSave(native.exportModifiedSave());else decodeCurrent()};
$("encode").onclick=encodeCurrent;
$("copysave").onclick=()=>copyText($("savestring").value);
$("dashcopy").onclick=()=>copyText($("savestring").value);
$("download").onclick=downloadBackup;$("dashbackup").onclick=downloadBackup;
$("importdecoded").onclick=importDecoded;
$("importfields").onclick=()=>{if(applyFields())importDecoded()};
$("restore").onclick=()=>$("file").click();
$("file").onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{$("savestring").value=await f.text();await decodeCurrent()}catch(err){say("Restore failed: "+err.message)}e.target.value=""};
$("currencyselect").onchange=renderCurrencyPanels;
$("currencyrefresh").onclick=renderCurrencyPanels;
$("applycurrency").onclick=()=>{try{editCurrency($("currencyselect").value,$("currencyoperation").value,$("currencyamount").value.trim())}catch(e){say(e.message)}};
$("currencymax").onclick=()=>{$("currencyoperation").value="set";$("currencyamount").value="1e100";$("applycurrency").click()};
$("currencyundo").onclick=undo;
$("dtadd").onclick=()=>{try{editCurrency("dilation.dilatedTime","add",$("dtamount").value.trim())}catch(e){say(e.message)}};
$("dtset").onclick=()=>{try{editCurrency("dilation.dilatedTime","set",$("dtamount").value.trim())}catch(e){say(e.message)}};
$("dtmultiply").onclick=()=>{try{editCurrency("dilation.dilatedTime","multiply","2")}catch(e){say(e.message)}};
$("dtzero").onclick=()=>{try{editCurrency("dilation.dilatedTime","set","0")}catch(e){say(e.message)}};
$("tpset").onclick=()=>{try{editCurrency("dilation.tachyonParticles","set",$("tpamount").value.trim())}catch(e){say(e.message)}};
$("tpadd").onclick=()=>{try{editCurrency("dilation.tachyonParticles","add",$("tpamount").value.trim())}catch(e){say(e.message)}};
$("tpmultiply").onclick=()=>{try{editCurrency("dilation.tachyonParticles","multiply","2")}catch(e){say(e.message)}};


function validRate(v){
 const D=window.Decimal;
 if(!/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(v))return false;
 try{return !D||new D(v).gt(0)}catch(e){return false}
}
function saveRate(){
 const v=$("rate").value.trim();
 if(!validRate(v)){say("Enter a valid positive Antimatter rate");return false}
 settings.amRate=v;settings.rate=v;persist();say("Antimatter rate saved",true);return true;
}
function saveDTRate(){
 const v=$("dtrate").value.trim();
 if(!validRate(v)){say("Enter a valid positive DT rate");return false}
 settings.dtRate=v;persist();say("DT rate saved",true);return true;
}
function setGenerator(on){
 settings.amGenerator=!!on;settings.generator=!!on;persist();
 $("genstate").textContent=settings.amGenerator?"ON":"OFF";
 $("gentoggle").textContent=settings.amGenerator?"Disable generator":"Enable generator";
 $("gentoggle").classList.toggle("active",settings.amGenerator);
}
function setDTGenerator(on){
 settings.dtGenerator=!!on;persist();
 $("dtgenstate").textContent=settings.dtGenerator?"ON":"OFF";
 $("dtgentoggle").textContent=settings.dtGenerator?"Disable DT generator":"Enable DT generator";
 $("dtgentoggle").classList.toggle("active",settings.dtGenerator);
}
function saveUniversalRate(){const v=$("unirate").value.trim();if(!validRate(v)){say("Enter a valid positive universal rate");return false}settings.universalRate=v;settings.universalCurrency=$("unicur").value;persist();say("Universal rate saved",true);return true}
function setUniversalGenerator(on){settings.universalGenerator=!!on;settings.universalCurrency=$("unicur").value;persist();$("unigenstate").textContent=settings.universalGenerator?"ON":"OFF";$("unitoggle").textContent=settings.universalGenerator?"Disable universal generator":"Enable universal generator";$("unitoggle").classList.toggle("active",settings.universalGenerator)}
function setPaused(on){
 paused=!!on;$("pausestate").textContent=paused?"PAUSED":"RUNNING";
 $("pausetoggle").textContent=paused?"Resume gains":"Pause gains";
 $("pausetoggle").classList.toggle("active",paused);
 say(paused?"Currency gains paused":"Currency gains resumed",true);
}
$("rate").value=settings.amRate||settings.rate;
$("dtrate").value=settings.dtRate;
$("saverate").onclick=saveRate;
$("savedtrate").onclick=saveDTRate;
$("gentoggle").onclick=()=>{if(saveRate())setGenerator(!settings.amGenerator)};
$("dtgentoggle").onclick=()=>{if(saveDTRate())setDTGenerator(!settings.dtGenerator)};
$("pausetoggle").onclick=()=>setPaused(!paused);
setGenerator(!!(settings.amGenerator||settings.generator));
setDTGenerator(settings.dtGenerator);setUniversalGenerator(settings.universalGenerator);renderCurrencyPanels();renderDev();runtimeReadings();

function installPauseHooks(){
 const C=window.Currency;if(!C)return false;
 for(const key of Object.keys(C)){
  let obj;try{obj=C[key]}catch(e){continue}
  if(!obj||typeof obj.add!=="function"||obj.add.__adPauseHook)continue;
  const original=obj.add;
  const wrapped=function(...args){if(paused)return;return original.apply(this,args)};
  wrapped.__adPauseHook=true;
  try{obj.add=wrapped;if(obj.add===wrapped)patches.push({obj,original,wrapped})}catch(e){}
 }
 return patches.length>0;
}
const pauseReady=installPauseHooks();
let lastTick=performance.now();
gainTimer=setInterval(()=>{
 const now=performance.now(),dt=Math.min((now-lastTick)/1000,.5);lastTick=now;
 if(paused||(!settings.amGenerator&&!settings.dtGenerator&&!settings.universalGenerator)||!dt)return;
 try{
  const C=window.Currency,D=window.Decimal;
  if(!D)return;
  if(settings.amGenerator&&C?.antimatter?.add){
   const amRate=new D(settings.amRate||settings.rate);
   if(amRate.gt(0))C.antimatter.add(amRate.times(dt));
  }
  if(settings.dtGenerator&&C?.dilatedTime?.add){
   const dtRate=new D(settings.dtRate);
   if(dtRate.gt(0))C.dilatedTime.add(dtRate.times(dt));
  }
  if(settings.universalGenerator){
   const currency=C?.[settings.universalCurrency];
   if(currency&&typeof currency.add==="function"){
    const universalRate=new D(settings.universalRate||"1e50");
    if(universalRate.gt(0))currency.add(universalRate.times(dt));
   }
  }
 }catch(e){say("Generator error: "+e.message)}
},50);

if(native&&typeof native.exportModifiedSave==="function"){
 originalExport=native.exportModifiedSave;
 wrappedExport=function(...args){const result=originalExport.apply(this,args);if(typeof result==="string")acceptLiveSave(result);return result};
 native.exportModifiedSave=wrappedExport;
 try{acceptLiveSave(originalExport.call(native))}catch(e){}
 poll=setInterval(()=>{try{const v=originalExport.call(native);if(typeof v==="string"&&v!==lastLive)acceptLiveSave(v)}catch(e){}},250);
 say("Native save monitoring connected",true);
}else say("Ready â€” paste a save string");

$("close").onclick=()=>{
 window[HOOK]?.restore?.();
 p.style.animation="ad7Bloom .22s ease reverse forwards";
 setTimeout(()=>p.remove(),220);
};

$("min").onclick=()=>{
 if(p.dataset.animating==="1")return;
 p.dataset.animating="1";
 const main=$("mainui");
 const finish=()=>{p.dataset.animating="0"};
 if(!mini){
  mini=true;
  main.style.display="block";
  main.style.overflow="hidden";
  main.style.transformOrigin="top center";
  main.style.transition="opacity .28s ease, transform .38s cubic-bezier(.16,1,.3,1), max-height .38s ease";
  main.style.maxHeight=main.scrollHeight+"px";
  main.style.opacity="1";
  main.style.transform="translateY(0) scale(1)";
  requestAnimationFrame(()=>{
   main.style.opacity="0";
   main.style.transform="translateY(-12px) scale(.94)";
   main.style.maxHeight="0px";
   p.style.width="180px";
   p.style.borderRadius="24px";
  });
  $("min").textContent="+";
  setTimeout(()=>{main.style.display="none";main.style.maxHeight="";main.style.overflow="";finish()},390);
 }else{
  mini=false;
  main.style.display="block";
  main.style.overflow="hidden";
  main.style.transformOrigin="top center";
  main.style.transition="none";
  main.style.maxHeight="0px";
  main.style.opacity="0";
  main.style.transform="translateY(-12px) scale(.94)";
  p.style.width="min("+settings.width+"px,calc(100vw - 28px))";
  p.style.borderRadius=settings.radius+"px";
  $("min").textContent="âˆ’";
  requestAnimationFrame(()=>{
   main.style.transition="opacity .32s ease, transform .4s cubic-bezier(.16,1,.3,1), max-height .4s cubic-bezier(.16,1,.3,1)";
   main.style.maxHeight=main.scrollHeight+"px";
   main.style.opacity="1";
   main.style.transform="translateY(0) scale(1)";
  });
  setTimeout(()=>{main.style.maxHeight="";main.style.overflow="";finish()},420);
 }
};

let sx=0,sy=0,ox=0,oy=0;
const head=$("ad-head");
head.addEventListener("pointerdown",e=>{
 if(e.target.closest("button"))return;
 drag=true;const r=p.getBoundingClientRect();sx=e.clientX;sy=e.clientY;ox=r.left;oy=r.top;head.setPointerCapture(e.pointerId);
});
head.addEventListener("pointermove",e=>{
 if(!drag)return;const r=p.getBoundingClientRect();
 p.style.left=Math.max(0,Math.min(innerWidth-r.width,ox+e.clientX-sx))+"px";
 p.style.top=Math.max(0,Math.min(innerHeight-45,oy+e.clientY-sy))+"px";
});
head.addEventListener("pointerup",()=>drag=false);
head.addEventListener("pointercancel",()=>drag=false);

window[HOOK]={
 restore(){
  if(poll)clearInterval(poll);
  if(gainTimer)clearInterval(gainTimer);
  if(native&&wrappedExport&&native.exportModifiedSave===wrappedExport)native.exportModifiedSave=originalExport;
  for(const x of patches)if(x.obj.add===x.wrapped)x.obj.add=x.original;
  delete window[HOOK];
 }
};
if(!pauseReady)say("Editor ready; pause API unavailable");
})();
