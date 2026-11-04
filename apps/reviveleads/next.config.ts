import type {NextConfig} from 'next';
const config:NextConfig={distDir:process.env.REVIVE_BUILD_DIR||'.next',poweredByHeader:false,async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'DENY'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}]}];}};
export default config;
