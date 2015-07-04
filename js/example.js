(function(w,d) {
  var modelOutput;

  function init() {
    var m = murk({
      dev: true,
      id: 'demo'
    });
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
    
    modelOutput = d.getElementById('model');
    modelOutput.innerHTML = JSON.stringify({model: m.state.model, keys: m.state.keys},null,2);

    $('[data-murk-example]').on('keyup blur', function(e) {
      m.set(this.getAttribute('id'), this.value);
      modelOutput.innerHTML = JSON.stringify({model: m.state.model, keys: m.state.keys},null,2);
    });
  }

  $(d).ready(init);

})(window,document);

