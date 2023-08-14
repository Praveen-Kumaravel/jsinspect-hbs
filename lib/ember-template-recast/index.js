"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sourceForLoc = exports.builders = exports.traverse = exports.transform = exports.print = exports.parse = void 0;
const syntax_1 = require("@glimmer/syntax");
const parse_result_1 = __importDefault(require("./parse-result"));
const custom_nodes_1 = require("./custom-nodes");
const NODE_INFO = new WeakMap();
function parse(template, sourceFilename) {
    return new parse_result_1.default(template, NODE_INFO, sourceFilename).ast;
}
exports.parse = parse;
function print(ast) {
    return (0, syntax_1.print)(ast, {
        entityEncoding: 'raw',
        override: (ast) => {
            let info = NODE_INFO.get(ast);
            if (info) {
                return info.parse_result.print(ast);
            }
        },
    });
}
exports.print = print;
function transform(templateOrOptions, plugin) {
    let ast;
    let contents;
    let filePath;
    let template;
    if (plugin === undefined) {
        let options = templateOrOptions;
        // TransformOptions invocation style
        template = options.template;
        plugin = options.plugin;
        filePath = options.filePath;
    }
    else {
        template = templateOrOptions;
        filePath = undefined;
    }
    if (typeof template === 'string') {
        ast = parse(template, '');
        contents = template;
    }
    else {
        // assume we were passed an ast
        ast = template;
        contents = print(ast);
    }
    const syntax = {
        parse,
        builders: custom_nodes_1.builders,
        print,
        traverse: syntax_1.traverse,
        Walker: syntax_1.Walker,
    };
    const env = {
        contents,
        filePath,
        syntax,
        parseOptions: {
            srcName: filePath,
        },
    };
    const visitor = plugin(env);
    (0, syntax_1.traverse)(ast, visitor);
    return { ast, code: print(ast) };
}
exports.transform = transform;
var syntax_2 = require("@glimmer/syntax");
Object.defineProperty(exports, "traverse", { enumerable: true, get: function () { return syntax_2.traverse; } });
var custom_nodes_2 = require("./custom-nodes");
Object.defineProperty(exports, "builders", { enumerable: true, get: function () { return custom_nodes_2.builders; } });
var utils_1 = require("./utils");
Object.defineProperty(exports, "sourceForLoc", { enumerable: true, get: function () { return utils_1.sourceForLoc; } });
//# sourceMappingURL=index.js.map