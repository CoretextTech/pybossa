# Pybossa tasks

NodeJS v10.10.0+ required

<code>npm install</code> first

<code>npm test</code> to run all tests and validations

<code>npm run build</code> to build html bundles for the all tasks.

Each of the final bundles will be placed in <i>/tasks/[task_name]/dist/bundle.html</i>

Just copy-paste it to the Pybossa presenter editor.

## Input / Output JSON schemas

<code>npm run test_schema</code> to validate all test input and output JSON data in <i>/tasks</i> folder