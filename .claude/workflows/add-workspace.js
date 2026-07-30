export const meta = {
  name: 'add-workspace',
  description:
    'Add a new workspace (nav section) to the app: registers it in the workspace registry, creates a view component, and wires up routing in App.tsx',
  whenToUse: 'Use when adding a new top-level section to the sidebar navigation',
  phases: [
    { title: 'Plan', detail: 'Design workspace entry and view structure' },
    { title: 'Implement', detail: 'Create view and update registry + router' },
    { title: 'Verify', detail: 'Check all wiring is consistent' }
  ]
}

// args: workspace name, e.g. "Analytics" or { name: "Analytics", icon: "BarChart2", tint: "#6366f1" }
const spec = typeof args === 'string' ? { name: args } : (args ?? {})
const workspaceName = spec.name ?? 'NewWorkspace'
const icon = spec.icon ?? 'Layout'
const tint = spec.tint ?? null

phase('Plan')
const plan = await agent(
  `Plan adding a new workspace called "${workspaceName}" to this Electron React app. ` +
    'Read `src/renderer/src/lib/workspaces.ts` (workspace registry), `src/renderer/src/App.tsx` (routing), ' +
    'and one existing view file in `src/renderer/src/views/` to understand the view pattern. ' +
    `Icon: ${icon} (Lucide React). Tint color: ${tint ?? 'pick a suitable oklch value from main.css tokens'}. ` +
    'Return: the workspace id (camelCase), the view file path, the icon name, and the tint color.',
  {
    label: 'plan-workspace',
    schema: {
      type: 'object',
      required: ['id', 'viewFilePath', 'icon', 'tintColor'],
      properties: {
        id: { type: 'string' },
        viewFilePath: { type: 'string' },
        icon: { type: 'string' },
        tintColor: { type: 'string' }
      }
    }
  }
)

log(`Workspace id: "${plan?.id}", view file: ${plan?.viewFilePath}`)

phase('Implement')

// Create view file and update registry + router in parallel (view file is independent of the registry edit)
await parallel([
  () =>
    agent(
      `Create the view file \`${plan?.viewFilePath}\` for the "${workspaceName}" workspace. ` +
        'Follow the exact same pattern as `src/renderer/src/views/DashboardView.tsx`. ' +
        'Use Tailwind v4 oklch tokens for colors, Lucide React for icons, shadcn/ui primitives. ' +
        'Include a meaningful placeholder layout relevant to the workspace name. ' +
        'No window.alert/confirm — use toast.* or confirmDialog() if needed.',
      { label: 'create-view', phase: 'Implement', agentType: 'ui-component-builder' }
    ),
  () =>
    agent(
      `Register the new workspace in \`src/renderer/src/lib/workspaces.ts\`. ` +
        `Add an entry with id: "${plan?.id}", name: "${workspaceName}", icon: ${plan?.icon} (Lucide), ` +
        `tint: "${plan?.tintColor}". Read the file first and match the existing registry entry format exactly.`,
      { label: 'update-registry', phase: 'Implement' }
    )
])

await agent(
  `Wire the new workspace into the router in \`src/renderer/src/App.tsx\`. ` +
    `Import the view from \`${plan?.viewFilePath}\` and add a case for workspace id "${plan?.id}" ` +
    'in the same switch/conditional that renders other workspaces. Read App.tsx first.',
  { label: 'update-router', phase: 'Implement' }
)

phase('Verify')
await agent(
  `Verify the "${workspaceName}" workspace is fully wired: ` +
    `(1) \`${plan?.viewFilePath}\` exists and exports a default React component, ` +
    '(2) `src/renderer/src/lib/workspaces.ts` contains the new entry, ' +
    '(3) `src/renderer/src/App.tsx` imports and renders it for the correct workspace id. ' +
    'Read all three files and report any missing pieces.',
  { label: 'verify-workspace', agentType: 'code-reviewer' }
)

log(`Workspace "${workspaceName}" (id: "${plan?.id}") added successfully.`)
return { id: plan?.id, viewFilePath: plan?.viewFilePath }
