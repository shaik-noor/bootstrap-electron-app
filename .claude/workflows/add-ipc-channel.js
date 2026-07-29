export const meta = {
  name: 'add-ipc-channel',
  description: 'Scaffold a complete new IPC channel across all three required files (main, preload, types)',
  whenToUse: 'Use when adding any new main↔renderer communication channel',
  phases: [
    { title: 'Plan', detail: 'Design channel signature and namespace' },
    { title: 'Implement', detail: 'Write handler, preload wrapper, and type declaration' },
    { title: 'Verify', detail: 'Check all three files are consistent' },
  ],
}

// args should be a description of the channel, e.g.:
// "channel name: file:open, returns: { path: string }, description: opens a native file picker"
const channelSpec = args ?? 'No spec provided — infer from context or ask the user.'

// Phase 1: plan the channel
phase('Plan')
const plan = await agent(
  `You are designing a new Electron IPC channel for this project. Here is the spec:\n\n${channelSpec}\n\n` +
    'Read `src/main/index.ts`, `src/preload/index.ts`, `src/preload/index.d.ts`, and `src/shared/types.ts`. ' +
    'Then produce a precise plan: channel name (namespace:action format), whether it is async (ipcMain.handle) ' +
    'or sync (ipcMain.on), the TypeScript input/output types, which namespace object in preload it belongs to, ' +
    'and any DatabaseService methods it needs.',
  {
    label: 'plan-channel',
    schema: {
      type: 'object',
      required: ['channelName', 'isSync', 'inputType', 'outputType', 'namespace'],
      properties: {
        channelName: { type: 'string' },
        isSync: { type: 'boolean' },
        inputType: { type: 'string' },
        outputType: { type: 'string' },
        namespace: { type: 'string' },
        needsDb: { type: 'boolean' },
        notes: { type: 'string' },
      },
    },
  },
)

log(
  `Planned channel: ${plan?.channelName} (${plan?.isSync ? 'sync' : 'async'}) in namespace "${plan?.namespace}"`,
)

// Phase 2: implement all three files in sequence (they depend on each other)
phase('Implement')

const mainResult = await agent(
  `Implement the ipcMain handler for channel "${plan?.channelName}" in \`src/main/index.ts\`. ` +
    `It is ${plan?.isSync ? 'synchronous (ipcMain.on + event.returnValue)' : 'asynchronous (ipcMain.handle)'}. ` +
    `Input type: ${plan?.inputType}. Output type: ${plan?.outputType}. ` +
    `Use ${plan?.isSync ? 'wrapData (sync version)' : plan?.outputType === 'void' ? 'wrapVoid' : 'wrapData<T>'}. ` +
    (plan?.needsDb ? 'Use DatabaseService static methods for any DB access. ' : '') +
    'Read the file first, then add the handler in the registerIpcHandlers function. Match existing code style exactly.',
  { label: 'implement-main', agentType: 'ipc-builder' },
)

const preloadResult = await agent(
  `The ipcMain handler for "${plan?.channelName}" has been added. Now add the preload wrapper in \`src/preload/index.ts\`. ` +
    `Add it to the "${plan?.namespace}" namespace object. ` +
    `Use ipcRenderer.${plan?.isSync ? 'sendSync' : 'invoke'}("${plan?.channelName}", ...). ` +
    `Input type: ${plan?.inputType}. Output type: IpcResult<${plan?.outputType}>. ` +
    'Read the file first, then make the minimal edit. Match existing code style exactly.',
  { label: 'implement-preload', agentType: 'ipc-builder' },
)

const typesResult = await agent(
  `The preload wrapper for "${plan?.channelName}" has been added to the "${plan?.namespace}" namespace. ` +
    `Now add the TypeScript declaration in \`src/preload/index.d.ts\`. ` +
    `Extend the Window['api']['${plan?.namespace}'] interface with the exact function signature. ` +
    `Input: ${plan?.inputType}. Return: Promise<IpcResult<${plan?.outputType}>>` +
    `${plan?.isSync ? ' (or synchronous IpcResult)' : ''}. ` +
    'Read the file first, then make the minimal edit.',
  { label: 'implement-types', agentType: 'ipc-builder' },
)

// Phase 3: verify consistency
phase('Verify')
await agent(
  `Verify that the IPC channel "${plan?.channelName}" is consistently implemented across all three files: ` +
    '`src/main/index.ts`, `src/preload/index.ts`, and `src/preload/index.d.ts`. ' +
    'Read all three files and confirm: (1) channel name matches exactly, (2) wrapData/wrapVoid is used in main, ' +
    '(3) preload calls invoke/sendSync with the correct channel name, (4) TypeScript types are consistent. ' +
    'Report any discrepancies.',
  { label: 'verify-consistency', agentType: 'code-reviewer' },
)

log(`IPC channel "${plan?.channelName}" scaffolded across all three files.`)
return { channelName: plan?.channelName, namespace: plan?.namespace }
