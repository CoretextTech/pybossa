import { validateInput, validateOutput, onTaskLoaded } from '../../pybossa-helpers.js';

import inputSchema from '../input.schema.json';
import outputSchema from '../output.schema.json';

const TASK_NAME = 'binary-classification';

(function() {
  const $submit = $('#submit');
  const $isContract = $('#is_contract');
  const $rationale = $('#rationale');
  const $docBody = $('#document_body');

  pybossa.taskLoaded(function(task, deferred) {
    onTaskLoaded();
    const valid = validateInput(task.info, inputSchema);

    if (valid)
      deferred.resolve(task);
  });

  pybossa.presentTask(function(task, deferred) {
    $rationale.val('');
    $isContract.val(task.info['classification_result']);
    $docBody.html(`<embed src="${task.info['link']}" width="100%" height="320"/>`);

    $submit
      .removeAttr('disabled')
      .off('click')
      .click(e => {
        $submit.attr('disabled', 'true');
        
        const answer = {
          'answer': $isContract.val(),
          'rationale': $rationale.val(),
        };

        const valid = validateOutput(answer, outputSchema);

        valid && pybossa
          .saveTask(task.id, answer)
          .done(deferred.resolve);
        });
  });

  pybossa.run(TASK_NAME);
})();