'use strict';

describe('test hello', function () {
    it('test template', function () {
        expect(_sayhello('fedeoo')).toEqual('Hello, fedeoo!');
    });
});