'use strict';
describe('scope event', function () {
    var scope;
    var parent;
    var child;

    beforeEach(function () {
        parent = new Scope();
        scope = parent.$new();
        child = scope.$new();
        isolatedChild = child.$new(true);
    });

    it("allows registering listeners", function() {
        var listener1 = function() {};
        var listener2 = function() {};
        var listener3 = function() {};

        scope.$on('someEvent', listener1);
        scope.$on('someEvent', listener2);
        scope.$on('someOtherEvent', listener3);

        expect(scope.$$listeners).toEqual({
            someEvent: [listener1, listener2],
            someOtherEvent: [listener3]
        });
    });

    xit("registers different listeners for every scope", function() {
        var listener1 = function() {};
        var listener2 = function() {};
        var listener3 = function() {};

        scope.$on('someEvent', listener1);
        child.$on('someEvent', listener2);
        isolatedChild.$on('someEvent', listener3);

        expect(scope.$$listeners).toEqual({
            someEvent: [listener1]
        });
        expect(child.$$listeners).toEqual({
            someEvent: [listener2]
        });
        expect(isolatedChild.$$listeners).toEqual({
            someEvent: [listener3]
        });
    });

    ['$emit', '$broadcast'].forEach(function(method) {

        xit("calls listeners registered for matching events on " + method, function() {
            var listener1 = jasmine.createSpy();
            var listener2 = jasmine.createSpy();

            scope.$on('someEvent', listener1);
            scope.$on('someOtherEvent', listener2);

            scope[method]('someEvent');

            expect(listener1).toHaveBeenCalled();
            expect(listener2).not.toHaveBeenCalled();
        });

        xit("passes an event object with a name to listeners on " + method, function() {
            var listener = jasmine.createSpy();
            scope.$on('someEvent', listener);

            scope[method]('someEvent');

            expect(listener).toHaveBeenCalled();
            expect(listener.calls.mostRecent().args[0].name).toEqual('someEvent');
        });

        xit("passes the same event object to each listener on " + method, function() {
            var listener1 = jasmine.createSpy();
            var listener2 = jasmine.createSpy();
            scope.$on('someEvent', listener1);
            scope.$on('someEvent', listener2);

            scope[method]('someEvent');

            var event1 = listener1.calls.mostRecent().args[0];
            var event2 = listener2.calls.mostRecent().args[0];
            expect(event1).toBe(event2);
        });

        xit("passes additional arguments to listeners on " + method, function() {
            var listener = jasmine.createSpy();
            scope.$on('someEvent', listener);

            scope[method]('someEvent', 'and', ['additional', 'arguments'], '...');

            expect(listener.calls.mostRecent().args[1]).toEqual('and');
            expect(listener.calls.mostRecent().args[2]).toEqual(['additional', 'arguments']);
            expect(listener.calls.mostRecent().args[3]).toEqual('...');
        });

        xit("returns the event object on " + method, function() {
            var returnedEvent = scope[method]('someEvent');

            expect(returnedEvent).toBeDefined();
            expect(returnedEvent.name).toEqual('someEvent');
        });

        xit("can be deregistered " + method, function() {
            var listener = jasmine.createSpy();
            var deregister = scope.$on('someEvent', listener);

            deregister();

            scope[method]('someEvent');

            expect(listener).not.toHaveBeenCalled();
        });

        xit("does not skip the next listener when removed on " + method, function() {
            var deregister;

            var listener = function() {
                deregister();
            };
            var nextListener = jasmine.createSpy();

            deregister = scope.$on('someEvent', listener);
            scope.$on('someEvent', nextListener);

            scope[method]('someEvent');

            expect(nextListener).toHaveBeenCalled();
        });

        xit("is sets defaultPrevented when default prevented on " + method, function() {
            var listener = function(event) {
                event.preventDefault();
            };
            scope.$on('someEvent', listener);

            var event = scope[method]('someEvent');
            expect(event.defaultPrevented).toBe(true);
        });

        xit("it does not stop on exceptions on " + method, function() {
            var listener1 = function(event) {
                throw 'listener1 throwing an exception';
            };
            var listener2 = jasmine.createSpy();
            scope.$on('someEvent', listener1);
            scope.$on('someEvent', listener2);

            scope[method]('someEvent');

            expect(listener2).toHaveBeenCalled();
        });

    });

    xit("propagates up the scope hierarchy on $emit", function() {
        var parentListener = jasmine.createSpy();
        var scopeListener = jasmine.createSpy();

        parent.$on('someEvent', parentListener);
        scope.$on('someEvent', scopeListener);

        scope.$emit('someEvent');

        expect(scopeListener).toHaveBeenCalled();
        expect(parentListener).toHaveBeenCalled();
    });

    xit("propagates the same event up on $emit", function() {
        var parentListener = jasmine.createSpy();
        var scopeListener = jasmine.createSpy();
        parent.$on('someEvent', parentListener);
        scope.$on('someEvent', scopeListener);

        scope.$emit('someEvent');

        var scopeEvent = scopeListener.calls.mostRecent().args[0];
        var parentEvent = parentListener.calls.mostRecent().args[0];
        expect(scopeEvent).toBe(parentEvent);
    });

    xit("propagates down the scope hierarchy on $broadcast", function() {
        var scopeListener = jasmine.createSpy();
        var childListener = jasmine.createSpy();
        var isolatedChildListener = jasmine.createSpy();

        scope.$on('someEvent', scopeListener);
        child.$on('someEvent', childListener);
        isolatedChild.$on('someEvent', isolatedChildListener);

        scope.$broadcast('someEvent');

        expect(scopeListener).toHaveBeenCalled();
        expect(childListener).toHaveBeenCalled();
        expect(isolatedChildListener).toHaveBeenCalled();
    });

    xit("propagates the same event down on $broadcast", function() {
        var scopeListener = jasmine.createSpy();
        var childListener = jasmine.createSpy();

        scope.$on('someEvent', scopeListener);
        child.$on('someEvent', childListener);

        scope.$broadcast('someEvent');

        var scopeEvent = scopeListener.calls.mostRecent().args[0];
        var childEvent = childListener.calls.mostRecent().args[0];
        expect(scopeEvent).toBe(childEvent);
    });

    xit("attaches targetScope on $emit", function() {
        var scopeListener = jasmine.createSpy();
        var parentListener = jasmine.createSpy();
        scope.$on('someEvent', scopeListener);
        parent.$on('someEvent', parentListener);

        scope.$emit('someEvent');

        expect(scopeListener.calls.mostRecent().args[0].targetScope).toBe(scope);
        expect(parentListener.calls.mostRecent().args[0].targetScope).toBe(scope);
    });
});