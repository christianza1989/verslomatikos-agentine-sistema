import {Header,Footer} from '@/components/chrome';import {DemoChat} from '@/components/demo-chat';
export const metadata={title:'Pokalbio demonstracija'};
export default function Demo(){return <><Header/><main className="wrap inner-page"><div className="page-intro"><span className="eyebrow"><span className="dot"/> INTERAKTYVUS PAVYZDYS</span><h1>Pokalbis, kuris veda pirmyn.</h1><p>Išbandykite kliento kelią nuo pirmos žinutės iki pavyzdinio laiko pasirinkimo.</p></div><DemoChat/></main><Footer/></>;}
