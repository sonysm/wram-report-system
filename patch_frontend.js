const fs = require('fs');
const file = 'pages/meteorological-stations/index.tsx';
let code = fs.readFileSync(file, 'utf8');

// Change API endpoints
code = code.replace(/\/api\/stations/g, '/api/meteorological-stations');

// Change labels
code = code.replace(/ស្ថានីយជលសាស្ត្រ/g, 'ស្ថានីយឧតុនិយម');
code = code.replace(/Station List/g, 'Meteorological Station List');
code = code.replace(/Station Name/g, 'Meteorological Station Name');
code = code.replace(/Add New Station/g, 'Add New Meteorological Station');
code = code.replace(/Edit Station/g, 'Edit Meteorological Station');
code = code.replace(/Failed to update station/g, 'Failed to update meteorological station');
code = code.replace(/Failed to create station/g, 'Failed to create meteorological station');

// Update Interface
code = code.replace('interface Station {', 'interface Station {\n    powerSupply: string | null;\n    communication: string | null;\n    elevation: number | null;');

// Update states
code = code.replace('const [monitoringFunctions, setMonitoringFunctions] = useState("");', 'const [monitoringFunctions, setMonitoringFunctions] = useState("");\n    const [powerSupply, setPowerSupply] = useState("");\n    const [communication, setCommunication] = useState("");\n    const [elevation, setElevation] = useState<number | "">("");');

// Update handleEdit
code = code.replace('setMonitoringFunctions(st.monitoringFunctions || "");', 'setMonitoringFunctions(st.monitoringFunctions || "");\n        setPowerSupply(st.powerSupply || "");\n        setCommunication(st.communication || "");\n        setElevation(st.elevation ?? "");');

// Update handleCancelEdit
code = code.replace('setMonitoringFunctions("");', 'setMonitoringFunctions("");\n        setPowerSupply("");\n        setCommunication("");\n        setElevation("");');

// Update payload
code = code.replace('monitoringFunctions: monitoringFunctions || undefined,', 'monitoringFunctions: monitoringFunctions || undefined,\n            powerSupply: powerSupply || undefined,\n            communication: communication || undefined,\n            elevation: elevation !== "" ? Number(elevation) : undefined,');

fs.writeFileSync(file, code);
console.log('Frontend patched partially.');
