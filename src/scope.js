'use strict';
var $$lastDirtyWatch = null;
function Scope() {
    this.$$watchers = [];
    this.$$lastDirtyWatch = null;
    this.$$asyncQueue = [];
    this.$$phase = null;
    this.$$applyAsyncQueue = [];
    this.$$postDigestQueue = [];
    this.$$children = [];
    this.$$applyAsyncId = null;
    this.$root = this;
    this.$$listeners = {};
}

function initWatchVal () {}
function noop () {}

Scope.prototype.$watch = function (watchFn, listenerFn, valueEq) {
    this.$root.$$lastDirtyWatch = null;
    var self = this;
    var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn || noop,
        last: initWatchVal,
        valueEq: !!valueEq
    };
    this.$$watchers.unshift(watcher);
    self.$root.$$lastDirtyWatch = null;

    return function () {
        var index = self.$$watchers.indexOf(watcher);
        if (index >= 0) {
            self.$$watchers.splice(index, 1);
            self.$root.$$lastDirtyWatch = null;
        }
    };
};

Scope.prototype.$digest = function () {
    var dirty;
    var ttl = 10;
    this.$beginPhase('$digest');
    this.$root.$$lastDirtyWatch = null;
    if (this.$$applyAsyncId) { 
        clearTimeout(this.$root.$$applyAsyncId); 
        this.$$flushApplyAsync();
    }
    do {
        while(this.$$asyncQueue.length) {
            var asyncTask = this.$$asyncQueue.shift();
            asyncTask.scope.$eval(asyncTask.expression);
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
    var continueLoop = true;
    this.$$everyScope(function (scope) {
        _.forEachRight(scope.$$watchers, function (watcher) {
            try {
                var newValue = watcher.watchFn(scope);
                var oldValue = watcher.last;
                if (!scope.$$areEqual( newValue, oldValue, watcher.valueEq)) {
                    self.$root.$$lastDirtyWatch = watcher;
                    dirty = true;
                    watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
                    watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), scope);
                } else if (self.$root.$$lastDirtyWatch === watcher) { // 赞！循环一次都没脏数据，提前结束循环。
                    return false;
                }
            } catch (e) {
                continueLoop = false;
                console.log(e);
            }
        });
        return continueLoop;
    });
    return dirty;
};

Scope.prototype.$eval = function (fn, locals) {
    return fn(this, locals);
};
Scope.prototype.$apply = function (fn) {
    try {
        this.$beginPhase('$apply');
        this.$eval(fn, this);
    } finally {
        this.$clearPhase('$apply');
        this.$digest();
        this.$root.$digest();
    }
    // if (this.$root !== this) {
    //     this.$root.$apply(fn);
    // }
};

Scope.prototype.$evalAsync = function (fn) { // 感觉很没用的说
    var self = this;
    if (!this.$$phase && !this.$$asyncQueue.length) {
        setTimeout(function () {
            if (self.$$asyncQueue.length) {
                self.$root.$digest();
            }
        }, 0);
    }
    this.$$asyncQueue.push({scope: this, expression: fn});
};

Scope.prototype.$beginPhase = function (phase) {
    if (this.$$phase) {
        throw Error('already exist phase!!!');
    }
    this.$$phase = phase;
};
Scope.prototype.$clearPhase = function () {
    this.$$phase = null;
};

// Scope.prototype.$applyAsync = function (expr) {

//     var self = this;
//     self.$$applyAsyncQueue.push(function () {
//         self.$eval(expr);
//     });
//     setTimeout(function() {
//         self.$apply(function() {
//             while (self.$$applyAsyncQueue.length) {
//                 self.$$applyAsyncQueue.shift()();
//             }
//         });
//     }, 0);
// };

Scope.prototype.$applyAsync = function(expr) {
    var self = this;
    self.$$applyAsyncQueue.push(function() {
        self.$eval(expr, self);
    });
    if (self.$root.$$applyAsyncId === null) {
        self.$root.$$applyAsyncId = setTimeout(function() {
            self.$apply(_.bind(self.$$flushApplyAsync, self));
        }, 0);
    }
};

Scope.prototype.$$flushApplyAsync = function() {
    while (this.$$applyAsyncQueue.length) {
        try {
            this.$$applyAsyncQueue.shift()();
        } catch (e) {
            console.error(e);
        }
    }
    this.$root.$$applyAsyncId = null;
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

Scope.prototype.$watchGroup = function (watchFns, listenerFn) {
    var self = this;
    var changeReactionScheduled = false;
    var newValues = new Array(watchFns.length), oldValues = new Array(watchFns.length);
    var fisrtRun = true;
    if (watchFns.length === 0) {
        // var fn = function () {
        //     listenerFn(newValues, oldValues, self);
        // }
        // self.$evalAsync(fn);
        // return function () {
        //     var index = self.$$asyncQueue.indexOf(fn);
        //     self.$$asyncQueue.splice(index, 1);
        // };
        var shouldcall = true;
        self.$evalAsync(function () {
            if (shouldcall) {
                listenerFn(newValues, oldValues, self);
            }
        });
        return function () {
            shouldcall = false;
        };
    }
    var destroyFns = _.map(watchFns, function (watchFn, index) {
        return self.$watch(watchFn, function (newValue, oldValue) {
            newValues[index] = newValue;
            oldValues[index] = oldValue;
            if (!changeReactionScheduled) {
                changeReactionScheduled = true;
                self.$evalAsync(function () {
                    if (fisrtRun) {
                        fisrtRun = false;
                        listenerFn(newValues, newValues, self);
                    } else {
                        listenerFn(newValues, oldValues, self);
                    }
                    changeReactionScheduled = false;
                });
            }
        });
    });
    return function () {
        // _.forEach(watchFns, function (watchFn, i) {
        //     var index = self.$$watchers.indexOf(watchFn);
        //     self.$$watchers.splice(index, 1);
        // });
        _.forEach(destroyFns, function (destroyFn) {
            destroyFn();
        });
    };
};