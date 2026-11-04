import '@fontsource/manrope/600.css';import '@fontsource/manrope/700.css';import '@fontsource/manrope/800.css';import '@fontsource/plus-jakarta-sans/400.css';import '@fontsource/plus-jakarta-sans/500.css';import '@fontsource/plus-jakarta-sans/600.css';import '@fontsource/plus-jakarta-sans/700.css';import './globals.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:{default:'ReviveLeads | Verslomatika',template:'%s | ReviveLeads'},description:'Pokalbių su klientais demonstracija ir kontaktų valdymo prototipas.',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="lt"><body>{children}</body></html>;}
