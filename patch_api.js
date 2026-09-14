const fs = require('fs');

const file1 = 'pages/api/meteorological-stations/index.ts';
let code1 = fs.readFileSync(file1, 'utf8');
code1 = code1.replace(/prisma\.station\./g, 'prisma.meteorologicalStation.');
code1 = code1.replace(/const stations =/g, 'const stations =');
// wait, just replace 'station' with 'meteorologicalStation' where appropriate.
// Let's do it carefully.
code1 = code1.replace(/prisma\.station/g, 'prisma.meteorologicalStation');
code1 = code1.replace(/const stations/g, 'const stations');
code1 = code1.replace(/station: /g, 'station: ');
fs.writeFileSync(file1, code1);

const file2 = 'pages/api/meteorological-stations/[id].ts';
let code2 = fs.readFileSync(file2, 'utf8');
code2 = code2.replace(/prisma\.station/g, 'prisma.meteorologicalStation');
fs.writeFileSync(file2, code2);
