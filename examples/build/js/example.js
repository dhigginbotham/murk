var example = (function(w,d,pub) {

  var init = function() {
    var container = d.getElementById('example-container');
    container.style.display = 'block';
  };

  pub.updateModel = function(el,model,keys,count) {
    var updated = {};
    if (model) updated.model = model;
    if (keys) updated.keys = keys;
    if (count) updated.count = count;
    el.innerHTML = JSON.stringify(updated,null,2);
    return pub;
  };

  $(d).ready(init);

  return pub;

})(window,document,{});