'use client';
import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button 
      type="button" 
      onClick={() => window.print()} 
      className="btn btn-primary btn-print"
      aria-label="Spausdinti registratūros kortelę"
    >
      <Printer size={16} />
      <span>Spausdinti kortelę</span>
    </button>
  );
}
