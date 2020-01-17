import {
  validateInput,
  validateOutput,
  onTaskLoaded,
  loadDocument,
  renderPdfViewer
} from '../../pybossa-helpers.js';

import inputSchema from '../input.schema.json';
import outputSchema from '../output.schema.json';
import jsonSchema from './segmentation-data.schema.json';

const TASK_NAME = 'segmentation-check';

const MISS_COUNT_LIMIT = 3;

const COLORS = {
  'cover': '#e6194b',
  'body': '#3cb44b',
  'toc': '#ffe119',
  'appendix': '#4363d8',
  'signature_0': '#f58231',
  'signature_1': '#911eb4',
  'signature_2': '#46f0f0',
  'signature_3': '#f032e6',
  'signature_4': '#bcf60c',
  'signature_5': '#fabebe',
  'signature_6': '#008080',
  'signature_7': '#e6beff',
};

const FREE_COLORS = [
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
  const $render = $('#render_indicator');
  const $viewer = $('#viewer');
  const $segForm = $('#segmentation_form');

  pybossa.taskLoaded(function(task, deferred) {
    const valid = validateInput(task.info, inputSchema);

    if (valid) {
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
  });

  pybossa.presentTask(({ task, json, doc, error }, deferred) => {
    onTaskLoaded();
    $rationale.val('');

    if (doc) {
      $segForm.html('');
      $viewer.html('');
      $render.show();
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
        .map(s => (s[3] = s[3] &&
          s[3]
            .replace(/[\s\c\-]/g, '')
        ) && s)
        .filter(s => s);

      segments.forEach((s, i) => {
        $segForm.append(`
          <span style="
            background: ${COLORS[s[0]] || FREE_COLORS[i % FREE_COLORS.length]};
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
          setTimeout(() => {
            const spanList = document.querySelectorAll('.textLayer span');
            let j = -1;
  
            segments.forEach((seg, i) => {
              let firstFound = false;
              let misses = 0;
              let missLength = 1;
  
              while (spanList[++j]) {
                const noSpaceText = spanList[j].innerText
                  .replace(/\u0301/g, '´')
                  .replace(/[\s\c\-]/g, '')
                  .replace('„', '‘')
                  .replace('‟', '’');
  
                const pos = seg[3].indexOf(noSpaceText);
  
                if (pos > -1 && pos <= missLength) {
                  misses = 0;
                  firstFound = true;
                  seg[3] = seg[3].replace(noSpaceText, '');
                  spanList[j].style.backgroundColor = COLORS[seg[0]] || FREE_COLORS[i % FREE_COLORS.length];
                }
                else if (firstFound) {
                  missLength += noSpaceText.length;
                  misses++;
                }
  
                if (!seg[3].length || misses >= MISS_COUNT_LIMIT) {
                  j = j - misses;
                  break;
                }
              }
            });
            
            $render.hide();
          }, 200);
        }
      }, 200);
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