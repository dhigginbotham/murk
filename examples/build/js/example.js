var example = (function(w,d,pub) {

  var init = function() {
    var container = d.getElementById('example-container');
    container.className = container.className.replace('loading-wrapper', '');
  };

  pub.updateModel = function(el,model,keys,count) {
    var tn, val, updated = {};
    if (model) updated.model = model;
    if (keys) updated.keys = keys;
    if (count) updated.count = count;
    val = "" + JSON.stringify(updated,null,2);
    if (el.hasChildNodes()) {
      el.childNodes[0].nodeValue = val;
    } else {
      tn = d.createTextNode(val);
      el.appendChild(tn);
    }
    return pub;
  };

  $(d).ready(init);

  return pub;

})(window,document,{});