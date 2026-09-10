/* A hosted browser app is embedded once; destinations are entered inside it.
 * No destination is forwarded to window.open or the top-level location here.
 * Hosting/operating the actual browser service remains separate from GitHub Pages.
 */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  let config={url:'',enabled:true,keepSession:false},frame=null,timer=null,visible=false;
  function validateService(raw) {
    let url;
    try { url=new URL(raw.trim()); } catch { throw new Error('Enter the full HTTPS browser-service address in Settings.'); }
    if(url.protocol!=='https:'||url.username||url.password||url.origin===location.origin||raw.includes('{url}'))throw new Error('Use a separate HTTPS browser-app address without credentials or a {url} placeholder.');
    return url;
  }
  function controls(connected) {
    for(const id of ['hosted-reload','hosted-fullscreen','hosted-stop'])$(id).disabled=!connected;
    if(!document.documentElement.requestFullscreen)$('hosted-fullscreen').disabled=true;
    $('hosted-start').hidden=connected;$('hosted-help').hidden=!connected;
  }
  function stop(message='Disconnected. Start the browser when you are ready.') {
    clearTimeout(timer);timer=null;if(frame){frame.remove();frame=null;}
    $('hosted-frame-slot').replaceChildren();controls(false);$('hosted-status').textContent=message;
  }
  function start() {
    if(!config.enabled)return;
    let url;
    try{url=validateService(config.url);}catch(error){stop(error.message);return;}
    if(!navigator.onLine){stop('Hosted browsing needs an internet connection. Your Aero desktop still works offline.');return;}
    stop();frame=document.createElement('iframe');frame.title='Hosted browser workspace';
    frame.referrerPolicy='no-referrer';
    // A separate origin and no top-navigation/popups permission keep ordinary
    // browsing inside the workspace. Remote apps may need their own supported
    // embedding configuration for third-party storage or login.
    frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-downloads');
    frame.setAttribute('allow','fullscreen; autoplay');frame.allowFullscreen=true;
    const currentFrame=frame;
    frame.addEventListener('load',()=>{
      if(frame!==currentFrame)return;
      clearTimeout(timer);
      // Cross-origin iframe load fires even on some failures. Never report a
      // successful proxy connection solely from this event.
      $('hosted-status').textContent='Browser frame opened. When the service appears, use its address bar below.';
    });
    frame.src=url.href;$('hosted-frame-slot').append(frame);controls(true);
    $('hosted-status').textContent='Contacting '+url.hostname+'…';
    timer=setTimeout(()=>{if(frame===currentFrame)$('hosted-status').textContent='The browser service is taking a while. Reconnect or check its address in Settings.';},15000);
  }
  $('hosted-launch').addEventListener('click',start);
  $('hosted-reload').addEventListener('click',start);
  $('hosted-stop').addEventListener('click',()=>stop());
  $('hosted-fullscreen').addEventListener('click',async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await $('hosted-browser').requestFullscreen();}
    catch{$('hosted-status').textContent='Full screen is unavailable in this browser. You can keep browsing in the panel.';}
  });
  document.addEventListener('fullscreenchange',()=>{$('hosted-fullscreen').textContent=document.fullscreenElement?'Exit full screen':'Full screen';});
  window.addEventListener('offline',()=>{if(frame)$('hosted-status').textContent='Your connection is offline. Reconnect when internet access returns.';});
  window.AeroHostedBrowser={
    configure(next){
      const changed=next.url!==config.url||next.enabled!==config.enabled;config={...next};
      try{$('hosted-service-name').textContent=new URL(config.url).hostname;}catch{$('hosted-service-name').textContent='Not configured';}
      if(changed&&frame)stop('Browser service changed. Start a new connection.');
      if(!config.enabled||(!visible&&!config.keepSession))stop('Start a hosted browser and browse inside this tab.');
    },
    setVisible(next){visible=next;if(!next&&!config.keepSession&&frame)stop('Viewer disconnected to save resources. Start the browser to reconnect.');}
  };
})();
