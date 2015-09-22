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

    var lotsOfRepeats = [];
    for(var i=0;i<1;++i) {
      lotsOfRepeats.push({name: 'murk', age: 5});
    }

    m.on('formErrors', function(key) {
      this.style.display = (!m.state.model[key] ? 'none' : 'block');
      example.updateModel(modelOutput,null,m.state.keys,m.state.totalCount);
    }).on('repeatedExample', function() {
      example.updateModel(modelOutput,null,m.state.keys,m.state.totalCount);
    }).set({
      formErrors: false,
      repeatedExample: lotsOfRepeats
    });

    example.updateModel(modelOutput,null,m.state.keys,m.state.totalCount);

    $('[data-murk-example-amounts]').on('click', function() {
      var data = this.dataset;
      var ref = m.state.model.repeatedExample;
      for (var i=0;i<parseInt(data.murkExampleAmounts,0);++i) {
        ref.push({ name: 'murk', age: (5+i)});
      }
      m.set('repeatedExample', ref);
      return false;
    });

    $('[data-murk-example-button]').on('click', function() {
      var data = this.dataset;
      var ref = m.get(data.murkExampleItem);
      if (data.murkExampleButton == 'add') {
        var person = {
          name: null,
          age: null
        };
        var safePerson = {
          msg: null
        };
        var $items = $('[data-murk-example-key]');
        for (var i=0;i<$items.length;++i) {
          var item = $items[i];
          var itemData = item.dataset;
          if (item.value) {
            person[itemData.murkExampleKey] = item.value;
          }
        }

        if (!person.name && !person.age) {
          safePerson.msg = 'Name and age fields required';
        } else if (!person.age && person.name) {
          safePerson.msg = 'Age field required';
        } else if (!person.name && person.age) {
          safePerson.msg = 'Name field required';
        }

        if (person.name && person.age) {
          ref.push(person);
          m.set(data.murkExampleItem, ref);
          if (m.get('formErrors')) m.set('formErrors', false);
        } else {
          if (safePerson.msg) {
            m.set('formErrors', safePerson.msg);
          }
        }

      } else if (data.murkExampleButton == 'remove') {
        ref.splice(ref.length-1,1);
        m.set(data.murkExampleItem, ref);
      }
    });
    return m;
  }

  $(d).ready(init);

  return m;

})(window,document);