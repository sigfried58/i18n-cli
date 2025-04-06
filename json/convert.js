const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

// Leer Excel
const workbook = xlsx.readFile('json/data.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);
const replacements = new Map(rows.map(row => [row.key, row.value]));

// Leer JSON original
const jsonOriginal = JSON.parse(fs.readFileSync('json/original.json', 'utf-8'));

// Generar todas las posibles particiones del path
function generatePathCombinations(parts) {
  const results = [];

  const helper = (prefix, rest) => {
    if (rest.length === 0) {
      results.push(prefix);
      return;
    }

    for (let i = 1; i <= rest.length; i++) {
      const combined = rest.slice(0, i).join('.');
      helper([...prefix, combined], rest.slice(i));
    }
  };

  helper([], parts);
  return results;
}

// Buscar y reemplazar valor en el JSON según las combinaciones posibles
function setDeepValue(obj, pathStr, newValue) {
  const parts = pathStr.split('.');
  const pathVariants = generatePathCombinations(parts);

  for (const path of pathVariants) {
    let current = obj;
    let found = true;

    for (let i = 0; i < path.length - 1; i++) {
      if (current && typeof current === 'object' && current.hasOwnProperty(path[i])) {
        current = current[path[i]];
      } else {
        found = false;
        break;
      }
    }

    const lastKey = path[path.length - 1];
    if (
      found &&
      current &&
      typeof current === 'object' &&
      current.hasOwnProperty(lastKey)
    ) {
      const oldValue = current[lastKey];
      current[lastKey] = newValue;

      return { replaced: true, oldValue, newValue };
    }
  }

  return { replaced: false };
}

// Aplicar reemplazos y guardar log
const cambios = [];

for (const [key, value] of replacements.entries()) {
  const result = setDeepValue(jsonOriginal, key, value);
  if (result.replaced) {
    cambios.push({ key, oldValue: result.oldValue, newValue: result.newValue });
  } else {
    console.warn(`No se encontró una coincidencia para la key: ${key}`);
  }
}

// Mostrar resumen
console.log('\nResumen de cambios:');
for (const cambio of cambios) {
  console.log(`→ ${cambio.key}: "${cambio.oldValue}" → "${cambio.newValue}"`);
}

// Guardar el JSON modificado
fs.writeFileSync('json/modificado.json', JSON.stringify(jsonOriginal, null, 2));

// Guardar cambios en .log
const logPath = path.join(__dirname, 'cambios.log');
fs.writeFileSync(
  logPath,
  cambios.map(c => `→ ${c.key}: "${c.oldValue}" → "${c.newValue}"`).join('\n'),
  'utf-8'
);

// Guardar cambios en .json
const jsonLogPath = path.join(__dirname, 'cambios.json');
fs.writeFileSync(jsonLogPath, JSON.stringify(cambios, null, 2), 'utf-8');

console.log(`\nSe guardaron los cambios en "modificado.json", "cambios.log" y "cambios.json"`);