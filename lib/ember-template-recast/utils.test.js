"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const _1 = require(".");
describe('utils', function () {
    describe('sortByLoc', function () {
        test('sorts synthetic nodes last', function () {
            let a = _1.builders.pair('a', _1.builders.path('foo') /* no loc, "synthetic" */);
            let b = _1.builders.pair('b', _1.builders.path('foo'), _1.builders.loc(1, 1, 1, 5, 'foo.hbs'));
            let actual = [a, b].sort(utils_1.sortByLoc);
            expect(actual.map((i) => i.key)).toEqual(['a', 'b']);
        });
        test('sorts nodes by their line numbers', function () {
            let a = _1.builders.pair('a', _1.builders.path('foo'), _1.builders.loc(1, 1, 1, 5, 'foo.hbs'));
            let b = _1.builders.pair('b', _1.builders.path('foo'), _1.builders.loc(3, 1, 1, 5, 'foo.hbs'));
            let c = _1.builders.pair('c', _1.builders.path('foo'), _1.builders.loc(2, 1, 1, 5, 'foo.hbs'));
            let actual = [b, a, c].sort(utils_1.sortByLoc);
            expect(actual.map((i) => i.key)).toEqual(['a', 'c', 'b']);
        });
        test('when start line matches, sorts by starting column', function () {
            let a = _1.builders.pair('a', _1.builders.path('foo'), _1.builders.loc(1, 1, 1, 5, 'foo.hbs'));
            let b = _1.builders.pair('b', _1.builders.path('foo'), _1.builders.loc(2, 1, 1, 5, 'foo.hbs'));
            let c = _1.builders.pair('c', _1.builders.path('foo'), _1.builders.loc(1, 6, 1, 9, 'foo.hbs'));
            let actual = [b, a, c].sort(utils_1.sortByLoc);
            expect(actual.map((i) => i.key)).toEqual(['a', 'c', 'b']);
        });
    });
});
//# sourceMappingURL=utils.test.js.map