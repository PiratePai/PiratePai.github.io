const {test}=require('node:test'),assert=require('node:assert/strict');
const {zero,kv,moe,spec}=require('./core-visuals.js');
test('ZeRO conserves model-state bytes across degrees and keeps the shared 16 GB scale',()=>{
 for(const p of [1,4,8,64]){
  const rows=zero(p);const expected=[16,4+12/p,2+14/p,16/p];
  rows.forEach((r,i)=>assert.equal(r.total,expected[i]));
  assert.equal(rows[3].total*p,16);
 }
});
test('copy-on-write preserves A, duplicates only the partial tail and then allocates a new block',()=>{
 const initial=kv(0);assert.equal(initial.pool[1].owners.length,2);
 for(let phase=1;phase<4;phase++){
  const s=kv(phase);assert.deepEqual(s.a,initial.a);
  assert.equal(s.pool[1].n,2);assert.deepEqual(s.pool[1].owners,['A']);
  assert.deepEqual(s.pool[3].owners,['B']);assert.equal(s.pool[5].owners.length,2);
 }
 assert.equal(kv(1).pool[3].n,3);assert.equal(kv(2).pool[3].n,4);
 assert.deepEqual(kv(3).b.map(x=>x.id),[5,3,7]);assert.equal(kv(3).pool[7].n,1);
});
test('top-k gate normalizes selected logits and combines their outputs',()=>{
 const s=moe();assert.deepEqual(s.selected,[0,1]);
 assert(Math.abs(s.weights[0]-.75)<1e-12);assert(Math.abs(s.output-3)<1e-12);
 assert.equal(s.weights[2],0);assert.equal(s.weights[3],0);
 const shifted=moe([1000+Math.log(3),1000,998,997]);
 assert(Math.abs(shifted.output-s.output)<1e-10);
});
test('accepted mass plus residual correction recovers the target, including zero-probability proposals',()=>{
 for(const [p,q] of [[[.2,.5,.3],[.6,.3,.1]],[[0,1],[1,0]],[[.4,.6],[.4,.6]],[[.25,.75],[0,1]]]){
  const s=spec(p,q);s.final.forEach((x,i)=>assert(Math.abs(x-p[i])<1e-12));
  p.forEach((x,i)=>assert(Math.abs(s.accepted[i]+s.rejection*s.residual[i]-x)<1e-12));
  assert(s.residual.every(Number.isFinite));
 }
});
