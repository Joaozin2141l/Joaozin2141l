import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reserveQuota} from '../netlify/functions/_quota.mjs';
function store(){let record=null,etag=0;return {
  async getWithMetadata(){return record?{data:{...record},etag:String(etag)}:null},
  async setJSON(key,data,opts){
    if(opts.onlyIfNew&&record!==null)return {modified:false};
    if(opts.onlyIfMatch&&String(etag)!==opts.onlyIfMatch)return {modified:false};
    record={...data};etag++;return {modified:true,etag:String(etag)};
  }
}}
test('limite global bloqueia apos 2 chamadas',async()=>{
 const s=store();assert.equal((await reserveQuota(s,'calls-2026-11-15',2)).allowed,true);
 assert.equal((await reserveQuota(s,'calls-2026-11-15',2)).allowed,true);
 assert.equal((await reserveQuota(s,'calls-2026-11-15',2)).allowed,false);
});
test('falha fechada se a cota estiver inconsistente',async()=>{
 const s={getWithMetadata:async()=>({data:{count:-2},etag:'t'}),setJSON:async()=>({modified:true})};
 assert.equal((await reserveQuota(s,'calls',2)).allowed,false);
});