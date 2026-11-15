// Controle de cota com operações condicionais atômicas do Netlify Blobs.
export async function reserveQuota(store, key, max, attempts=8){
  for(let n=0;n<attempts;n++){
    const current=await store.getWithMetadata(key,{consistency:'strong',type:'json'});
    if(current===null){
      const created=await store.setJSON(key,{count:1},{onlyIfNew:true});
      if(created.modified)return {allowed:true,used:1};
    }else{
      const count=Number(current.data?.count||0);
      if(!Number.isSafeInteger(count)||count<0)return {allowed:false,error:'Cota indisponível.'};
      if(count>=max)return {allowed:false,used:count};
      const saved=await store.setJSON(key,{count:count+1},{onlyIfMatch:current.etag});
      if(saved.modified)return {allowed:true,used:count+1};
    }
  }
  return {allowed:false,error:'Servidor ocupado, tente novamente.'};
}