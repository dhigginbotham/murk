var example = (function(w,d) {
  var modelOutput, m;

  m = murk({
    dev: true,
    id: 'demo'
  }).registerFilter('reverseStr', function(val) {
    return val.split('').reverse().join('');
  }).registerFilter('highlightText', function(val) {
    this.style.color = 'red';
  });

  function init() {

    modelOutput = d.getElementById('model');

    m.on('repeatedExample', function(key) {
      modelOutput.innerHTML = JSON.stringify({model: m.state.model, keys: m.state.keys},null,2);
    }).on(['firstExample','secondExample','thirdExample','fourthExample'], function(key) {
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
      thirdExample: 'murked.',
      repeatedExample: [{
        name: 'baz',
        age: 21
      },{
        name: 'foo',
        age: 22
      },{
        name: 'bar',
        age: 23
      }]
    });

    modelOutput.innerHTML = JSON.stringify({model: m.state.model, keys: m.state.keys},null,2);

    $('[data-murk-example]').on('keyup blur', function(e) {
      m.set(this.id, this.value); 
      modelOutput.innerHTML = JSON.stringify({model: m.state.model, keys: m.state.keys},null,2);
    });

    return m;
  }

  $(d).ready(init);

  return m;

})(window,document);