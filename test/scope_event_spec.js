'use strict';
describe('scope event', function () {
    var scope;
    var parent;
    var child;
    var isolatedChild;

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

    it("registers different listeners for every scope", function() {
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

        it("calls listeners registered for matching events on " + method, function() {
            var listener1 = jasmine.createSpy();
            var listener2 = jasmine.createSpy();

            scope.$on('someEvent', listener1);
            scope.$on('someOtherEvent', listener2);

            scope[method]('someEvent');

            expect(listener1).toHaveBeenCalled();
            expect(listener2).not.toHaveBeenCalled();
        });

        it("passes an event object with a name to listeners on " + method, function() {
            var listener = jasmine.createSpy();
            scope.$on('someEvent', listener);

            scope[method]('someEvent');

            expect(listener).toHaveBeenCalled();
            expect(listener.calls.mostRecent().args[0].name).toEqual('someEvent');
        });

        it("passes the same event object to each listener on " + method, function() {
            var listener1 = jasmine.createSpy();
            var listener2 = jasmine.createSpy();
            scope.$on('someEvent', listener1);
            scope.$on('someEvent', listener2);

            scope[method]('someEvent');

            var event1 = listener1.calls.mostRecent().args[0];
            var event2 = listener2.calls.mostRecent().args[0];
            expect(event1).toBe(event2);
        });

        it("passes additional arguments to listeners on " + method, function() {
            var listener = jasmine.createSpy();
            scope.$on('someEvent', listener);

            scope[method]('someEvent', 'and', ['additional', 'arguments'], '...');

            expect(listener.calls.mostRecent().args[1]).toEqual('and');
            expect(listener.calls.mostRecent().args[2]).toEqual(['additional', 'arguments']);
            expect(listener.calls.mostRecent().args[3]).toEqual('...');
        });

        it("returns the event object on " + method, function() {
            var returnedEvent = scope[method]('someEvent');

            expect(returnedEvent).toBeDefined();
            expect(returnedEvent.name).toEqual('someEvent');
        });

        it("can be deregistered " + method, function() {
            var listener = jasmine.createSpy();
            var deregister = scope.$on('someEvent', listener);

            deregister();

            scope[method]('someEvent');

            expect(listener).not.toHaveBeenCalled();
        });

        it("does not skip the next listener when removed on " + method, function() {
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

        it("is sets defaultPrevented when default prevented on " + method, function() {
            var listener = function(event) {
                event.preventDefault();
            };
            scope.$on('someEvent', listener);

            var event = scope[method]('someEvent');
            expect(event.defaultPrevented).toBe(true);
        });

        it("it does not stop on exceptions on " + method, function() {
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

    it("propagates up the scope hierarchy on $emit", function() {
        var parentListener = jasmine.createSpy();
        var scopeListener = jasmine.createSpy();

        parent.$on('someEvent', parentListener);
        scope.$on('someEvent', scopeListener);

        scope.$emit('someEvent');

        expect(scopeListener).toHaveBeenCalled();
        expect(parentListener).toHaveBeenCalled();
    });

    it("propagates the same event up on $emit", function() {
        var parentListener = jasmine.createSpy();
        var scopeListener = jasmine.createSpy();
        parent.$on('someEvent', parentListener);
        scope.$on('someEvent', scopeListener);

        scope.$emit('someEvent');

        var scopeEvent = scopeListener.calls.mostRecent().args[0];
        var parentEvent = parentListener.calls.mostRecent().args[0];
        expect(scopeEvent).toBe(parentEvent);
    });

    it("propagates down the scope hierarchy on $broadcast", function() {
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

    it("propagates the same event down on $broadcast", function() {
        var scopeListener = jasmine.createSpy();
        var childListener = jasmine.createSpy();

        scope.$on('someEvent', scopeListener);
        child.$on('someEvent', childListener);

        scope.$broadcast('someEvent');

        var scopeEvent = scopeListener.calls.mostRecent().args[0];
        var childEvent = childListener.calls.mostRecent().args[0];
        expect(scopeEvent).toBe(childEvent);
    });

    it("attaches targetScope on $emit", function() {
        var scopeListener = jasmine.createSpy();
        var parentListener = jasmine.createSpy();
        scope.$on('someEvent', scopeListener);
        parent.$on('someEvent', parentListener);

        scope.$emit('someEvent');

        expect(scopeListener.calls.mostRecent().args[0].targetScope).toBe(scope);
        expect(parentListener.calls.mostRecent().args[0].targetScope).toBe(scope);
    });

    it("attaches targetScope on $broadcast", function() {
      var scopeListener = jasmine.createSpy();
      var childListener = jasmine.createSpy();
      scope.$on('someEvent', scopeListener);
      child.$on('someEvent', childListener);

      scope.$broadcast('someEvent');

      expect(scopeListener.calls.mostRecent().args[0].targetScope).toBe(scope);
      expect(childListener.calls.mostRecent().args[0].targetScope).toBe(scope);
    });

    it("attaches currentScope on $emit", function() {
      var currentScopeOnScope, currentScopeOnParent;
      var scopeListener = function(event) {
        currentScopeOnScope = event.currentScope;
      };
      var parentListener = function(event) {
        currentScopeOnParent = event.currentScope;
      };
      scope.$on('someEvent', scopeListener);
      parent.$on('someEvent', parentListener);

      scope.$emit('someEvent');

      expect(currentScopeOnScope).toBe(scope);
      expect(currentScopeOnParent).toBe(parent);
    });


    it("attaches currentScope on $emit", function() {
      var currentScopeOnScope, currentScopeOnChild;
      var scopeListener = function(event) {
        currentScopeOnScope = event.currentScope;
      };
      var childListener = function(event) {
        currentScopeOnChild = event.currentScope;
      };
      scope.$on('someEvent', scopeListener);
      child.$on('someEvent', childListener);

      scope.$broadcast('someEvent');

      expect(currentScopeOnScope).toBe(scope);
      expect(currentScopeOnChild).toBe(child);
    });

    it("sets currentScope to null after propagation on $emit", function() {
      var event;
      var scopeListener = function(evt) {
        event = evt;
      };
      scope.$on('someEvent', scopeListener);

      scope.$emit('someEvent');

      expect(event.currentScope).toBe(null);
    });

    it("sets currentScope to null after propagation on $broadcast", function() {
      var event;
      var scopeListener = function(evt) {
        event = evt;
      };
      scope.$on('someEvent', scopeListener);

      scope.$broadcast('someEvent');

      expect(event.currentScope).toBe(null);
    });

    it("does not propagate to parents when stopped", function() {
      var scopeListener = function(event) {
        event.stopPropagation();
      };
      var parentListener = jasmine.createSpy();
      scope.$on('someEvent', scopeListener);
      parent.$on('someEvent', parentListener);

      scope.$emit('someEvent');
      expect(parentListener).not.toHaveBeenCalled();
    });

    it("is received by listeners on current scope after being stopped", function() {
      var listener1 = function(event) {
        event.stopPropagation();
      };
      var listener2 = jasmine.createSpy();
      scope.$on('someEvent', listener1);
      scope.$on('someEvent', listener2);

      scope.$emit('someEvent');

      expect(listener2).toHaveBeenCalled();
    });

    it("fires $destroy when destroyed", function() {
      var listener = jasmine.createSpy();
      scope.$on('$destroy', listener);

      scope.$destroy();

      expect(listener).toHaveBeenCalled();
    });

    it("fires $destroy on children destroyed", function() {
      var listener = jasmine.createSpy();
      child.$on('$destroy', listener);

      scope.$destroy();

      expect(listener).toHaveBeenCalled();
    });

});