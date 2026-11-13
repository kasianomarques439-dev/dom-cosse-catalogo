export function whatsappNumber(value:string){
  const digits=value.replace(/\D/g,'');
  return /^\d{10,11}$/.test(digits)?`55${digits}`:digits;
}
function whatsappHref(number:string,message:string){
  const digits=whatsappNumber(number);
  return digits?`https://wa.me/${digits}?text=${encodeURIComponent(message)}`:undefined;
}
export function productWhatsAppMessage(name:string,category:string,details?:{id?:string;quantity?:number|null}){
  const type=category==='lotes-de-cuias'?'lote de cuias':'produto';
  const identifiers=[details?.quantity?`lote com ${details.quantity} cuias`:null,details?.id?`ref. ${details.id}`:null].filter(Boolean);
  return `Olá! Vi o ${type} ${name}${identifiers.length?` (${identifiers.join('; ')})`:''} no site da Dom Cossé e gostaria de mais informações.`;
}
export function productWhatsAppHref(number:string,name:string,category:string='bombas',details?:{id?:string;quantity?:number|null}){
  return whatsappHref(number,productWhatsAppMessage(name,category,details));
}
export function catalogWhatsAppHref(number:string,category?:string|null){
  const label=category==='cuias'?'cuias':category==='bombas'?'bombas':category==='lotes-de-cuias'?'lotes de cuias':null;
  return whatsappHref(number,label?`Olá! Vi a categoria ${label} no catálogo da Dom Cossé e gostaria de mais informações.`:'Olá! Vi o catálogo da Dom Cossé e gostaria de conhecer os produtos disponíveis.');
}
export function retailerWhatsAppHref(number:string){
  return whatsappHref(number,'Olá! Sou lojista e gostaria de conhecer o catálogo e as condições comerciais da Dom Cossé para revenda.');
}
