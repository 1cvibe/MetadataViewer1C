"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeTree = exports.hydrateTree = void 0;
const utils_1 = require("../ConfigurationFormats/utils");
function hydrateTree(node) {
    const children = node.children?.map(hydrateTree);
    const ti = new utils_1.TreeItem(node.id, node.label, children);
    if (node.description)
        ti.description = node.description;
    if (node.tooltip)
        ti.tooltip = node.tooltip;
    if (node.contextValue)
        ti.contextValue = node.contextValue;
    if (node.path)
        ti.path = node.path;
    if (node.parentId)
        ti.parentId = node.parentId;
    if (node.isConfiguration)
        ti.isConfiguration = true;
    if (node.configType)
        ti.configType = node.configType;
    if (node.command) {
        ti.command = {
            command: node.command.command,
            title: node.command.title || '',
            arguments: node.command.arguments,
        };
    }
    // Icon mapping remains handled by TreeItemParams in original builder; here we only preserve context/commands.
    return ti;
}
exports.hydrateTree = hydrateTree;
function serializeTree(t) {
    const cmd = t.command ? { command: t.command.command, title: t.command.title, arguments: t.command.arguments } : undefined;
    return {
        id: t.id,
        label: String(t.label),
        description: typeof t.description === 'string' ? t.description : undefined,
        tooltip: typeof t.tooltip === 'string' ? t.tooltip : undefined,
        contextValue: t.contextValue,
        path: t.path,
        parentId: t.parentId,
        isConfiguration: t.isConfiguration,
        configType: t.configType,
        command: cmd,
        children: t.children?.map(serializeTree),
    };
}
exports.serializeTree = serializeTree;
//# sourceMappingURL=hydrate.js.map