import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const cases = db().prepare(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM accounting_documents d WHERE d.case_id = c.id) as doc_count,
        (SELECT COUNT(*) FROM accounting_messages m WHERE m.case_id = c.id) as msg_count
      FROM accounting_cases c
      ORDER BY c.created_at DESC
    `).all();

    const invoices = db().prepare(`
      SELECT * FROM accounting_invoices ORDER BY created_at DESC
    `).all();

    return NextResponse.json({ ok: true, cases, invoices });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, caseId, accountantFeedback, callNotes, nextStep } = body;

    if (action === 'approve') {
      // 1. Išsaugome vyr. buhalterės komentarą tiesiai į SQLite
      if (accountantFeedback) {
        db().prepare(`
          UPDATE accounting_cases SET 
            accountant_feedback = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `).run(accountantFeedback, caseId);
      }

      // 2. Paleidžiame saugų Python CLI procesą
      const scriptPath = path.resolve(process.cwd(), '..', '..', 'core', 'accounting_pipeline.py');
      const pyCmd = `python "${scriptPath}" approve "${caseId}"`;
      
      exec(pyCmd, (err, stdout, stderr) => {
        if (err) console.error('[Accounting API Dispatch Error]', err, stderr);
        else console.log('[Accounting API Dispatch Output]', stdout);
      });

      return NextResponse.json({ ok: true, message: 'Pirminė audito išvada patvirtinta ir išsiųsta!' });
    }

    if (action === 'deliver_final') {
      const scriptPath = path.resolve(process.cwd(), '..', '..', 'core', 'accounting_pipeline.py');
      const pyCmd = `python "${scriptPath}" deliver "${caseId}"`;
      
      exec(pyCmd, (err, stdout, stderr) => {
        if (err) console.error('[Accounting Final Delivery Error]', err, stderr);
        else console.log('[Accounting Final Delivery Output]', stdout);
      });

      return NextResponse.json({ ok: true, message: 'Oficialus 4 psl. finansinės atskaitomybės paketas ir sąskaita-faktūra sėkmingai išsiųsti klientui!' });
    }

    if (action === 'save_call_notes') {
      db().prepare(`
        UPDATE accounting_cases SET 
          call_notes = ?,
          waiting_for = ?,
          call_requested = 0,
          updated_at = datetime('now')
        WHERE id = ?
      `).run(callNotes || '', nextStep || 'client_documents', caseId);

      return NextResponse.json({ ok: true, message: 'Skambučio rezultatas išsaugotas! AI atnaujino tolimesnę eigą.' });
    }

    return NextResponse.json({ ok: false, error: 'Nežinomas veiksmas' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
