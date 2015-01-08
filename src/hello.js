'use strict';
function _sayhello (to) {
    return _.template('Hello, <%= name %>!')({name: to});
}