export function whatsappNumber(value:string){return value.replace(/\D/g,'')}
export function productWhatsAppHref(number:string,name:string){
  const digits=whatsappNumber(number);
  return digits?`https://wa.me/${digits}?text=${encodeURIComponent(`Olá! Tenho interesse neste produto: ${name}`)}`:undefined;
}
