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
    const valid = validateInput(task.info, inputSchema);

    if (valid) {
      if (task.info['link'] && task.info['link'].length) {
        const $doc = $(`<embed src="${task.info['link']}" width="100%" height="320"/>`);
        $doc.ready(() => deferred.resolve({ task, content: $doc.get(0) }))
      }
      else {
        deferred.resolve({ task, content: $(`<p>No document body</p>`).get(0) });
      }
    }
  });

  pybossa.presentTask(({ task, content }, deferred) => {
    onTaskLoaded();
    $rationale.val('');
    $isContract.val(task.info['classification_result']);
    $docBody.html(content);

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