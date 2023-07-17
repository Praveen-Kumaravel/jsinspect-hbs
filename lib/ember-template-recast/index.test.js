"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const outdent_1 = __importDefault(require("outdent"));
const filename = './dummy/template.hbs';
describe('ember-template-recast', function () {
    test('basic parse + print (no modification)', function () {
        let template = (0, outdent_1.default) `
      {{foo-bar
        baz="stuff"
      }}`;
        let ast = (0, index_1.parse)(template, filename);
        expect((0, index_1.print)(ast)).toEqual(template);
    });
    test('basic parse + print (no modification): void elements', function () {
        let template = `<br><p>Hi!</p>`;
        let ast = (0, index_1.parse)(template, filename);
        expect((0, index_1.print)(ast)).toEqual(template);
    });
    test('basic parse + print (no modification) preserves blank lines', function () {
        let template = (0, outdent_1.default) `
      {{foo-bar
        baz="stuff"
      }}


`;
        let ast = (0, index_1.parse)(template, filename);
        expect((0, index_1.print)(ast)).toEqual(template);
    });
    test('basic parse -> mutation -> print', function () {
        let template = (0, outdent_1.default) `
      {{foo-bar
        baz="stuff"
        other='single quote'
      }}`;
        let ast = (0, index_1.parse)(template, filename);
        let mustache = ast.body[0];
        mustache.hash.pairs[0].key = 'derp';
        expect((0, index_1.print)(ast)).toEqual((0, outdent_1.default) `
      {{foo-bar
        derp="stuff"
        other='single quote'
      }}`);
    });
    test('basic parse -> mutation: attributes order is preserved -> print', function () {
        let template = (0, outdent_1.default) `
      <div class="foo" ...attributes></div>
      <div ...attributes class="foo"></div>
    `;
        let ast = (0, index_1.parse)(template, filename);
        let b = index_1.builders;
        let { body } = ast;
        function mutateAttributes(attributes) {
            let classAttribute = attributes.find(({ name }) => name === 'class');
            if (classAttribute === undefined) {
                throw new Error('bug: could not find class attribute');
            }
            let index = attributes.indexOf(classAttribute);
            attributes[index] = b.attr('class', b.text('bar'));
        }
        mutateAttributes(body[0].attributes);
        mutateAttributes(body[2].attributes);
        expect((0, index_1.print)(ast)).toEqual((0, outdent_1.default) `
      <div class="bar" ...attributes></div>
      <div ...attributes class="bar"></div>
    `);
    });
    test('basic parse -> mutation -> print: preserves HTML entities', function () {
        let template = (0, outdent_1.default) `<div>&nbsp;</div>`;
        let ast = (0, index_1.parse)(template, filename);
        let element = ast.body[0];
        element.children.push(index_1.builders.text('derp&nbsp;'));
        expect((0, index_1.print)(ast)).toEqual((0, outdent_1.default) `<div>&nbsp;derp&nbsp;</div>`);
    });
    describe('transform', () => {
        describe('legacy arguments', () => {
            test('basic traversal', function () {
                let template = '{{foo-bar bar=foo}}';
                let paths = [];
                (0, index_1.transform)(template, function () {
                    return {
                        PathExpression(node) {
                            paths.push(node.original);
                        },
                    };
                });
                expect(paths).toEqual(['foo-bar', 'foo']);
            });
            test('can handle comment append before html node case', function () {
                let template = '<table></table>';
                let seen = new Set();
                const result = (0, index_1.transform)(template, function ({ syntax }) {
                    const b = syntax.builders;
                    return {
                        ElementNode(node) {
                            if (node.tag === 'table' && !seen.has(node)) {
                                seen.add(node);
                                return [
                                    b.mustacheComment(' template-lint-disable no-table-tag '),
                                    b.text('\n'),
                                    node,
                                ];
                            }
                            return node;
                        },
                    };
                });
                expect(result.code).toEqual(['{{!-- template-lint-disable no-table-tag --}}', '<table></table>'].join('\n'));
            });
            test('can handle comment append between html + newline', function () {
                let template = ['\n', '<table>', '<tbody></tbody>', '</table>'].join('\n');
                let seen = new Set();
                const result = (0, index_1.transform)(template, function ({ syntax }) {
                    const b = syntax.builders;
                    return {
                        ElementNode(node) {
                            if (node.tag === 'table' && !seen.has(node)) {
                                seen.add(node);
                                return [
                                    b.mustacheComment(' template-lint-disable no-table-tag '),
                                    b.text('\n'),
                                    node,
                                ];
                            }
                            return node;
                        },
                    };
                });
                expect(result.code).toEqual([
                    '\n',
                    '{{!-- template-lint-disable no-table-tag --}}',
                    '<table>',
                    '<tbody></tbody>',
                    '</table>',
                ].join('\n'));
            });
            test('can accept an AST', function () {
                let template = '{{foo-bar bar=foo}}';
                let paths = [];
                let ast = (0, index_1.parse)(template, filename);
                (0, index_1.transform)(ast, function () {
                    return {
                        PathExpression(node) {
                            paths.push(node.original);
                        },
                    };
                });
                expect(paths).toEqual(['foo-bar', 'foo']);
            });
            test('returns code and ast', function () {
                let template = '{{foo-bar}}';
                let paths = [];
                let { ast, code } = (0, index_1.transform)(template, function () {
                    return {
                        PathExpression(node) {
                            paths.push(node.original);
                        },
                    };
                });
                expect(ast).toBeTruthy();
                expect(code).toBeTruthy();
            });
            test('replacement', function () {
                let template = '{{foo-bar bar=foo}}';
                let { code } = (0, index_1.transform)(template, (env) => {
                    let { builders: b } = env.syntax;
                    return {
                        MustacheStatement() {
                            return b.mustache(b.path('wat-wat'));
                        },
                    };
                });
                expect(code).toEqual('{{wat-wat}}');
            });
            test('removing the only hash pair on MustacheStatement', function () {
                let template = '{{foo-bar hello="world"}}';
                let { code } = (0, index_1.transform)(template, () => {
                    return {
                        MustacheStatement(ast) {
                            ast.hash.pairs.pop();
                        },
                    };
                });
                expect(code).toEqual('{{foo-bar}}');
            });
            test('pushing new item on to empty hash pair on MustacheStatement works', function () {
                let template = '{{foo-bar}}{{#baz}}Hello!{{/baz}}';
                let { code } = (0, index_1.transform)(template, (env) => {
                    let { builders: b } = env.syntax;
                    return {
                        MustacheStatement(ast) {
                            ast.hash.pairs.push(b.pair('hello', b.string('world')));
                        },
                    };
                });
                expect(code).toEqual('{{foo-bar hello="world"}}{{#baz}}Hello!{{/baz}}');
            });
        });
        test('basic traversal', function () {
            let template = '{{foo-bar bar=foo}}';
            let paths = [];
            (0, index_1.transform)({
                template,
                plugin() {
                    return {
                        PathExpression(node) {
                            paths.push(node.original);
                        },
                    };
                },
            });
            expect(paths).toEqual(['foo-bar', 'foo']);
        });
        test('can handle comment append before html node case', function () {
            let template = '<table></table>';
            let seen = new Set();
            const result = (0, index_1.transform)({
                template,
                plugin({ syntax }) {
                    const b = syntax.builders;
                    return {
                        ElementNode(node) {
                            if (node.tag === 'table' && !seen.has(node)) {
                                seen.add(node);
                                return [
                                    b.mustacheComment(' template-lint-disable no-table-tag '),
                                    b.text('\n'),
                                    node,
                                ];
                            }
                            return node;
                        },
                    };
                },
            });
            expect(result.code).toEqual(['{{!-- template-lint-disable no-table-tag --}}', '<table></table>'].join('\n'));
        });
        test('can handle comment append between html + newline', function () {
            let template = ['\n', '<table>', '<tbody></tbody>', '</table>'].join('\n');
            let seen = new Set();
            const result = (0, index_1.transform)({
                template,
                plugin({ syntax }) {
                    const b = syntax.builders;
                    return {
                        ElementNode(node) {
                            if (node.tag === 'table' && !seen.has(node)) {
                                seen.add(node);
                                return [
                                    b.mustacheComment(' template-lint-disable no-table-tag '),
                                    b.text('\n'),
                                    node,
                                ];
                            }
                            return node;
                        },
                    };
                },
            });
            expect(result.code).toEqual([
                '\n',
                '{{!-- template-lint-disable no-table-tag --}}',
                '<table>',
                '<tbody></tbody>',
                '</table>',
            ].join('\n'));
        });
        test('can accept an AST', function () {
            let template = '{{foo-bar bar=foo}}';
            let paths = [];
            let ast = (0, index_1.parse)(template, filename);
            (0, index_1.transform)({
                template: ast,
                plugin() {
                    return {
                        PathExpression(node) {
                            paths.push(node.original);
                        },
                    };
                },
            });
            expect(paths).toEqual(['foo-bar', 'foo']);
        });
        test('returns code and ast', function () {
            let template = '{{foo-bar}}';
            let paths = [];
            let { ast, code } = (0, index_1.transform)({
                template,
                plugin() {
                    return {
                        PathExpression(node) {
                            paths.push(node.original);
                        },
                    };
                },
            });
            expect(ast).toBeTruthy();
            expect(code).toBeTruthy();
        });
        test('replacement', function () {
            let template = '{{foo-bar bar=foo}}';
            let { code } = (0, index_1.transform)({
                template,
                plugin(env) {
                    let { builders: b } = env.syntax;
                    return {
                        MustacheStatement() {
                            return b.mustache(b.path('wat-wat'));
                        },
                    };
                },
            });
            expect(code).toEqual('{{wat-wat}}');
        });
        test('removing the only hash pair on MustacheStatement', function () {
            let template = '{{foo-bar hello="world"}}';
            let { code } = (0, index_1.transform)({
                template,
                plugin() {
                    return {
                        MustacheStatement(ast) {
                            ast.hash.pairs.pop();
                        },
                    };
                },
            });
            expect(code).toEqual('{{foo-bar}}');
        });
        test('pushing new item on to empty hash pair on MustacheStatement works', function () {
            let template = '{{foo-bar}}{{#baz}}Hello!{{/baz}}';
            let { code } = (0, index_1.transform)({
                template,
                plugin(env) {
                    let { builders: b } = env.syntax;
                    return {
                        MustacheStatement(ast) {
                            ast.hash.pairs.push(b.pair('hello', b.string('world')));
                        },
                    };
                },
            });
            expect(code).toEqual('{{foo-bar hello="world"}}{{#baz}}Hello!{{/baz}}');
        });
    });
    test('Build string from escaped string', function () {
        let template = '{{foo-bar placeholder="Choose a \\"thing\\"..."}}';
        let { code } = (0, index_1.transform)({
            template,
            plugin(env) {
                return {
                    MustacheStatement(node) {
                        let { builders: b } = env.syntax;
                        let value = node.hash.pairs[0].value;
                        let pair = b.pair('p1', b.string(value.original));
                        node.hash.pairs.push(pair);
                    },
                };
            },
        });
        expect(code).toEqual('{{foo-bar placeholder="Choose a \\"thing\\"..." p1="Choose a \\"thing\\"..."}}');
    });
    test('can replace an `AttrNode`s value with a new `ConcatStatement`', function () {
        let b = index_1.builders;
        let template = '<div class="{{if foo "bar"}} baz" />';
        let { code } = (0, index_1.transform)({
            template,
            plugin() {
                return {
                    AttrNode(node) {
                        node.value = b.concat([b.text('foobar'), b.text('baz')]);
                    },
                };
            },
        });
        expect(code).toEqual('<div class="foobarbaz" />');
    });
});
//# sourceMappingURL=index.test.js.map