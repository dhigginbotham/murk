(function(w,d) {
  var m;

  function init() {
    m = murk({
      dev: true,
      id: 'demo'
    });

    setupSubscribers();
    setupModel();
    setupModelOutput();
    setupBindingEvents();
  }

  function setupModelOutput() {
    var modelOutput = document.getElementById('model');
    modelOutput.innerHTML = JSON.stringify({model: m.state.model, keys: m.state.keys},null,2);
  }

  function setupSubscribers() {
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

  function setupModel() {
    m.set({
      firstExample: 'this is',
      secondExample: 'data binding',
      thirdExample: 'murked.'
    });
  }

  function setupBindingEvents() {
    $('[data-murk-example]').on('keyup blur', function(e) {
      m.set(this.getAttribute('id'), this.value);
      modelOutput.innerHTML = JSON.stringify({model: m.state.model, keys: m.state.keys},null,2);
    });
  }

  $(d).ready(init);

})(window,document);

