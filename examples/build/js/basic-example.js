var basicExample = (function(w,d) {
  var modelOutput, m;

  m = murk({
    dev: true,
    id: 'basic'
  }).registerFilter('reverseStr', function(val) {
    return val.split('').reverse().join('');
  }).registerFilter('highlightText', function() {
    this.style.color = 'red';
  });

  function init() {

    modelOutput = d.getElementById('basicModel');

    m.on(['firstExample','secondExample','thirdExample','fourthExample'], function(key) {
      var count = this.getAttribute('data-murk-count');
      var el = d.getElementById(key + 'Count');
      var input = d.getElementById(key);
      if (!input.value) input.value = m.state.model[key];
      if (count) {
        m.set(key + 'Count', count);
        el.style.display = 'inherit';
      }
    }).set({
      firstExample: 'this is',
      secondExample: 'data binding',
      thirdExample: 'murked.'
    });

    modelOutput.innerHTML = JSON.stringify({model: m.state.model, keys: m.state.keys},null,2);

    $('[data-murk-example="basic"]').on('keyup blur', function() {
      m.set(this.id, this.value); 
      modelOutput.innerHTML = JSON.stringify({model: m.state.model, keys: m.state.keys},null,2);
    });

    return m;
  }

  $(d).ready(init);

  return m;

})(window,document);