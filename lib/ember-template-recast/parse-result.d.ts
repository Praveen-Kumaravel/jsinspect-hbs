import { ASTv1 as AST } from '@glimmer/syntax';
export interface NodeInfo {
    node: AST.Node;
    original: AST.Node;
    source: string;
    parse_result: ParseResult;
    hadHash?: boolean;
    hadParams?: boolean;
    paramsSource?: string;
    hashSource?: string;
    postPathWhitespace?: string;
    postHashWhitespace?: string;
    postParamsWhitespace?: string;
}
export default class ParseResult {
    private source;
    private _originalAst;
    private nodeInfo;
    private ancestor;
    private dirtyFields;
    ast: AST.Template;
    constructor(template: string, nodeInfo: WeakMap<AST.Node, NodeInfo> | undefined, sourceFilename: string);
    private wrapNode;
    private sourceForLoc;
    private markAsDirty;
    private _updateNodeInfoForParamsHash;
    private _rebuildParamsHash;
    print(_ast?: AST.Node): string;
    printUserSuppliedNode(_ast: AST.Node): string;
}
//# sourceMappingURL=parse-result.d.ts.map