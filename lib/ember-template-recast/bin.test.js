"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const fs_1 = require("fs");
const execa_1 = __importDefault(require("execa"));
const path_1 = require("path");
const broccoli_test_helper_1 = require("broccoli-test-helper");
const slash_1 = __importDefault(require("slash"));
const COMPILED_BIN_PATH = path.join(__dirname, '../lib/bin.js');
if (!(0, fs_1.existsSync)(COMPILED_BIN_PATH)) {
    throw new Error('Missing compiled output, run `yarn build`!');
}
function run(args, cwd) {
    return (0, execa_1.default)(process.execPath, [COMPILED_BIN_PATH, ...args], {
        cwd,
    });
}
const transform = `
module.exports = (env) => {
  let { builders: b } = env.syntax;

  return {
    MustacheStatement() {
      return b.mustache(b.path('wat-wat'));
    },
  };
};
`;
describe('ember-template-recast executable', function () {
    let fixture;
    beforeEach(async function () {
        fixture = await (0, broccoli_test_helper_1.createTempDir)();
        fixture.write({
            files: {
                'a.hbs': '{{hello-world}}',
                'b.handlebars': '{{more-mustache foo=bar}}',
                'unchanged.hbs': `nothing to do`,
            },
            'transform.js': transform,
        });
    });
    test('updating files', async function () {
        const { stdout } = await run(['files', '-c', '1'], fixture.path());
        const out = fixture.read();
        expect(stdout).toEqual(`Processing 3 files…
Spawning 1 worker…
Ok:        2
Unchanged: 1`);
        expect(out.files).toEqual({
            'a.hbs': '{{wat-wat}}',
            'b.handlebars': '{{wat-wat}}',
            'unchanged.hbs': 'nothing to do',
        });
    });
    test('dry run', async function () {
        const { stdout } = await run(['files', '-c', '1', '-d'], fixture.path());
        const out = fixture.read();
        expect(stdout).toEqual(`Processing 3 files…
Spawning 1 worker…
Ok:        2
Unchanged: 1`);
        expect(out.files).toEqual({
            'a.hbs': '{{hello-world}}',
            'b.handlebars': '{{more-mustache foo=bar}}',
            'unchanged.hbs': `nothing to do`,
        });
    });
    test('with a bad transform', async function () {
        fixture.write({
            'bad-transform.js': 'module.exports = syntax error',
        });
        try {
            await run(['files', '-t', 'bad-transform.js'], fixture.path());
        }
        catch (error) {
            expect(error.stdout.includes('Error: Unexpected identifier')).toBeTruthy();
            expect(error.stdout.includes((0, path_1.join)(fixture.path(), 'bad-transform.js'))).toBeTruthy();
        }
    });
    test('with a bad template', async function () {
        fixture.write({
            files: {
                'bad-template.hbs': `{{ not { valid (mustache) }`,
            },
        });
        const { stdout } = await run(['files', '-c', '1'], fixture.path());
        const out = fixture.read();
        expect(stdout.includes(`Processing 4 files…
Spawning 1 worker…
Ok:        2
Unchanged: 1
Errored:   1`)).toBeTruthy();
        let badFilePath = (0, slash_1.default)((0, path_1.join)(fixture.path(), 'files/bad-template.hbs'));
        expect(stdout).toEqual(expect.stringContaining(badFilePath));
        expect(stdout.includes('Error: Parse error on line 1:')).toBeTruthy();
        expect(out.files).toEqual({
            'a.hbs': '{{wat-wat}}',
            'b.handlebars': '{{wat-wat}}',
            'unchanged.hbs': `nothing to do`,
            'bad-template.hbs': `{{ not { valid (mustache) }`,
        });
    });
    test('concurrency', async function () {
        const files = Array(300)
            .fill(1)
            .reduce((acc, _, i) => Object.assign(acc, { [`file${i}.hbs`]: '{{hello-world}}' }), {});
        fixture.write({
            'many-files': files,
        });
        const { stdout } = await run(['many-files', '-c', '4'], fixture.path());
        expect(stdout).toEqual(`Processing 300 files…
Spawning 4 workers…
Ok:        300
Unchanged: 0`);
        expect(fixture.readText('many-files/file199.hbs')).toEqual('{{wat-wat}}');
    });
});
//# sourceMappingURL=bin.test.js.map