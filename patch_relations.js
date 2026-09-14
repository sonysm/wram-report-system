const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// For District
schema = schema.replace(
  '  stations        Station[]',
  '  stations        Station[]\n  meteorologicalStations MeteorologicalStation[]'
);

// For Commune
schema = schema.replace(
  '  stations        Station[]',
  '  stations        Station[]\n  meteorologicalStations MeteorologicalStation[]'
);

// For User
schema = schema.replace(
  '  createdStations  Station[]            @relation("StationCreator")',
  '  createdStations  Station[]            @relation("StationCreator")\n  createdMeteorologicalStations MeteorologicalStation[] @relation("MeteorologicalStationCreator")'
);

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Relations patched.');
