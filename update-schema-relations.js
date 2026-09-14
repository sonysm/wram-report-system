const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

schema = schema.replace(/model User \{[\s\S]*?\n\}/, (match) => {
  return match.replace('\n}', '\n  fwucs Fwuc[]\n}');
});

schema = schema.replace(/model Province \{[\s\S]*?\n\}/, (match) => {
  return match.replace('\n}', '\n  fwucs Fwuc[]\n}');
});

schema = schema.replace(/model District \{[\s\S]*?\n\}/, (match) => {
  return match.replace('\n}', '\n  fwucs Fwuc[]\n}');
});

schema = schema.replace(/model Commune \{[\s\S]*?\n\}/, (match) => {
  return match.replace('\n}', '\n  fwucs Fwuc[]\n}');
});

fs.writeFileSync('prisma/schema.prisma', schema);
