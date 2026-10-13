/* Local wall-clock events, recalculated after suspension; never replay missed phases. */
(function(root){
  const defaults={pre:'21:00',off:'22:00',restart:'01:00',cold:1,normal:4};
  function validate(c){
    for(const k of ['pre','off','restart']) if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(c[k])) throw Error('Enter valid times.');
    if(new Set([c.pre,c.off,c.restart]).size!==3) throw Error('Choose three different times.');
    const mins=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
    const span=(a,b)=>(mins(b)-mins(a)+1440)%1440;
    if(span(c.pre,c.off)+span(c.off,c.restart)>=1440) throw Error('Times must follow pre-cool → off → restart within one day.');
    for(const k of ['cold','normal']) if(!Number.isInteger(c[k])||c[k]<-20||c[k]>20) throw Error('Temperatures must be whole degrees between −20 and 20°C.');
    return c;
  }
  function events(c,now){
    const out=[];
    for(let day=-1;day<=1;day++) for(const phase of ['pre','off','restart']){
      const d=new Date(now); d.setDate(d.getDate()+day);
      const [h,m]=c[phase].split(':').map(Number); d.setHours(h,m,0,0);
      out.push({phase,at:d.getTime()});
    }
    return out.sort((a,b)=>a.at-b.at);
  }
  function desired(c,now,override){
    if(override&&now.getTime()<override.until) return {power:0,key:'hold:'+override.until,until:override.until};
    const e=events(c,now).filter(e=>e.at<=now.getTime()).pop();
    return {power:e.phase==='off'?0:1,temp:e.phase==='pre'?c.cold:c.normal,key:e.phase+':'+e.at};
  }
  function nextRestart(c,now){return events(c,now).find(e=>e.phase==='restart'&&e.at>now.getTime()).at;}
  const api={defaults,validate,events,desired,nextRestart};
  if(typeof module!=='undefined') module.exports=api; else root.NightSchedule=api;
})(globalThis);
