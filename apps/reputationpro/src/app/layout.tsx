import type { Metadata } from 'next';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import './globals.css';
export const metadata:Metadata={title:{default:'ReputationPro — 5★ Google atsiliepimų augimo sistema',template:'%s | ReputationPro'},description:'ReputationPro: Google Maps 5★ atsiliepimų apsaugos ir augimo sistema Lietuvos įmonėms bei paslaugų centrams.',robots:{index:true,follow:true}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="lt"><body><a className="skip-link" href="#main">Pereiti prie turinio</a>{children}</body></html>;}
