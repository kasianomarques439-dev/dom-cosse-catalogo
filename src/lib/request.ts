export async function readJsonLimited(request:Request,maxBytes:number):Promise<{ok:true;value:unknown}|{ok:false;status:number;message:string}>{
  if(!request.headers.get('content-type')?.toLowerCase().includes('application/json'))return{ok:false,status:415,message:'Tipo de conteúdo inválido.'};
  const length=Number(request.headers.get('content-length')??0);if(length>maxBytes)return{ok:false,status:413,message:'Dados muito grandes.'};
  if(!request.body)return{ok:false,status:400,message:'JSON inválido.'};
  const reader=request.body.getReader();const chunks:Uint8Array[]=[];let total=0;
  try{while(true){const{done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>maxBytes){await reader.cancel();return{ok:false,status:413,message:'Dados muito grandes.'};}chunks.push(value);}}catch{return{ok:false,status:400,message:'JSON inválido.'};}
  const data=new Uint8Array(total);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength;}
  try{return{ok:true,value:JSON.parse(new TextDecoder().decode(data)) as unknown};}catch{return{ok:false,status:400,message:'JSON inválido.'};}
}
