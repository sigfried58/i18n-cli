const fs = require('fs');
const babel = require('@babel/core');
const traverse = require('@babel/traverse').default;
const path = require('path');

const logPath = path.join(__dirname, 'logs.txt');

// Función para obtener la clave del diccionario
const getKeyFromText = (text, dictionary) => {
  return Object.keys(dictionary).find(key => dictionary[key] === text);
};

// Procesar archivos JS o TS
const processFile = (filePath, dictionary) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ast = babel.parse(content, { sourceType: 'module', presets: ['@babel/preset-react'] });

  let updatedContent = content;
  let modified = false;
  let missingKeys = [];

  traverse(ast, {
    // Detectar variables declaradas con strings
    VariableDeclarator({ node }) {
      if (node.init && node.init.type === 'StringLiteral') {
        const originalText = node.init.value;
        const key = getKeyFromText(originalText, dictionary);

        if (key) {
          const i18nCode = `t('${key}')`;
          updatedContent = updatedContent.replace(`"${originalText}"`, i18nCode);
          modified = true;
        } else {
          missingKeys.push(originalText);
        }
      }
    },

    // Detectar literales de string
    StringLiteral({ node }) {
      const originalText = node.value;
      // Verificar si ya está reemplazado
      const key = getKeyFromText(originalText, dictionary);

      if (key) {
        const i18nCode = `t('${key}')`;
        updatedContent = updatedContent.replace(`"${originalText}"`, i18nCode);
        modified = true;
      } else {
        missingKeys.push(originalText);
      }
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    console.log(`File updated: ${filePath}`);
  }

  if (missingKeys.length > 0) {
    fs.appendFileSync(logPath, `File: ${filePath}
`);
    missingKeys.forEach(text => fs.appendFileSync(logPath, `  Missing: "${text}"
`));
  }
};

// Procesar archivos JSON
const processJSONFile = (filePath, dictionary) => {
  const jsonContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let modified = false;
  let missingKeys = [];

  for (const key in jsonContent) {
    const originalText = jsonContent[key];
    if (typeof originalText === 'string') {
      const i18nKey = getKeyFromText(originalText, dictionary);

      if (i18nKey) {
        jsonContent[key] = `t('${i18nKey}')`;
        modified = true;
      } else {
        missingKeys.push(originalText);
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf-8');
    console.log(`JSON updated: ${filePath}`);
  }

  if (missingKeys.length > 0) {
    fs.appendFileSync(logPath, `File: ${filePath}
`);
    missingKeys.forEach(text => fs.appendFileSync(logPath, `  Missing: "${text}"
`));
  }
};

// Función para leer el directorio y procesar archivos
const readDirectory = (dir, dictionaryPath) => {
  const dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf-8'));

  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      readDirectory(fullPath, dictionaryPath);
    } else if (file.endsWith('.js') || file.endsWith('.tsx')) {
      processFile(fullPath, dictionary);
    } else if (file.endsWith('.json')) {
      processJSONFile(fullPath, dictionary);
    }
  });
};

module.exports = { readDirectory };
