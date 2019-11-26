import inputSchema from '../input.schema.json';
import outputSchema from '../input.schema.json';

(function() {
  $submit     = $('#submit');
  $category   = $('#category');
  $title      = $('#title');

  const ajv = new Ajv();

  pybossa.taskLoaded(function(task, deferred){
    if (task && task.info) {
      const valid = ajv.validate(inputSchema, task.info);

      if (valid)
        deferred.resolve(task);
      else
        alert('Invalid Input data');
    }
    else {
      alert('No task data');
    }
  });

  pybossa.presentTask(function(task, deferred){
    if (!$.isEmptyObject(task)) {
      $category.empty();
      task.info['options']
        .split('|')
        .forEach(op => $category
          .append($('<option/>')
            .attr('value', op)
            .attr('selected', op === task.info['category_name'])
            .text(op)));
      $title.text(`"${task.info['tag']}"`);

      $submit
        .removeAttr('disabled')
        .off('click')
        .click(e => {
          $submit.attr('disabled', 'true');
          const answer = $category.val();
          const valid = ajv.validate(outputSchema, answer);

          if (!valid)
            alert('Invalid Output data!');
          else if (typeof answer === undefined)
            alert('Something wrong!');
          else
            pybossa
              .saveTask(task.id, answer)
              .done(deferred.resolve);
          });
    }
  });

  pybossa.run('coretext-title-classifier');
})();