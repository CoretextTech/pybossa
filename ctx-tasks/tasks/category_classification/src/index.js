import { validateInput, validateOutput, onTaskLoaded } from '../../pybossa-helpers.js';

import inputSchema from '../input.schema.json';
import outputSchema from '../output.schema.json';

const TASK_NAME = 'categories-classification';

(function() {
  const $submit = $('#submit');
  const $title = $('#title');
  const $categories = $('#categories');
  const $rationale = $('#rationale');
  const $docBody = $('#document_body');

  pybossa.taskLoaded((task, deferred) => {
    const valid = validateInput(task.info, inputSchema);

    if (valid) {
      if (task.info['link'] && task.info['link'].length) {
        const $doc = $(`<embed src="${task.info['link']}"/>`);
        $doc.ready(() => deferred.resolve({ task, content: $doc.get(0) }))
      }
      else {
        deferred.resolve({ task, content: $(`<p>No document body link</p>`).get(0) });
      }
    }
  });

  pybossa.presentTask(({ task, content }, deferred) => {
    onTaskLoaded();
    $rationale.val('');
    $categories.empty();
    $docBody.html(content);

    const classificationVals = task.info['classification_result']
      ? task.info['classification_result'].split('|')
      : [];

    task.info['options']
      .split('|')
      .forEach(op => $categories
        .append($(
          `<div>
            <input id="${op}" type="checkbox" ${classificationVals.includes(op) && 'checked'} name="${op}"/>
            <label for="${op}">${op}</label>
          </div>`
        ))
      );

    $title.text(`"${task.info['title']}"`);

    $submit
      .removeAttr('disabled')
      .off('click')
      .click(e => {
        $submit.attr('disabled', 'true');
        const selectedCats = $categories
          .find('input')
          .filter((i, input) => input.checked)
          .map((i, input) => input.name)
          .toArray()

        const answer = {
          'answer': selectedCats,
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