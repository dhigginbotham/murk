var example = (function(w,d,pub) {

  pub.updateModel = function(el,model,keys,count) {
    var updated = {};
    if (model) updated.model = model;
    if (keys) updated.keys = keys;
    if (count) updated.count = count;
    el.innerHTML = JSON.stringify(updated,null,2);
    return pub;
  };

  return pub;

})(window,document,{});