export function whatsappNumber(value:string){return value.replace(/\D/g,'')}
function whatsappHref(number:string,message:string){
  const digits=whatsappNumber(number);
  return digits?`https://wa.me/${digits}?text=${encodeURIComponent(message)}`:undefined;
}
export function productWhatsAppMessage(name:string,category:'cuias'|'bombas'){
  return category==='cuias'
    ? `Olá! Vi a cuia ${name} no site da Dom Cossé e gostaria de mais informações.`
    : `Olá! Vi o produto ${name} no site da Dom Cossé e gostaria de mais informações.`;
}
export function productWhatsAppHref(number:string,name:string,category:'cuias'|'bombas'='bombas'){
  return whatsappHref(number,productWhatsAppMessage(name,category));
}
export function retailerWhatsAppHref(number:string){
  return whatsappHref(number,'Olá! Sou lojista e gostaria de conhecer o catálogo e as condições comerciais da Dom Cossé para revenda.');
}
