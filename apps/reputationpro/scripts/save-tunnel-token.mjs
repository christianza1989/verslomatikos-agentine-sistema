// Receive credentials through hidden stdin, never command arguments or logs.
import { mkdirSync,writeFileSync } from 'node:fs';
if(!process.stdin.isTTY)throw new Error('Use a private TTY for token input.');
process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');
process.stdout.write('Ready for private tunnel token input (hidden).\n');
let input='';
process.stdin.on('data',chunk=>{
  if(chunk.includes('\u0003'))process.exit(1);
  input+=chunk;
  if(input.length>20000)process.exit(1);
  if(!input.includes('\n')&&!input.includes('\r'))return;
  try{
    const data=JSON.parse(input.trim());
    if(typeof data.token!=='string'||data.token.length<40||typeof data.tunnel_id!=='string')throw new Error('Invalid input');
    mkdirSync('data/operations',{recursive:true});
    writeFileSync('data/operations/tunnel-token',data.token,{mode:0o600});
    writeFileSync('data/operations/tunnel.json',JSON.stringify({tunnel_id:data.tunnel_id,account_id:data.account_id,hostname:data.hostname},null,2));
    process.stdout.write('Private token saved; value not displayed.\n');
    process.exit(0);
  }catch{process.stdout.write('Invalid private input.\n');process.exit(1);}
});
