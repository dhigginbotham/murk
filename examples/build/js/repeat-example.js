var repeatExample = (function(w,d) {
  var modelOutput, m;

  m = murk({
    dev: true,
    id: 'repeat'
  }).registerFilter('reverseStr', function(val) {
    return val.split('').reverse().join('');
  }).registerFilter('highlightText', function() {
    this.style.color = 'red';
  });

  function init() {

    modelOutput = d.getElementById('repeatModel');

    m.on('formErrors', function(key) {
      this.style.display = (!m.state.model[key] ? 'none' : 'block');
    }).on('repeatedExample', function() {
      modelOutput.innerHTML = JSON.stringify({model: m.state.model, keys: m.state.keys, count: m.state.totalCount},null,2);
    }).set({
      formErrors: false,
      repeatedExample: [{
        name: 'polly',
        age: 29
      },{
        name: 'jolly',
        age: 52
      }]
    });

    modelOutput.innerHTML = JSON.stringify({model: m.state.model, keys: m.state.keys},null,2);

    $('[data-murk-example="repeat"]').on('keyup blur', function() {
      modelOutput.innerHTML = JSON.stringify({model: m.state.model, keys: m.state.keys, count: m.state.totalCount},null,2);
    });

    $('[data-murk-example-button]').on('click', function() {
      var data = this.dataset;
      var ref = m.get(data.murkExampleItem);
      if (data.murkExampleButton == 'add') {
        var person = {
          name: null,
          age: null
        };
        var $items = $('[data-murk-example-key]');
        for (var i=0;i<$items.length;++i) {
          var item = $items[i];
          var itemData = item.dataset;
          if (item.value) {
            person[itemData.murkExampleKey] = item.value;
          } else {
            m.set('formErrors', 'You must fill out ' + itemData.murkExampleKey);
          }
        }
        if (person.name && person.age) {
          ref.push(person);
          m.set('formErrors', false);
        } else {
          m.set('formErrors', 'You must fill out the form');
        }
      } else if (data.murkExampleButton == 'remove') {
        ref = ref.splice(1, ref.length-1);
      }
      m.set(data.murkExampleItem, ref);
    });
    return m;
  }

  $(d).ready(init);

  return m;

})(window,document);