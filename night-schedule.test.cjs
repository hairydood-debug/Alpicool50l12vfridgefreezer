const assert=require('node:assert/strict');
const S=require('./night-schedule.js');
const c=S.defaults;
const at=t=>new Date('2026-10-13T'+t+':00');
for(const [time,power,temp] of [['20:59',1,4],['21:00',1,1],['21:59',1,1],['22:00',0,4],['00:59',0,4],['01:00',1,4]]){
  const d=S.desired(c,at(time));assert.equal(d.power,power);assert.equal(d.temp,temp);
}
assert.equal(S.nextRestart(c,at('22:00')),new Date('2026-10-14T01:00:00').getTime());
assert.equal(S.nextRestart(c,at('00:30')),at('01:00').getTime());
const hold={until:at('23:00').getTime()};
assert.equal(S.desired(c,at('22:30'),hold).power,0);
assert.equal(S.desired(c,at('23:00'),hold).power,0);
assert.equal(S.desired(c,new Date('2026-10-14T01:01:00'),hold).temp,4);
assert.throws(()=>S.validate({...c,pre:'25:00'}));
assert.throws(()=>S.validate({...c,off:'21:00'}));
assert.throws(()=>S.validate({...c,restart:'21:30'}));
assert.throws(()=>S.validate({...c,cold:NaN}));
S.validate({...c,pre:'08:00',off:'09:00',restart:'12:00'});
console.log('Schedule boundary, midnight, override expiry and validation checks passed.');
