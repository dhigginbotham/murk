#murk
event driven data binding for the modern browser. dependency free, all that cool `js` hipster stuff :neckbeard: tiny `~3kb` component that gives you all the data binding functionality you need, with a `fuck ie8,9, and you too ie10` outlook. view the [demo](http://dhigginbotham.github.io/murk), check out the [examples](https://github.com/dhigginbotham/murk/blob/master/examples/build/js/basic-example.js). 

##API
###Binding
```html
<div data-murk="example"></div>
```
```js
var example = murk({
  // options
}).set({
  example: 'herro, friend.'
});
```
###Events
```js
var example = murk({
  // options
}).on('example', function(key) {
  console.log(key); // example
  console.log(this); // <div data-murk="example"></div>
}).set('example', 'test');
```
###Filters
```js
var example = murk({
  // options
}).registerFilter('filterExample', function(val) {
  return '!!!' + val + '!!!';
});
```
###Repeats
These are `WIP` so expect a change?

```html
<div data-murk="arrayExample" data-murk-repeat="true">
  <div data-murk-repeat="name"></div>
  <div data-murk-repeat="age"></div>
</div>
```
```js
var example = murk({
  // options
}).set('arrayExample', [{
  name: 'ralph',
  age: 21
},{
  name: 'bart',
  age: 44
}]);
```
##Example
You can view the example folder, or checkout the [demo](http://dhigginbotham.github.io/murk) -- here's a fun example of how it all works:

```js
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
      repeatedExample: ['holy','kittens','ye']
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
```