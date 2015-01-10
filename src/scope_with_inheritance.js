'use strict';

Scope.prototype.$new = function (isolated, parent) {
    // var scope = new Scope();
    // this.$$children.push(scope);
    // scope.__proto__ = this;
    // return scope;
    parent = parent || this;
    var ChildScope = function () {};
    ChildScope.prototype = this;
    var scope;
    if (isolated) {
        scope = new Scope();
        scope.$root = parent.$root;
        scope.$$asyncQueue = parent.$$asyncQueue;
        scope.$$postDigestQueue = parent.$$postDigestQueue;
    } else {
        scope = new ChildScope();
    }
    scope.$$watchers = [];
    scope.$$children = [];
    scope.$parent = parent;
    parent.$$children.push(scope);
    return scope;
};

Scope.prototype.$destroy = function () {
    if (this !== this.$root) {
        var index = this.$parent.$$children.indexOf(this);
        index >= 0 && this.$parent.$$children.splice(index, 1);
    }
};

Scope.prototype.$$everyScope = function (fn) {
    return fn(this) ? this.$$children.every(function (child) { return child.$$everyScope(fn); }) : false;
};