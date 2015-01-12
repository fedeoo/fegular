// Scope.prototype.$watchCollection = function (watchFn, listenFn) {
//     var self = this;
//     var newValue, oldValue;
//     var changeCount = 0;
//     var internalWatchFn = function (scope) {
//         newValue = watchFn(scope);
//         if (_.isObject(newValue)) {
//             if (_.isArrayLike(newValue)) {
//                 if(!_.isArray(oldValue)) {
//                     changeCount++;
//                     oldValue = [];
//                 }
//                 if (newValue.length !== oldValue.length) {
//                     changeCount++;
//                     oldValue.length = newValue.length;
//                 }
//                 _.forEach(newValue, function (newItem, i) {
//                     if (!self.$$areEqual(newItem, oldValue[i])) {
//                         changeCount++;
//                         oldValue[i] = newItem;
//                     }
//                 });
//                 // if (!isEqualCollection(newValue, oldValue)) {
//                 //     changeCount++;
//                 //     oldValue = newValue;
//                 // }
//             } else {
//                 if (!_.isObject(oldValue) || _.isArrayLike(oldValue)) {
//                     changeCount++;
//                     oldValue = [];
//                 }
//                 _.forOwn(newValue, function (newVal, key) {
//                     var bothNaN = _.isNaN(newVal) && _.isNaN(oldValue[key]); 
//                     if (!bothNaN && oldValue[key] !== newVal) {
//                     // if (oldValue[key] !== newVal) {
//                         changeCount++;
//                         oldValue[key] = newVal;
//                     }
//                 });
//                 _forOwn(oldValue, function (oldVal, key) {
//                     if (!newValue.hasOwnProperty(key)) {
//                         changeCount ++;
//                         delete oldValue[key];
//                     }
//                 });
//             }
//         } else {
//             if (!self.$$areEqual(newValue, oldValue, false)) {
//                 changeCount ++;
//             }
//             oldValue = newValue;
//         }

//         return changeCount;
//     };
//     var internalListenFn = function () {
//         listenFn(newValue, oldValue, self);
//     };
//     self.$watch(internalWatchFn, internalListenFn);
//     // this.$watch(watchFn, listenFn);
// };
// 
Scope.prototype.$watchCollection = function(watchFn, listenerFn) {
    var self = this;
    var newValue;
    var oldValue;
    var oldLength;
    var veryOldValue;
    var trackVeryOldValue = (listenerFn.length > 1);
    var changeCount = 0;
    var firstRun = true;

    // watchFn = $parse(watchFn);

    var internalWatchFn = function(scope) {
        var newLength, key;

        newValue = watchFn(scope);
        if (_.isObject(newValue)) {
            if (_.isArrayLike(newValue)) {
                if (!_.isArray(oldValue)) {
                    changeCount++;
                    oldValue = [];
                }
                if (newValue.length !== oldValue.length) {
                    changeCount++;
                    oldValue.length = newValue.length;
                }
                _.forEach(newValue, function(newItem, i) {
                    var bothNaN = _.isNaN(newItem) && _.isNaN(oldValue[i]);
                    if (!bothNaN && newItem !== oldValue[i]) {
                        changeCount++;
                        oldValue[i] = newItem;
                    }
                });
            } else {
                if (!_.isObject(oldValue) || _.isArrayLike(oldValue)) {
                    changeCount++;
                    oldValue = {};
                    oldLength = 0;
                }
                newLength = 0;
                _.forOwn(newValue, function(newVal, key) {
                    newLength++;
                    if (oldValue.hasOwnProperty(key)) {
                        var bothNaN = _.isNaN(newVal) && _.isNaN(oldValue[key]);
                        if (!bothNaN && oldValue[key] !== newVal) {
                            changeCount++;
                            oldValue[key] = newVal;
                        }
                    } else {
                        changeCount++;
                        oldLength++;
                        oldValue[key] = newVal;
                    }
                });
                if (oldLength > newLength) {
                    changeCount++;
                    _.forOwn(oldValue, function(oldVal, key) {
                        if (!newValue.hasOwnProperty(key)) {
                            oldLength--;
                            delete oldValue[key];
                        }
                    });
                }
            }
        } else {
            if (!self.$$areEqual(newValue, oldValue, false)) {
                changeCount++;
            }
            oldValue = newValue;
        }

        return changeCount;
    };

    var internalListenerFn = function() {
        if (firstRun) {
            listenerFn(newValue, newValue, self);
            firstRun = false;
        } else {
            listenerFn(newValue, veryOldValue, self);
        }

        if (trackVeryOldValue) {
            veryOldValue = _.clone(newValue);
        }
    };

    return this.$watch(internalWatchFn, internalListenerFn);
};
_.mixin({
    isArrayLike: function(obj) {
        if (_.isNull(obj) || _.isUndefined(obj)) {
            return false;
        }
        var length = obj.length;
        return length === 0 ||
            (_.isNumber(length) && length > 0 && (length - 1) in obj);
    }
});
function isEqualCollection (newValue, oldValue) {
    if (newValue.length !== oldValue.length) {
        return false;
    }
    return newValue.every(function (item, i) {
        return item === oldValue[i];
    });
}