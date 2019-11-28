const ajv = new Ajv();

export const validateInput = (jsonInfo, inputSchema) => {
  if (jsonInfo) {
    const valid = ajv.validate(inputSchema, jsonInfo);

    if (valid)
      return true;

    console.error(ajv.errorsText());

    alert('Invalid Input data');
    return false;
  }

  alert('No task data');
  return false;
}


export const validateOutput = (jsonAnswer, outputSchema) => {
  const valid = ajv.validate(outputSchema, jsonAnswer);

  if (!valid) {
    console.error(ajv.errorsText());

    alert('Invalid Output data!');
    return false;
  }

  return true;
}