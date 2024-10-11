#!/usr/bin/env node

const { readDirectory } = require('./processFile');
const path = require('path');
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Select repository
 */
const selectRepository = () => {
  const repoPath = path.join(__dirname, 'repos');
  const repos = fs.readdirSync(repoPath);

  console.log('Select a repository:');
  repos.forEach((repo, index) => {
    console.log(`${index + 1}. ${repo}`);
  });

  rl.question('Enter the number of the repository: ', (answer) => {
    const selectedRepo = repos[parseInt(answer) - 1];
    if (selectedRepo) {
      const repoFullPath = path.join(repoPath, selectedRepo);
      const dictionaryPath = path.join(__dirname, 'dictionary.json');

      console.log(`Processing repository: ${selectedRepo}`);
      readDirectory(repoFullPath, dictionaryPath);
    } else {
      console.log('Invalid selection');
    }
    rl.close();
  });
};

// Inicio del CLI
selectRepository();
