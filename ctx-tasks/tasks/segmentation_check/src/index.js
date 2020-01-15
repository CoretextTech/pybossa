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
import jsonSchema from './segmentation-data.schema.json';

const TASK_NAME = 'segmentation-check';

const COLORS = [
  '#e6194b',
  '#3cb44b',
  '#ffe119',
  '#4363d8',
  '#f58231',
  '#911eb4',
  '#46f0f0',
  '#f032e6',
  '#bcf60c',
  '#fabebe',
  '#008080',
  '#e6beff',
  '#9a6324',
  '#fffac8',
  '#800000',
  '#aaffc3',
  '#808000',
  '#ffd8b1',
  '#000075',
  '#808080'
];

(function() {
  const $submit = $('#submit');
  const $rationale = $('#rationale');
  const $docBody = $('#all_pages');
  const $viewer = $('#viewer');
  const $segForm = $('#segmentation_form');

  pybossa.taskLoaded(function(task, deferred) {
    if (task && task.id) {
      const inputValid = validateInput(task.info, inputSchema);
  
      if (inputValid) {
        Promise.all([
          fetch(task.info['json'])
            .then(res => res.json())
            .then(json => {
              const dataValid = validateInput(json, jsonSchema);
              if (dataValid)
                return Promise.resolve(json);
              return Promise.reject(new Error('Invalid json data'));
            }),
          loadDocument(task.info['link'])
        ])
          .then(([ json, doc ]) => deferred.resolve({ task, json, doc }))
          .catch(e => console.log(e));
      }
    }
  });

  pybossa.presentTask(({ task, json, doc, error }, deferred) => {
    onTaskLoaded();
    $rationale.val('');

    if (doc) {
      $viewer.html('');
      renderPdfViewer(doc, $docBody.get(0));

      const segments = Object
        .keys(json)
        .reduce((acc, k) => Array.isArray(json[k][0])
          ? [...acc, ...json[k].reduce((acc, arr, i) => [...acc, [`${k}_${i}`, ...arr]], [])]
          : [...acc, [k, ...json[k]]]
        , [])
        .filter(s => s[1] > -1)
        .sort((s1, s2) => s1[1] - s2[1])
        .map(s => isFinite(s[2]) ? s : (s.splice(2,0,-1) && s))
        .map(s => s.map(a => Array.isArray(a) ? a.join('') : a))
        .map(s => (s[3] = s[3].replace(/[\s\c]/g, '')) && s);

      segments.forEach((s, i) => {
        $segForm.append(`
          <span style="
            background: ${COLORS[i]};
            width: 15px;
            height: 15px;
            display: inline-block;
            opacity: 0.5;
          "></span>
          <input type="checkbox" name="${s[0]}"/>
          <label>${s[0]}</label>
          <br/>
        `);
      });

      const onDocumentLoad = setInterval(() => {
        if (!document.querySelector('.page .loadingIcon')) {
          clearInterval(onDocumentLoad);

          $('.textLayer span').map((i, span) => {
            const noSpaceText = span.innerText
              .replace(/[\s\c]/g, '')
              .replace('„', '‘')
              .replace('‟', '’');

            for (const j in segments) {
              if (!segments[j][3].length)
                continue;

              const pos = segments[j][3].indexOf(noSpaceText);

              // Check for miss entries
              pos === -1 && console.log('missed', noSpaceText, segments[j][3].slice(0, noSpaceText.length))

              if (pos === -1)
                continue;

              segments[j][3] = segments[j][3].replace(noSpaceText, '');
              span.style.backgroundColor = COLORS[j];
              break;
            }
          });
        }
      }, 500);
    }
    else {
      $viewer.html(`<p>${error}</p>`);
    }

    $submit
      .removeAttr('disabled')
      .off('click')
      .click(e => {
        $submit.attr('disabled', 'true');

        const formData = $segForm
          .serializeArray()
          .reduce((acc, i) => ({
            ...acc,
            [i.name]: i.value && true
          }), {});

        const answer = {
          'answer': formData,
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