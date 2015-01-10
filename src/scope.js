'use strict';
function Scope() {
    this.$$watchers = [];
    this.$$lastDirtyWatch = null;
    this.$$asyncQueue = [];
    this.$$phase = null;
    this.$$applyAsyncQueue = [];
    this.$$postDigestQueue = [];
}

function initWatchVal () {}
function noop () {}

Scope.prototype.$watch = function (watchFn, listenerFn, valueEq) {
    this.$$lastDirtyWatch = null;
    var self = this;
    var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn || noop,
        last: initWatchVal,
        valueEq: !!valueEq
    };
    this.$$watchers.unshift(watcher);
    return function () {
        var index = self.$$watchers.indexOf(watcher);
        if (index >= 0) {
            self.$$watchers.splice(index, 1);
            self.$$lastDirtyWatch = null;
        }
    };
};

Scope.prototype.$digest = function () {
    var dirty;
    var ttl = 10;
    this.$beginPhase('$digest');
    this.$$lastDirtyWatch = null;
    do {
        while(this.$$asyncQueue.length) {
            var asyncTask = this.$$asyncQueue.shift();
            asyncTask(this);
        }
        dirty = this.$digestOnce();
        if ((dirty || this.$$asyncQueue.length)&& !(ttl--)) {
            throw Error('digest 10 次了');
        }
    } while(dirty || this.$$asyncQueue.length);
    this.$clearPhase('$apply');

    while(this.$$postDigestQueue.length) {
        var fn = this.$$postDigestQueue.shift();
        fn(self);
    }
};

Scope.prototype.$digestOnce = function () {
    var dirty = false;
    var self = this;
    _.forEachRight(this.$$watchers, function (watcher) {
        try {
            var newValue = watcher.watchFn(self);
            var oldValue = watcher.last;
            if (!self.$$areEqual( newValue, oldValue, watcher.valueEq)) {
                self.$$lastDirtyWatch = watcher;
                dirty = true;
                watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
                watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), self);
            } else if (self.$$lastDirtyWatch === watcher) { // 赞！循环一次都没脏数据，提前结束循环。
                return false;
            }
        } catch (e) {
            console.log(e);
        }
    });
    return dirty;
}

Scope.prototype.$eval = function (fn, args) {
    return fn(this, args);
};
Scope.prototype.$apply = function (fn) {
    try {
        this.$beginPhase('$apply');
        this.$eval(fn);
    } finally {
        this.$clearPhase('$apply');
        this.$digest();
    }
};

Scope.prototype.$evalAsync = function (fn) { // 感觉很没用的说
    var self = this;
    if (!this.$$phase && !this.$$asyncQueue.length) {
        setTimeout(function () {
            if (self.$$asyncQueue.length) {
                self.$digest();
            }
        }, 0);
    }
    this.$$asyncQueue.push(fn);
};

Scope.prototype.$beginPhase = function (phase) {
    if (this.$$phase) {
        throw Error('already exist phase!!!');
    }
    this.$$phase = phase;
};
Scope.prototype.$clearPhase = function () {
    this.$$phase = null;
}

Scope.prototype.$applyAsync = function (expr) {

    var self = this;
    self.$$applyAsyncQueue.push(function () {
        self.$eval(expr);
    });
    setTimeout(function() {
        self.$apply(function() {
            while (self.$$applyAsyncQueue.length) {
                self.$$applyAsyncQueue.shift()();
            }
        });
    }, 0);
};
Scope.prototype.$$areEqual = function (newValue, oldValue, valueEq) {
    if (Number.isNaN(newValue) && Number.isNaN(oldValue)) {
        return true;
    }
    if (valueEq) {
        return _.isEqual(newValue, oldValue);
    } else {
        return newValue === oldValue;
    }
};

Scope.prototype.$$postDigest = function (fn) {
    this.$$postDigestQueue.push(fn);
};