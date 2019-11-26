const Ajv = require('ajv');
const fs = require('fs');
const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}

const getDirectories = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

getDirectories('./tasks/').forEach(t => {
  const inputSchema = JSON.parse(fs.readFileSync(`./tasks/${t}/input.schema.json`));
  const outputSchema = JSON.parse(fs.readFileSync(`./tasks/${t}/output.schema.json`));
  const testInput = JSON.parse(fs.readFileSync(`./tasks/${t}/test/input.json`));
  const testOutput = JSON.parse(fs.readFileSync(`./tasks/${t}/test/output.json`));

  const validInput = ajv.validate(inputSchema, testInput)
  !validInput && console.log(t, 'invalid input:', ajv.errorsText())

  const validOutput = ajv.validate(outputSchema, testOutput)
  !validOutput && console.log(t, 'invalid output:', ajv.errorsText())

  validInput && validOutput && console.log('Test data is valid in', t, 'task', '\r\n');
})