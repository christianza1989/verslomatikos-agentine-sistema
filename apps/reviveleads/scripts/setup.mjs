import {randomBytes} from 'node:crypto';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {userInfo} from 'node:os';
if(!existsSync('.env.local')){const secret=randomBytes(32).toString('hex'),password=randomBytes(18).toString('base64url');writeFileSync('.env.local',`ADMIN_PASSWORD=${password}\nSESSION_SECRET=${secret}\n`,{mode:0o600,flag:'wx'});console.log('Sukurta vietinė prisijungimo konfigūracija .env.local.');}else console.log('Esama vietinė konfigūracija išsaugota.');
mkdirSync('data',{recursive:true});
if(process.platform==='win32'){
 const current=`${process.env.USERDOMAIN}\\${userInfo().username}`;
 execFileSync('icacls.exe',['.env.local','/inheritance:r','/grant:r',`${current}:(F)`,'*S-1-5-18:(F)'],{stdio:'ignore'});
 execFileSync('icacls.exe',['data','/inheritance:r','/grant:r',`${current}:(OI)(CI)F`,'*S-1-5-18:(OI)(CI)F'],{stdio:'ignore'});
}
