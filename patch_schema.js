const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const newModel = `
model MeteorologicalStation {
  id                  Int      @id @default(autoincrement())
  name                String
  khmerName           String   @default("")
  river               String?
  category            String?
  monitoringFunctions String?
  powerSupply         String?
  communication       String?
  elevation           Float?
  warningLevel        Float?
  maxCapacityLevel    Float?
  status              String?
  installationDate    DateTime?
  remark              String?
  latitude            Float?
  longitude           Float?
  order               Int      @default(0)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  provinceId          Int
  districtId          Int?
  communeId           Int?
  createdByUserId     Int?

  province      Province        @relation(fields: [provinceId], references: [id])
  district      District?       @relation(fields: [districtId], references: [id])
  commune       Commune?        @relation(fields: [communeId], references: [id])
  createdByUser User?           @relation("MeteorologicalStationCreator", fields: [createdByUserId], references: [id])

  @@index([provinceId])
  @@index([districtId])
  @@index([communeId])
}
`;

if (!schema.includes('model MeteorologicalStation')) {
  schema = schema + '\n' + newModel;
}

schema = schema.replace('  stations     Station[]', '  stations     Station[]\n  meteorologicalStations MeteorologicalStation[]');
schema = schema.replace('  stations  Station[]', '  stations  Station[]\n  meteorologicalStations MeteorologicalStation[]');
schema = schema.replace('  createdStations Station[] @relation("StationCreator")', '  createdStations Station[] @relation("StationCreator")\n  createdMeteorologicalStations MeteorologicalStation[] @relation("MeteorologicalStationCreator")');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema patched.');
