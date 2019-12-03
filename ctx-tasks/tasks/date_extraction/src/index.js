import {
  validateInput,
  validateOutput,
  onTaskLoaded,
  loadDocument,
  renderPdfViewer,
  findInDoc,
  getSelectedInDoc,
  clearSelection
} from '../../pybossa-helpers.js';

import inputSchema from '../input.schema.json';
import outputSchema from '../output.schema.json';

const TASK_NAME = 'date-extraction';

(function() {
  const $submit = $('#submit');
  const $rationale = $('#rationale');
  const $docBody = $('#document_body');
  const $selectedText = $('#selected_text');
  const $recognitionForm = $('#recognition_form');
  const $isRightData = $('#is_right_data');
  const $classificatedDate = $('#classificated_date');

  $recognitionForm.hide();

  $isRightData.change(e => {
    clearSelection();
    $selectedText.html('');

    if (e.target.value === 'no')
      $recognitionForm.slideDown();
    else
      $recognitionForm.slideUp();
  })

  pybossa.taskLoaded((task, deferred) => {
    const valid = validateInput(task.info, inputSchema);

    if (valid) {
      if (task.info['link'] && task.info['link']) 
        loadDocument(task.info['link'])
          .then(doc => deferred.resolve({ task, doc }));
      else
        deferred.resolve({ task, doc: null });
    }
  });

  pybossa.presentTask(({ task, doc }, deferred) => {
    onTaskLoaded();
    $isRightData.val('yes');
    $rationale.val('');
    $selectedText.html('')
    $recognitionForm.hide();

    const hasDate = task.info['extracted_date'] && task.info['extracted_date'].length;
    $classificatedDate.html(hasDate ? task.info['extracted_date'] : 'No Date');

    if (doc) {
      $docBody.html('<div id="viewer" class="pdfViewer"></div>');
      renderPdfViewer(doc, $docBody.get(0))
      hasDate && findInDoc(task.info['extracted_date']);
    }
    else {
      $docBody.html(`<p>No document body link</p>`);
    }

    $docBody
      .off('mouseup')
      .on('mouseup', () => {
        if ($isRightData.val() === 'no') {
          const selectedText = getSelectedInDoc();

          if (selectedText) {
            $selectedText.html(selectedText);
            findInDoc(selectedText);
          } 
        }
      });

    $submit
      .removeAttr('disabled')
      .off('click')
      .click(e => {
        $submit.attr('disabled', 'true');

        const answer = {
          'answer': {
            'is_right': $isRightData.val(),
            'selected_data': $selectedText.text(),
          },
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