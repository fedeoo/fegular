'use strict';

Scope.prototype.$on = function (name, listenFn) {
    this.$$listeners[name] = this.$$listeners[name] || [];
    this.$$listeners[name].push(listenFn);
};