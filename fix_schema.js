const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// deduplicate 'meteorologicalStations MeteorologicalStation[]'
schema = schema.replace(/  meteorologicalStations MeteorologicalStation\[\]\n  meteorologicalStations MeteorologicalStation\[\]/g, '  meteorologicalStations MeteorologicalStation[]');

// deduplicate 'createdMeteorologicalStations MeteorologicalStation[] @relation("MeteorologicalStationCreator")'
schema = schema.replace(/  createdMeteorologicalStations MeteorologicalStation\[\] @relation\("MeteorologicalStationCreator"\)\n  createdMeteorologicalStations MeteorologicalStation\[\] @relation\("MeteorologicalStationCreator"\)/g, '  createdMeteorologicalStations MeteorologicalStation[] @relation("MeteorologicalStationCreator")');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Fixed duplicates.');
