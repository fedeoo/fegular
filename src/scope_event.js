'use strict';

function Event(name, targetScope, currentScope) {
    this.name = name;
    this.targetScope = targetScope;
    this.currentScope = null;
    this.cancelBubble = false;
    this.defaultPrevented = false;
}
Event.prototype.stopPropagation = function () {
    this.cancelBubble = true;
};
Event.prototype.preventDefault = function () {
    this.defaultPrevented = true;
};

Scope.prototype.$on = function (name, listenFn) {
    this.$$listeners[name] = this.$$listeners[name] || [];
    this.$$listeners[name].push(listenFn);

    var listeners = this.$$listeners[name];
    return function () {
        var index = listeners.indexOf(listenFn);
        if(index >= 0) {
            listeners[index] = null;
        }
    };
};

Scope.prototype.$emit = function (eventName) {
    // var event = {name:eventName, targetScope: this, currentScope: null};
    var event = new Event(eventName, this);
    var args = [].slice.apply(arguments);
    args = [event].concat(args.slice(1));
    // this.$$fireEventOnScope(eventName, args);
    var scope = this;
    do {
        event.currentScope = scope;
        scope.$$fireEventOnScope(eventName, args);
        scope = scope.$parent;
    } while(scope && !event.cancelBubble)
    event.currentScope = null;
    return event;
};

Scope.prototype.$broadcast = function (eventName) {
    // var event = {name:eventName, targetScope: this};
    var event = new Event(eventName, this);
    var args = [].slice.apply(arguments);
    args = [event].concat(args.slice(1));
    this.$$everyScope(function (scope) {
        event.currentScope = scope;
        scope.$$fireEventOnScope(eventName, args);
        return true;
    });
    event.currentScope = null;
    return event;
};

Scope.prototype.$$fireEventOnScope = function (eventName, args) {
    var i = 0;
    var listenFns = this.$$listeners[eventName] || [];
    while(i < listenFns.length) {
        if (listenFns[i] === null) {
            listenFns.splice(i, 1);
        } else {
            try {
                listenFns[i].apply(null, args);
            } catch (e) {
                console.log(e);
            }
            i++;
        }
    }
    return event;
};

Scope.prototype.$destroy = function () {
    if (this === this.$root) {
        return;
    }
    var siblings = this.$parent.$$children;
    var index = siblings.indexOf(this);
    index >= 0 && siblings.splice(index);
    this.$broadcast('$destroy');
};