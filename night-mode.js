/* Fridge-only automation. No temperature-triggered restart; off wins over Snooze expiry. */
(()=>{
  const key='fridge-night-v1';
  let saved={config:{...NightSchedule.defaults},enabled:false,override:null,device:null};
  try{const data=JSON.parse(localStorage.getItem(key)); if(data){NightSchedule.validate(data.config);saved={...saved,...data};}}catch(_){}
  // Older saved schedules start waiting from this upgrade rather than applying past events.
  if(saved.armedAt!==null&&!Number.isFinite(saved.armedAt)){saved.armedAt=Date.now();localStorage.setItem(key,JSON.stringify(saved));}
  let working=false,applied='',message='';
  const persist=()=>localStorage.setItem(key,JSON.stringify(saved));
  const status=document.getElementById('night-status');
  for(const k of Object.keys(NightSchedule.defaults)) document.getElementById('night-'+k).value=saved.config[k];
  document.getElementById('night-enabled').checked=saved.enabled;
  function render(){
    const active=saved.enabled||saved.override;
    status.textContent=message||(!active?'Night Mode disabled.':!Fridge.isConnected()?'Waiting for fridge connection. Restart cannot run while disconnected.':document.hidden?'Page in background: scheduled commands may be delayed.':'Schedule ready. Times use this phone’s local clock.');
  }
  async function tick(){
    if(working) return;
    if(saved.override&&Date.now()>=saved.override.until){saved.override=null;applied='';persist();}
    if(!saved.enabled&&!saved.override){render();return;}
    if(!Fridge.isConnected()){applied='';message='';render();return;}
    if(saved.device!==Fridge.deviceId()){message='This schedule belongs to another fridge. Save settings to use this fridge.';render();return;}
    const d=NightSchedule.desired(saved.config,new Date(),saved.override,saved.armedAt);
    if(!d){
      const next=NightSchedule.events(saved.config,new Date()).find(e=>e.at>Date.now());
      message='Schedule armed. Fridge unchanged until '+next.phase+' at '+new Date(next.at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})+'.';
      render();return;
    }
    if(!saved.enabled&&!saved.override){render();return;}
    d.key += ':'+Fridge.connectionVersion();
    if(applied===d.key){render();return;}
    working=true;
    try{
      await Fridge.applyNight(d);
      applied=d.key;
      message=d.power?`Confirmed ON at ${d.temp}°C.`:`Confirmed OFF${d.until?' until '+new Date(d.until).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):' until '+saved.config.restart}. No temperature-triggered restart.`;
    }catch(e){message='Not confirmed: '+e.message+' Will retry while connected.';}
    finally{working=false;render();}
  }
  document.getElementById('night-save').onclick=()=>{
    if(working) return;
    try{
      const c={}; for(const k of Object.keys(NightSchedule.defaults)){const v=document.getElementById('night-'+k).value;c[k]=['cold','normal'].includes(k)?Number(v):v;}
      NightSchedule.validate(c);
      const enabled=document.getElementById('night-enabled').checked;
      if(enabled&&!Fridge.isConnected()) throw Error('Connect your fridge before enabling Night Mode.');
      saved.config=c;saved.enabled=enabled;saved.device=Fridge.deviceId()||saved.device;saved.override=null;saved.armedAt=Date.now();applied='';message='';persist();tick();
    }catch(e){message=e.message;render();}
  };
  for(const type of ['snooze','bedtime']) document.getElementById('night-'+type).onclick=()=>{
    if(working) return;
    if(!Fridge.isConnected()){message='Connect your fridge first.';render();return;}
    // These controls also arm the saved daily schedule, so expiry/restart is unambiguous.
    saved.enabled=true;saved.device=Fridge.deviceId();saved.armedAt=null;
    saved.override={until:type==='snooze'?Date.now()+3600000:NightSchedule.nextRestart(saved.config,new Date())};
    document.getElementById('night-enabled').checked=true;applied='';message='';persist();tick();
  };
  document.getElementById('night-cancel').onclick=()=>{
    if(working) return;
    saved.enabled=false;saved.override=null;applied='';message='Automation cancelled. Fridge stays in its current state; use Power to change it.';
    document.getElementById('night-enabled').checked=false;persist();render();
  };
  setInterval(tick,5000);
  document.addEventListener('visibilitychange',()=>{message='';tick();});
  window.addEventListener('pageshow',tick);
  render();tick();
})();
