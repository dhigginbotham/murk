(function(w,d) {
  
  function init() {
    var m = murk({
      dev: true,
      id: 'demo'
    });

    setupSubscribers(m);
    setupModel(m);
    setupModelOutput(m);
    setupBindingEvents(m);
  }

  function setupModelOutput(m) {
    var modelOutput = document.getElementById('model');
    modelOutput.innerHTML = JSON.stringify({model: m.state.model, keys: m.state.keys},null,2);
  }

  function setupSubscribers(m) {
    m.on(['firstExample','secondExample','thirdExample','fourthExample'], function(key) {
      var count = this.getAttribute('data-murk-count');
      var el = document.getElementById(key + 'Count');
      var input = document.getElementById(key);
      if (!input.value) input.value = decodeURIComponent(this.getAttribute('data-murk-val'));
      if (count) {
          m.set(key + 'Count', count);
          el.style.display = 'inherit';
      }
    });
  }

  function setupModel(m) {
    m.set({
      firstExample: 'this is',
      secondExample: 'data binding',
      thirdExample: 'murked.'
    });
  }

  function setupBindingEvents(m) {
    $('[data-murk-example]').on('keyup blur', function(e) {
      m.set(this.getAttribute('id'), this.value);
      modelOutput.innerHTML = JSON.stringify({model: m.state.model, keys: m.state.keys},null,2);
    });
  }

  $(d).ready(init);

})(window,document);

