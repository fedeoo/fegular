'use strict';
function Scope() {
    this.$$watchers = [];
    this.$$lastDirtyWatch = null;
}

function initWatchVal () {}
function noop () {}

Scope.prototype.$watch = function (watchFn, listenerFn) {
    var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn || noop,
        last: initWatchVal
    };
    this.$$watchers.push(watcher);
};

Scope.prototype.$digest = function () {
    var dirty;
    var ttl = 10;
    this.$$lastDirtyWatch = null;
    do {
        dirty = this.$digestOnce();
        if (dirty && !(ttl--)) {
            throw Error('可能存在循环改变scope');
        }
    } while(dirty);
};

Scope.prototype.$digestOnce = function () {
    var dirty = false;
    var self = this;
    _.forEach(this.$$watchers, function (watcher) {
        var newValue = watcher.watchFn(self);
        var oldValue = watcher.last;
        if (newValue !== oldValue) {
            self.$$lastDirtyWatch = watcher;
            dirty = true;
            watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), self);
            watcher.last = newValue;
        } else if (self.$$lastDirtyWatch === watcher) {
            return false;
        }
    });
    return dirty;
}