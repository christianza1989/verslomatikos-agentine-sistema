// Fail closed until a reviewed release restores verified ownership and billing.
export function billingMode(_env:Record<string,string|undefined>=process.env):'demo'|'sandbox'|'live'|'disabled' { return 'disabled'; }
