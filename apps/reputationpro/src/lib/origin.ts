const loopbackHosts=new Set(['localhost','127.0.0.1','[::1]']);
// The canonical HTTPS hostname works behind a Tunnel. Direct loopback access
// stays usable only when Origin and the actual Host header agree exactly.
export function allowedRequestOrigin(origin:string|null,requestHost:string|null,canonicalUrl:string) {
  if(!origin)return false;
  try{
    if(origin===new URL(canonicalUrl).origin)return true;
    const local=new URL(origin);
    return local.protocol==='http:'&&loopbackHosts.has(local.hostname)&&local.port==='3000'&&local.host===requestHost&&local.origin===origin;
  }catch{return false;}
}
