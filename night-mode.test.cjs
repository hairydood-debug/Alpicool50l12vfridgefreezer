const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const S=require('./night-schedule.js');
const elements={};
for(const id of ['status','enabled','save','snooze','bedtime','cancel',...Object.keys(S.defaults)]) elements['night-'+id]={value:'',checked:false};
let tick,stored,calls=[],connected=true,fail=false,version=1;
const context={NightSchedule:S,Date,console,
  localStorage:{getItem:()=>null,setItem:(k,v)=>stored=JSON.parse(v)},
  document:{hidden:false,getElementById:id=>elements[id],addEventListener:()=>{}},
  window:{addEventListener:()=>{}},setInterval:fn=>{tick=fn;},
  Fridge:{isConnected:()=>connected,deviceId:()=> 'test-fridge',connectionVersion:()=>version,
    applyNight:async d=>{calls.push(d);if(fail)throw Error('simulated write failure');}}
};
vm.runInNewContext(fs.readFileSync('night-mode.js','utf8'),context);
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  elements['night-snooze'].onclick();await flush();
  assert.equal(calls.at(-1).power,0);assert.equal(stored.enabled,true);
  assert.ok(Math.abs(stored.override.until-Date.now()-3600000)<1000);
  await tick();assert.equal(calls.length,1);
  version++;await tick();assert.equal(calls.length,2); // reapply after rapid reconnect
  elements['night-cancel'].onclick();await tick();assert.equal(calls.length,2);
  assert.equal(stored.override,null);assert.equal(stored.enabled,false);
  fail=true;elements['night-bedtime'].onclick();await flush();
  assert.equal(stored.override.until,S.nextRestart(S.defaults,new Date()));
  assert.match(elements['night-status'].textContent,/Not confirmed/);
  fail=false;await tick();assert.equal(calls.at(-1).power,0);
  assert.match(elements['night-status'].textContent,/Confirmed OFF/);
  connected=false;await tick();assert.match(elements['night-status'].textContent,/Waiting/);
  console.log('Snooze, Bedtime, persistence, cancel, reconnect and failed-write retry checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
