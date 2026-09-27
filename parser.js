export function parseStatement(text, filename = 'statement.txt') {
  const lines = text.replace(/\f/g, '\n').replace(/\r\n?/g, '\n').split('\n');
  const bank = lines.some(line => /ACCOUNTS STATEMENT/i.test(line));
  const header = lines.find(line => /Date\s+.*Balance/i.test(line)) || '';
  if (!header || (!header.includes('Amount Dr') && !header.includes('Debit'))) throw new Error('No supported statement header found. Expected a member or bank statement with Debit/Credit/Balance columns.');
  const columns = bank ? [header.indexOf('Amount Dr'), header.indexOf('Amount Cr'), header.indexOf('Balance')] : [header.indexOf('Debit'), header.indexOf('Credit'), header.indexOf('Balance')];
  const number = raw => {
    const value = raw.trim().replace(/,/g, '');
    return /^-?\d+(?:\.\d{1,2})?$/.test(value) ? Number(value) : null;
  };
  const amount = raw => number(raw.replace(/\b(?:Cr|Dr)\b/gi, '').trim());
  const amounts = line => {
    const end = bank && header.indexOf('Doc Run Total') > 0 ? header.indexOf('Doc Run Total') - 2 : line.length;
    const values = [...line.slice(Math.max(0, columns[0] - 10), end).matchAll(/-?[\d,]+\.\d{2}\b/g)].map(match => ({value:number(match[0]), finish:Math.max(0, columns[0]-10)+match.index+match[0].length}));
    return {debit:values.find(v=>v.finish<=columns[1]+1)?.value??null,credit:values.find(v=>v.finish>columns[1]+1&&v.finish<=columns[2]+1)?.value??null,balance:values.find(v=>v.finish>columns[2]+1)?.value??null};
  };
  let account = bank ? (lines.find(line => /A\/C\s+\S+.*ACCOUNTS STATEMENT/.test(line)) || '').split(/\s{2,}/)[0].trim() : '';
  let member = bank ? '' : (lines.find(line => /\bMno:\s*\S+/.test(line)) || '').split(/\s{2,}/)[0].trim();
  let section = bank ? 'BANK' : '';
  let memberNumber = (lines.join(' ').match(/\bMno:\s*(\S+)/i) || [])[1] || '';
  const rows = [], skipped = [];
  lines.forEach((line, index) => {
    if (!bank) {
      const opening = line.match(/^\s*([A-Z][A-Z\s-]+?)\s{2,}Balance b\/f\b/i);
      if (opening) {
        section = opening[1].trim();
        const balance = [...line.matchAll(/[\d,]+\.\d{2}\b/g)].map(m=>number(m[0])).at(-1)??null;
        rows.push({date:'', reference:'', document:'', cheque:'', particulars:'Balance b/f', debit:null, credit:null, balance, side:(line.slice(columns[2]).match(/\b(Cr|Dr)\b/i)||[])[1]||'', section, line:index+1, kind:'opening'});
        return;
      }
    } else if (/^\s*Balance b\/f\b/.test(line)) {
      rows.push({date:'',reference:'',document:'',cheque:'',particulars:'Balance b/f',debit:null,credit:null,balance:[...line.matchAll(/[\d,]+\.\d{2}\b/g)].map(m=>number(m[0])).at(-1)??null,side:(line.match(/\b(Cr|Dr)\b/i)||[])[1]||'',section,line:index+1,kind:'opening'});
      return;
    }
    const match = line.match(/^\s*(\d{2}\/\d{2}\/\d{4})\s+/);
    if (!match) return;
    const before = line.slice(match[0].length, columns[0]);
    const parts = before.trim().split(/\s{2,}/).filter(Boolean);
    const first = parts[0] || '';
    const refMatch = first.match(/^((?:[A-Z]{2,5}\s+)?[A-Z]{2,5})\s*(.*)$/);
    const reference = refMatch ? refMatch[1].trim() : first;
    const document = refMatch ? refMatch[2].trim() : '';
    const particulars = bank ? (parts.length > 2 ? parts.slice(2).join(' ') : '') : (parts.length > 1 ? parts.slice(1).join(' ') : '');
    const {debit,credit,balance}=amounts(line);
    const balanceCell = line.slice(columns[2], bank && header.indexOf('Doc Run Total') > 0 ? header.indexOf('Doc Run Total') : undefined);
    if (balance === null || (debit === null && credit === null)) {skipped.push(index+1); return;}
    rows.push({date:match[1],reference,document:bank?(parts[1]||''):document,cheque:'',particulars,debit,credit,balance,side:(balanceCell.match(/\b(Cr|Dr)\b/i)||[])[1]||'',section,line:index+1,kind:'transaction'});
  });
  return {filename,type:bank?'Bank statement':'Member statement',member,memberNumber,account,rows,skipped};
}
