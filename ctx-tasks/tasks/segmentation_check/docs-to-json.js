const fs = require('fs');
const path = require('path');

const tasks = [];
const BASE_URL = 'https://raw.githubusercontent.com/Sinozet/test/master/docs';

fs.readdirSync('./docs', { withFileTypes: true })
  .filter(node => node.isDirectory())
  .forEach(docDirent => {
    const [fileName] = fs.readdirSync(`./docs/${docDirent.name}`);
    const docName =path.parse(fileName).name;
    tasks.push({
      link: `${BASE_URL}/${docDirent.name}/${docName}.pdf`,
      json: `${BASE_URL}/${docDirent.name}/${docName}.seg`,
    });
  });

const data = JSON.stringify(tasks);
fs.writeFileSync('./input.json', data);