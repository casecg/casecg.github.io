(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = 'aero.preferences.v1';
  const hasOwn = (object,key) => Object.prototype.hasOwnProperty.call(object,key);
  const groups = [
    {id:'colors',title:'Colors & atmosphere',fields:[
      ['primary','Primary color','color','#168eb6'],['secondary','Secondary color','color','#6ac84a'],
      ['accent','Accent color','color','#087d96'],['background','Background tint','color','#b7e4f0'],
      ['text','Text color','color','#153e51'],['panel','Panel color','color','#f4fdff'],
      ['gradient','Wallpaper & gradient intensity','range',75,0,100,'%'],
      ['wallpaper','Landscape wallpaper','check',true,'Turn off for a simple, lighter gradient.']
    ]},
    {id:'interface',title:'Glass & interface',fields:[
      ['opacity','Panel opacity','range',84,35,100,'%'],['blur','Glass blur','range',14,0,24,'px'],
      ['radius','Corner radius','range',20,0,36,'px'],['border','Border thickness','range',1,0,4,'px'],
      ['shadow','Shadow strength','range',14,0,40,'%'],
      ['font','Font family','select','trebuchet',{trebuchet:'Trebuchet MS',segoe:'Segoe UI',arial:'Arial',verdana:'Verdana',georgia:'Georgia'}],
      ['scale','Interface scale','range',100,85,150,'%']
    ]},
    {id:'bubbles',title:'Bubbles & motion',fields:[
      ['bubbleCount','Bubble amount','range',14,0,40,''],['bubbleSize','Bubble size','range',54,15,110,'px'],
      ['bubbleSpeed','Bubble speed','range',50,10,100,'%'],['bubbleOpacity','Bubble opacity','range',45,0,100,'%'],
      ['bubbleAnimate','Animate bubbles','check',true],['animationSpeed','Animation speed','range',100,25,200,'%'],
      ['reducedMotion','Reduced motion','check',false,'Your system’s reduced-motion preference is always respected.']
    ]},
    {id:'audio',title:'Sounds & quiet moments',fields:[
      ['ambientProfile','Ambient soundscape','select','ocean',{ocean:'Ocean air — soft surf',meadow:'Meadow — breeze & birds',drift:'Drift — airy tones'}],
      ['ambientVolume','Ambient volume','range',35,0,100,'%'],['popEnabled','Button sounds','check',true],
      ['popProfile','Button sound','select','bubble',{bubble:'Bubble pop',droplet:'Water droplet',soft:'Soft pluck'}],
      ['popVolume','Button volume','range',28,0,100,'%'],['muted','Mute all audio','check',false]
    ]},
    {id:'performance',title:'Performance & battery',fields:[
      ['lowPower','Low-power mode','check',false,'Removes glass blur, simplifies sound and shadows, and caps particles at 6 / 15 FPS.'],
      ['quality','Visual-effect quality','select','balanced',{off:'Off',low:'Low',balanced:'Balanced',high:'High'}],
      ['fps','Particle frame-rate limit','select','30',{'15':'15 FPS','30':'30 FPS','60':'60 FPS'}]
    ]},
    {id:'browser',title:'Browser preferences',fields:[
      ['browserMode','Browsing mode','select','hosted',{hosted:'Hosted browser — browse inside Aero',direct:'Direct iframe preview — compatibility mode'}],
      ['hostedBrowserUrl','Hosted browser service URL','url','https://linedumb.seel.cl/tools/firefox/index.html','The full HTTPS browser-app address, like the one embedded by your Firefox file. Not a destination website or a {url} template.'],
      ['keepHostedSession','Keep hosted browser open between tabs','check',false,'Uses more memory and may keep remote audio playing. Off disconnects the viewer when you leave Browser.'],
      ['browserHome','Browser home page','url','','Leave empty for the local welcome page.'],
      ['proxyUrl','Proxy URL template','url','','Optional HTTPS endpoint on a separate origin. Example: https://your-server.example/browse?url={url}. The placeholder is replaced with an encoded address.'],
      ['useProxy','Use my proxy backend','check',false,'Requires your own running backend. Only external HTTPS addresses are sent to it.']
    ]}
  ];
  const fields = groups.flatMap(group => group.fields);
  const defaults = Object.fromEntries(fields.map(field => [field[0],field[3]]));
  function sanitize(input) {
    const result = {...defaults};
    if (!input || typeof input !== 'object') return result;
    for (const [key,,type,initial,min,max] of fields) {
      const value = input[key];
      if (type === 'color' && typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)) result[key] = value;
      if (type === 'range' && typeof value === 'number' && Number.isFinite(value)) result[key] = Math.round(Math.min(max,Math.max(min,value)));
      if (type === 'check' && typeof value === 'boolean') result[key] = value;
      if (type === 'select' && typeof value === 'string' && hasOwn(min,value)) result[key] = value;
      if (type === 'url' && typeof value === 'string') result[key] = value.slice(0,2048);
    }
    return result;
  }
  let settings = {...defaults};
  let storageAvailable = true;
  try { settings = sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch { storageAvailable = false; }
  let saveTimer, toastTimer;
  function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => {$('toast').hidden = true;},3500); }
  function save() {
    try { localStorage.setItem(STORAGE_KEY,JSON.stringify(settings)); storageAvailable = true; }
    catch { storageAvailable = false; }
    $('save-state').textContent = storageAvailable ? 'Saved on this device' : 'Session only · storage unavailable';
  }
  function queueSave() { $('save-state').textContent = 'Saving…'; clearTimeout(saveTimer); saveTimer = setTimeout(save,180); }
  const presets = {
    classic:{name:'Classic Aero',primary:'#168eb6',secondary:'#6ac84a',accent:'#087d96',background:'#b7e4f0',text:'#153e51',panel:'#f4fdff'},
    ocean:{name:'Ocean',primary:'#177bb6',secondary:'#49b9bc',accent:'#156f94',background:'#70c8e5',text:'#123b52',panel:'#eafaff'},
    meadow:{name:'Meadow',primary:'#548d42',secondary:'#8dc955',accent:'#3f7437',background:'#bbdea2',text:'#28482e',panel:'#f4ffea'},
    sunset:{name:'Sunset',primary:'#b76645',secondary:'#e8b365',accent:'#91492c',background:'#efd1ac',text:'#533d35',panel:'#fff5e7'},
    low:{name:'Low Power',primary:'#168eb6',secondary:'#6ac84a',accent:'#087d96',background:'#b7e4f0',text:'#153e51',panel:'#f4fdff'}
  };
  function applyPreset(id) {
    if (!hasOwn(presets,id)) throw new Error('Unknown preset');
    const {name,...palette} = presets[id];
    Object.assign(settings,palette,{gradient:id === 'classic' ? 75 : 48,lowPower:id === 'low'});
    apply(); syncControls(); save(); toast(name + ' applied');
  }
  function buildSettings() {
    const fragment = document.createDocumentFragment();
    for (const group of groups) {
      const details = document.createElement('details'); details.className = 'settings-group'; details.open = group.id === 'colors';
      const summary = document.createElement('summary'); summary.textContent = group.title; details.append(summary);
      const content = document.createElement('div'); content.className = 'settings-content';
      for (const [key,title,type,initial,min,max,unit] of group.fields) {
        const row = document.createElement('div'); row.className = 'setting-row' + (type === 'url' ? ' wide' : '');
        const label = document.createElement('label'); label.htmlFor = 'setting-'+key; label.textContent = title;
        const description = (type === 'check' || type === 'url') && typeof min === 'string' ? min : '';
        if (description) { const small = document.createElement('small'); small.id='help-'+key; small.textContent=description; label.append(small); }
        const control = document.createElement('div'); control.className='setting-control';
        const input = document.createElement(type === 'select' ? 'select' : 'input'); input.id = 'setting-'+key; input.dataset.setting=key;
        if (type === 'select') for (const [value,text] of Object.entries(min)) { const option = document.createElement('option'); option.value=value; option.textContent=text; input.append(option); }
        else input.type = type === 'check' ? 'checkbox' : type === 'url' ? 'text' : type;
        if (type === 'url') { input.inputMode='url'; input.spellcheck=false; input.maxLength=2048; }
        if (description) input.setAttribute('aria-describedby','help-'+key);
        if (type === 'range') { input.min=min; input.max=max; input.step=1; }
        input.addEventListener(type === 'select' || type === 'check' ? 'change' : 'input',() => {
          settings[key] = type === 'check' ? input.checked : type === 'range' ? Number(input.value) : input.value;
          apply(key); syncControls(); queueSave();
        });
        control.append(input);
        if (type === 'range') { const output=document.createElement('output'); output.htmlFor=input.id; output.id='value-'+key; control.append(output); }
        row.append(label,control); content.append(row);
      }
      const reset=document.createElement('button'); reset.className='reset-section'; reset.textContent='Reset '+group.title.toLowerCase();
      reset.addEventListener('click',() => { for (const [key] of group.fields) settings[key]=defaults[key]; apply(); syncControls(); save(); toast('Section reset'); });
      content.append(reset); details.append(content); fragment.append(details);
    }
    $('settings-sections').append(fragment);
    for (const [id,preset] of Object.entries(presets)) {
      const button=document.createElement('button'); button.className='preset'; button.dataset.preset=id;
      const swatch=document.createElement('span'); swatch.className='preset-swatch'; swatch.style.background=`linear-gradient(${preset.primary},${preset.secondary})`; swatch.setAttribute('aria-hidden','true');
      button.append(swatch,document.createTextNode(preset.name)); button.addEventListener('click',() => applyPreset(id)); $('presets').append(button);
    }
  }
  function syncControls() {
    for (const [key,,type,,,,unit] of fields) {
      const input=$('setting-'+key); if (type === 'check') input.checked=settings[key]; else if (document.activeElement !== input || type !== 'url') input.value=settings[key];
      if (type === 'range') $('value-'+key).textContent=settings[key]+(unit || '');
    }
    $('quick-volume').value=settings.ambientVolume; $('quick-volume-value').textContent=settings.ambientVolume+'%';
    document.querySelectorAll('[data-sound]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.sound === settings.ambientProfile)));
    $('quick-low-power').setAttribute('aria-pressed',String(settings.lowPower)); $('quick-low-power').textContent='♧ Low power: '+(settings.lowPower?'on':'off');
    $('global-mute').setAttribute('aria-pressed',String(settings.muted)); $('global-mute').setAttribute('aria-label',settings.muted?'Unmute all audio':'Mute all audio'); $('global-mute').textContent=settings.muted?'♪̸':'♫';
    $('soundscape-title').textContent={ocean:'Ocean air',meadow:'Meadow breeze',drift:'Gentle drift'}[settings.ambientProfile];
  }
  const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
  const fonts={trebuchet:'"Trebuchet MS","Segoe UI",sans-serif',segoe:'"Segoe UI",Arial,sans-serif',arial:'Arial,sans-serif',verdana:'Verdana,sans-serif',georgia:'Georgia,serif'};
  function reduced() { return settings.reducedMotion || motionQuery.matches; }
  function apply(changed) {
    const style=document.documentElement.style;
    for (const key of ['primary','secondary','accent','background','text']) style.setProperty('--'+key,settings[key]);
    style.setProperty('--panel-rgb',settings.panel.slice(1).match(/../g).map(x=>parseInt(x,16)).join(','));
    style.setProperty('--panel-alpha',settings.opacity/100); style.setProperty('--blur',(settings.lowPower || settings.quality==='low' || settings.quality==='off'?0:settings.blur)+'px');
    style.setProperty('--radius',settings.radius+'px'); style.setProperty('--border-width',settings.border+'px'); style.setProperty('--shadow',settings.lowPower?0:settings.shadow/100);
    style.setProperty('--scale',settings.scale/100); style.setProperty('--gradient',settings.gradient/100); style.setProperty('--font',fonts[settings.font]); style.setProperty('--duration',(reduced()?0:22000/settings.animationSpeed)+'ms');
    document.body.classList.toggle('low-power',settings.lowPower || settings.quality==='off'); document.body.classList.toggle('reduced-motion',reduced());
    document.querySelectorAll('.wallpaper,.welcome-window').forEach(el=>el.classList.toggle('has-image',settings.wallpaper && !settings.lowPower));
    $('performance-status').textContent=settings.lowPower?'Low power · 15 FPS cap':reduced()?'Reduced motion':settings.quality==='off'?'Effects off':settings.quality.charAt(0).toUpperCase()+settings.quality.slice(1)+' effects';
    $('browser-mode').textContent=settings.browserMode==='hosted'?'Hosted browser':settings.useProxy?'Custom proxy':'Direct preview';
    $('hosted-browser').hidden=settings.browserMode!=='hosted';
    $('direct-browser').hidden=settings.browserMode!=='direct';
    window.AeroHostedBrowser.configure({url:settings.hostedBrowserUrl,enabled:settings.browserMode==='hosted',keepSession:settings.keepHostedSession&&!settings.lowPower});
    if(changed==='browserMode'&&settings.browserMode==='hosted')unloadBrowser();
    if (!changed || ['bubbleCount','bubbleSize','bubbleOpacity','bubbleAnimate','reducedMotion','lowPower','quality'].includes(changed)) resetBubbles();
    if (!changed || ['ambientProfile','lowPower'].includes(changed)) restartAmbient();
    updateAudio();
  }
  let particles=[],animationId=0,lastFrame=0;
  function resetBubbles() {
    cancelAnimationFrame(animationId); animationId=0; lastFrame=0; $('bubbles').replaceChildren(); particles=[];
    const limit=settings.quality==='off'?0:settings.lowPower?6:settings.quality==='low'?8:settings.quality==='balanced'?20:40;
    for (let i=0;i<Math.min(settings.bubbleCount,limit);i++) {
      const node=document.createElement('span'); node.className='bubble'; const size=settings.bubbleSize*(.45+Math.random()*.8);
      node.style.width=node.style.height=size+'px'; node.style.left=(Math.random()*98)+'%'; node.style.opacity=settings.bubbleOpacity/100;
      const particle={node,y:Math.random()*(innerHeight+200),speed:.5+Math.random(),phase:Math.random()*6,size};
      node.style.transform=`translateY(${-particle.y}px)`; particles.push(particle); $('bubbles').append(node);
    }
    animateBubbles();
  }
  function animateBubbles(time=0) {
    if (!settings.bubbleAnimate || reduced() || document.hidden || !particles.length) { animationId=0; return; }
    const fps=settings.lowPower?15:Number(settings.fps);
    if (!lastFrame) lastFrame=time;
    const elapsed=time-lastFrame;
    if (elapsed>=1000/fps) {
      const step=Math.min(elapsed,100)/1000; lastFrame=time;
      for (const particle of particles) {
        particle.y+=step*(settings.bubbleSpeed/2)*particle.speed*(settings.animationSpeed/100);
        if (particle.y>innerHeight+230) particle.y=0;
        particle.node.style.transform=`translate(${Math.sin(particle.y/150+particle.phase)*18}px,${-particle.y}px)`;
      }
    }
    animationId=requestAnimationFrame(animateBubbles);
  }
  // One audio context, short disposable effects, and a bounded ambient graph.
  let context=null,master=null,ambientGain=null,ambientNodes=[],birdTimer=null,ambientPlaying=false;
  async function ensureAudio() {
    if (!context) {
      const AudioContext=window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) { toast('This browser does not support audio synthesis.'); return false; }
      try { context=new AudioContext(); master=context.createGain(); master.connect(context.destination); }
      catch { toast('Audio could not start in this browser.'); return false; }
    }
    if (context.state==='suspended') await context.resume();
    updateAudio(); return true;
  }
  function updateAudio() {
    if (master) master.gain.setTargetAtTime(settings.muted?0:.7,context.currentTime,.04);
    if (ambientGain) ambientGain.gain.setTargetAtTime(settings.ambientVolume/100*.2,context.currentTime,.1);
    $('audio-status').textContent=settings.muted?'Muted':ambientPlaying?'Playing':'Paused';
    $('ambient-toggle').textContent=ambientPlaying?'Ⅱ':'▶'; $('ambient-toggle').setAttribute('aria-pressed',String(ambientPlaying)); $('ambient-toggle').setAttribute('aria-label',ambientPlaying?'Pause ambient sound':'Play ambient sound');
  }
  function stopAmbient() {
    clearTimeout(birdTimer); birdTimer=null;
    for (const node of ambientNodes) { try { if (node.stop) node.stop(); node.disconnect(); } catch {} }
    ambientNodes=[]; ambientGain=null;
  }
  function tone(frequency,duration,volume,output=master,slide=frequency) {
    if (!context || !output) return;
    const osc=context.createOscillator(),gain=context.createGain(),now=context.currentTime;
    osc.type='sine'; osc.frequency.setValueAtTime(frequency,now); osc.frequency.exponentialRampToValueAtTime(slide,now+duration);
    gain.gain.setValueAtTime(.0001,now); gain.gain.exponentialRampToValueAtTime(Math.max(.0001,volume),now+.009); gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain); gain.connect(output); osc.start(); osc.stop(now+duration+.02); osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  function startAmbient() {
    if (!context || !ambientPlaying) return;
    ambientGain=context.createGain(); ambientGain.gain.value=settings.ambientVolume/100*.2; ambientGain.connect(master); ambientNodes.push(ambientGain);
    const frames=context.sampleRate*3,buffer=context.createBuffer(1,frames,context.sampleRate),data=buffer.getChannelData(0); let brown=0;
    for(let i=0;i<frames;i++){brown=(brown+(Math.random()*2-1)*.025)/1.025;data[i]=brown*4;}
    // Crossfade the loop seam to keep the sound free of clicks.
    const seam=Math.floor(context.sampleRate*.06); for(let i=0;i<seam;i++){const mix=i/seam;data[frames-seam+i]=data[frames-seam+i]*(1-mix)+data[i]*mix;}
    const noise=context.createBufferSource(); noise.buffer=buffer; noise.loop=true;
    const filter=context.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=settings.ambientProfile==='ocean'?750:450;
    noise.connect(filter); filter.connect(ambientGain); noise.start(); ambientNodes.push(noise,filter);
    if (!settings.lowPower) {
      const lfo=context.createOscillator(),lfoGain=context.createGain(); lfo.frequency.value=.085; lfoGain.gain.value=200;
      lfo.connect(lfoGain);lfoGain.connect(filter.frequency);lfo.start();ambientNodes.push(lfo,lfoGain);
    }
    if(settings.ambientProfile==='drift') for(const frequency of (settings.lowPower?[174.61]:[174.61,261.63,349.23])) {
      const osc=context.createOscillator(),gain=context.createGain();osc.frequency.value=frequency;gain.gain.value=.055;osc.connect(gain);gain.connect(ambientGain);osc.start();ambientNodes.push(osc,gain);
    }
    if(settings.ambientProfile==='meadow' && !settings.lowPower) {
      const chirp=()=>{if(!ambientPlaying||document.hidden)return;tone(1800,.18,.08,ambientGain,2600);birdTimer=setTimeout(chirp,4500+Math.random()*6000);};
      birdTimer=setTimeout(chirp,3000);
    }
  }
  function restartAmbient() {stopAmbient();if(ambientPlaying&&!document.hidden)startAmbient();}
  async function pop() {
    if(!settings.popEnabled||settings.muted||settings.popVolume===0)return;
    if(!await ensureAudio())return;
    const spec={bubble:[520,.105,135],droplet:[1050,.15,310],soft:[440,.075,380]}[settings.popProfile];
    tone(spec[0],spec[1],settings.popVolume/100*.18,master,spec[2]);
  }
  // Actual click/keyboard activations, never synthesized hover sounds.
  document.addEventListener('click',event=>{if(event.isTrusted&&event.target.closest('button,a,summary'))pop().catch(()=>{});});
  $('ambient-toggle').addEventListener('click',async()=>{
    if(ambientPlaying){ambientPlaying=false;stopAmbient();}
    else {if(!await ensureAudio())return;ambientPlaying=true;startAmbient();}
    updateAudio();
  });
  $('global-mute').addEventListener('click',()=>{settings.muted=!settings.muted;updateAudio();syncControls();save();});
  $('quick-volume').addEventListener('input',event=>{settings.ambientVolume=Number(event.target.value);updateAudio();syncControls();queueSave();});
  document.querySelectorAll('[data-sound]').forEach(button=>button.addEventListener('click',()=>{settings.ambientProfile=button.dataset.sound;restartAmbient();syncControls();queueSave();}));
  $('quick-low-power').addEventListener('click',()=>{settings.lowPower=!settings.lowPower;apply();syncControls();save();});
  $('reset-all').addEventListener('click',()=>{if(!confirm('Restore all appearance, audio, performance, and browser settings?'))return;settings={...defaults};ambientPlaying=false;apply();syncControls();save();toast('Defaults restored');});
  // Keep only one external browsing surface alive, and unload it on navigation away.
  const history=[];let historyIndex=-1,browserTimer=null,currentRoute='';
  const localWelcome=new URL('welcome.html',location.href).href;
  function normalizeUrl(raw) {
    const input=raw.trim();if(!input)throw new Error('Enter a website address.');
    if(input.length>2048)throw new Error('This address is too long.');
    const url=new URL(/^[a-z][a-z\d+.-]*:/i.test(input)?input:'https://'+input);
    if(url.username||url.password)throw new Error('Addresses containing a username or password are not supported.');
    if(url.href===localWelcome)return url.href;
    if(url.protocol!=='https:')throw new Error('Use an HTTPS address.');
    return url.href;
  }
  function proxyAddress(target) {
    if(!settings.useProxy||target===localWelcome)return target;
    const template=settings.proxyUrl.trim();
    if(!template.includes('{url}'))throw new Error('Add a proxy URL template containing {url} in Settings, or turn the proxy off.');
    const parsed=new URL(template.split('{url}').join(encodeURIComponent(target)));
    if(parsed.protocol!=='https:'||parsed.origin===location.origin||parsed.username||parsed.password)throw new Error('The proxy must use HTTPS on a separate origin without credentials in its URL.');
    return parsed.href;
  }
  function updateHistoryButtons() {
    $('browser-back').disabled=historyIndex<=0; $('browser-forward').disabled=historyIndex>=history.length-1;
    $('browser-reload').disabled=$('browser-external').disabled=historyIndex<0;
  }
  function unloadBrowser(){clearTimeout(browserTimer);$('browser-frame-slot').replaceChildren();}
  function renderAddress(target) {
    let address;
    try{address=proxyAddress(target);}catch(error){$('browser-status').textContent=error.message;return false;}
    unloadBrowser();$('browser-start').hidden=true;$('embed-help').hidden=target===localWelcome;$('address').value=target;
    $('browser-status').textContent='Opening preview…';
    const frame=document.createElement('iframe');frame.title='Website preview';frame.referrerPolicy='no-referrer';
    frame.setAttribute('sandbox',target===localWelcome?'allow-scripts':'allow-scripts allow-forms allow-same-origin allow-popups');
    frame.addEventListener('load',()=>{
      clearTimeout(browserTimer);
      $('browser-status').textContent=target===localWelcome?'Local welcome page · works offline':'Preview requested. If it is blank or refused, use “Open in a new tab.”';
    });
    frame.src=address;$('browser-frame-slot').append(frame);
    browserTimer=setTimeout(()=>{$('browser-status').textContent='This page is taking a while. Check your connection, try again, or open it in a new tab.';},12000);
    return true;
  }
  function navigate(raw) {
    let target;try{target=normalizeUrl(raw);}catch(error){$('browser-status').textContent=error.message;return;}
    if(!renderAddress(target))return;
    history.splice(historyIndex+1);history.push(target);if(history.length>50)history.shift();historyIndex=history.length-1;updateHistoryButtons();
  }
  $('address-form').addEventListener('submit',event=>{event.preventDefault();navigate($('address').value);});
  $('browser-back').addEventListener('click',()=>{if(historyIndex>0&&renderAddress(history[historyIndex-1])){historyIndex--;updateHistoryButtons();}});
  $('browser-forward').addEventListener('click',()=>{if(historyIndex<history.length-1&&renderAddress(history[historyIndex+1])){historyIndex++;updateHistoryButtons();}});
  $('browser-reload').addEventListener('click',()=>{if(historyIndex>=0)renderAddress(history[historyIndex]);});
  $('browser-home').addEventListener('click',()=>navigate(settings.browserHome.trim()||localWelcome));
  $('preview-local').addEventListener('click',()=>navigate(localWelcome));
  function openExternal(){if(historyIndex>=0)window.open(history[historyIndex],'_blank','noopener,noreferrer');}
  $('browser-external').addEventListener('click',openExternal);$('fallback-open').addEventListener('click',openExternal);
  function closeGame(){$('game-frame-slot').replaceChildren();$('game-player').hidden=true;}
  function buildGames(){
    const games=Array.isArray(window.AERO_GAMES)?window.AERO_GAMES:[];
    const validGames=games.filter(game=>game&&typeof game.title==='string'&&typeof game.path==='string');
    $('game-count').textContent=validGames.length+' game'+(validGames.length===1?'':'s');document.querySelector('.nav-count').textContent=validGames.length;
    document.querySelector('.empty-intro').hidden=validGames.length>0;
    if(!validGames.length){for(let i=0;i<3;i++){const card=document.createElement('div');card.className='game-placeholder';const plus=document.createElement('span');plus.textContent='＋';plus.setAttribute('aria-hidden','true');card.append(plus,document.createTextNode('A place for something fun'));$('game-grid').append(card);}return;}
    for(const game of validGames){
      const button=document.createElement('button');button.className='game-entry card';const title=document.createElement('strong');title.textContent=game.title;const text=document.createElement('p');text.textContent=game.description||'Play this game';button.append(title,text);
      button.addEventListener('click',()=>{const url=new URL(game.path,location.href);if(url.origin!==location.origin||!['http:','https:','file:'].includes(url.protocol)){toast('Game paths must point to local files in this site.');return;}closeGame();const frame=document.createElement('iframe');frame.title=game.title;frame.src=url.href;frame.setAttribute('sandbox','allow-scripts allow-pointer-lock');frame.allow='fullscreen; gamepad';$('game-frame-slot').append(frame);$('playing-title').textContent=game.title;$('game-player').hidden=false;$('close-game').focus();});
      $('game-grid').append(button);
    }
  }
  $('close-game').addEventListener('click',closeGame);
  function route(){
    const candidate=location.hash.slice(1);const next=['home','games','browser','settings'].includes(candidate)?candidate:'home';
    if(currentRoute==='browser'&&next!=='browser')unloadBrowser();if(next!=='games')closeGame();
    document.querySelectorAll('.page').forEach(page=>page.hidden=page.id!=='page-'+next);
    document.querySelectorAll('[data-route]').forEach(link=>{const active=link.dataset.route===next;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    if(next==='browser'&&currentRoute!==next&&historyIndex>=0&&settings.browserMode==='direct')renderAddress(history[historyIndex]);
    window.AeroHostedBrowser.setVisible(next==='browser');
    if(currentRoute&&next!==currentRoute)$('main').focus({preventScroll:true});currentRoute=next;
  }
  window.addEventListener('hashchange',route);
  document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();$('main').focus();});
  let offlineReady=false;
  function connection(){$('network-state').textContent=navigator.onLine?(offlineReady?'Offline ready':'Local first'):'Offline';}
  window.addEventListener('online',connection);window.addEventListener('offline',connection);
  function clock(){$('clock').textContent=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});$('clock').dateTime=new Date().toISOString();}
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(animationId);animationId=0;lastFrame=0;stopAmbient();if(context)context.suspend().catch(()=>{});save();}
    else{if(!animationId)animateBubbles();if(context&&ambientPlaying)context.resume().then(startAmbient).catch(()=>{});clock();}
  });
  window.addEventListener('pagehide',save);
  if(motionQuery.addEventListener)motionQuery.addEventListener('change',()=>{apply();syncControls();});else motionQuery.addListener(()=>{apply();syncControls();});
  buildSettings();buildGames();apply();syncControls();route();connection();clock();setInterval(clock,30000);
  $('save-state').textContent=storageAvailable?'Saved on this device':'Session only · storage unavailable';
  if('serviceWorker' in navigator&&['http:','https:'].includes(location.protocol))navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{offlineReady=true;connection();}).catch(()=>{$('network-state').textContent='Online only';});
  // Optional native agent interface; normal browsers need no additional dependency.
  if(document.modelContext?.registerTool){
    const lifecycle=new AbortController();
    try{Promise.resolve(document.modelContext.registerTool({name:'set_aero_preset',description:'Apply an Aero appearance preset, update visible controls, and save device preferences.',inputSchema:{type:'object',properties:{preset:{type:'string',enum:Object.keys(presets)}},required:['preset'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input.preset!=='string'||!hasOwn(presets,input.preset)||Object.keys(input).some(key=>key!=='preset'))throw new Error('Choose a listed preset.');applyPreset(input.preset);return{preset:input.preset,lowPower:settings.lowPower,saved:storageAvailable};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
    window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  }
})();
