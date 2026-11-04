'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="main" className="simple-shell"><h1>Nepavyko atverti puslapio.</h1><p>Pabandykite dar kartą. Jei problema kartojasi, patikrinkite serverio žurnalą.</p><button className="btn btn-primary" onClick={reset}>Bandyti dar kartą</button></main>;}
