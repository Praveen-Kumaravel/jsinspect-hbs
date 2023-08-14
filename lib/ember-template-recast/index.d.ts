import { traverse, Walker } from '@glimmer/syntax';
import type { ASTv1 as AST, NodeVisitor } from '@glimmer/syntax';
import { builders } from './custom-nodes';
export declare function parse(template: string, sourceFilename: string): AST.Template;
export declare function print(ast: AST.Node): string;
export interface Syntax {
    parse: typeof parse;
    builders: typeof builders;
    print: typeof print;
    traverse: typeof traverse;
    Walker: typeof Walker;
}
export interface TransformPluginEnv {
    syntax: Syntax;
    contents: string;
    filePath?: string;
    parseOptions: {
        srcName?: string;
    };
}
export interface TransformPluginBuilder {
    (env: TransformPluginEnv): NodeVisitor;
}
export interface ASTPlugin {
    name: string;
    visitor: NodeVisitor;
}
export interface TransformResult {
    ast: AST.Template;
    code: string;
}
export interface TransformOptions {
    /**
      The template to transform (either as a string or a pre-parsed AST.Template).
    */
    template: string | AST.Template;
    /**
      The plugin to use for transformation.
    */
    plugin: TransformPluginBuilder;
    /**
      The path (relative to the current working directory) to the file being transformed.
  
      This is useful when a given transform need to have differing behavior based on the
      location of the file (e.g. a component template should be modified differently than
      a route template).
    */
    filePath?: string;
}
export declare function transform(template: string | AST.Template, plugin: TransformPluginBuilder): TransformResult;
export declare function transform(options: TransformOptions): TransformResult;
export type { AST, NodeVisitor } from '@glimmer/syntax';
export { traverse } from '@glimmer/syntax';
export { builders } from './custom-nodes';
export { sourceForLoc } from './utils';
//# sourceMappingURL=index.d.ts.map