var murk=function(e){return"undefined"!=typeof module&&module.exports?module.exports=e:e}(function(e){function r(e,r,t){if("string"!=typeof r&&"undefined"==typeof t&&(t=r,r=t),t="undefined"==typeof t?!0:!1,"undefined"!=typeof r&&"string"==typeof e){if(y.model[e]=r,y.elems.hasOwnProperty(e))return n(y.elems[e])}else t?m.call(y.model,e):y.model=e;return n(),b}function t(e){return"undefined"!=typeof e?y.model.hasOwnProperty(e)?y.model[e]:null:y.model}function n(e){var r;"undefined"!=typeof e?s(e):(r=y.dom.length?y.dom:i(),Array.prototype.map.call(r,s))}function o(e){e="undefined"==typeof e?document:e;var r=i(e);Array.prototype.map.call(r,s)}function i(e){return e="undefined"==typeof e?document:e,e.getElementsByTagName("*")}function s(e){var r,t;return r=p(e),t=r(h.selectorPrefix),t&&(r(h.selectorPrefix+"-id")||r(h.selectorPrefix+"-id",h.id),r(h.selectorPrefix+"-id")==h.id&&(y.elems.hasOwnProperty(t)||(y.elems[t]=e,~y.keys.indexOf(t)||(y.keys.push(t),y.dom.push(e)),e.innerHTML&&!y.model.hasOwnProperty(t)&&(y.model[t]=e.innerHTML)),y.model.hasOwnProperty(t)?v(r(h.selectorPrefix+"-val"))!=y.model[t]&&l(t):r(h.selectorPrefix+"-bound",!1))),!1}function l(e){function r(n,o){h.dev&&console.log("processed subscriber for %s",e),n.call(y.elems[e],e,function(e,n){return t.length?e?o(e,t):r(t.shift(),o):o?o(null,!0):!0})}y.subscribers.hasOwnProperty(e)||(y.subscribers[e]=[a,d,u]);var t=Array.prototype.slice.call(y.subscribers[e]);r(t.shift())}function f(e,r){function t(e){y.subscribers.hasOwnProperty(e)||(y.subscribers[e]=[a,d,u]),y.subscribers[e].push(r)}return e instanceof Array?Array.prototype.map.call(e,t):t(e),b}function u(e,r){var t,n=p(this);return h.trackCount&&(t=n(h.selectorPrefix+"-count"),n(h.selectorPrefix+"-count",t?parseInt(t,0)+1:1)),r?r(null,!0):void 0}function d(e,r){var t,n;if(t=p(this),t&&(n=t(h.selectorPrefix+"-filter"))){-1!=n.indexOf(",")&&(n=n.split(",")),n instanceof Array||(n=[n]);for(var o=0;o<n.length;++o){var i,s;y.filters.hasOwnProperty(n[o])&&y.model.hasOwnProperty(e)&&(i=t(h.selectorPrefix+"-filtered-val")?v(t(h.selectorPrefix+"-filtered-val")):null,s=y.filters[n[o]].call(this,y.model[e]),"undefined"!=typeof s&&i!=s&&(t(h.selectorPrefix+"-filtered-val",P(s)),this.innerHTML=s))}}return r?r(null,!0):void 0}function c(e,r){return e&&r&&(y.filters[e]=r),b}function a(e,r){var t=p(this);return t(h.selectorPrefix+"-val",P(y.model[e])),t(h.selectorPrefix+"-bound",!0),this.innerHTML=y.model[e],r?r(null,!0):void 0}function p(e){return"undefined"!=typeof e?function(e,r){return"undefined"==typeof r?this.getAttribute(e):this.setAttribute(e,r)}.bind(e):null}function m(e){if("object"==typeof this)for(var r in e)e.hasOwnProperty(r)&&(this[r]=e[r])}var y={model:{},dom:[],elems:{},subscribers:{},filters:{},keys:[],start:Date.now()},h={selectorPrefix:"data-murk",trackCount:!0,dev:!1,id:y.start};e&&m.call(h,e);var P=encodeURIComponent,v=decodeURIComponent,b={};return b.collectDom=o,b.emit=l,b.get=t,b.set=r,b.on=f,b.registerFilter=c,h.dev&&(b.state=y),b});