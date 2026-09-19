import type { Meta, StoryObj } from "@storybook/react"
import { StatusBadge } from "./StatusBadge"
import { InlineAlert } from "./InlineAlert"
import { Button } from "./Button"
import { Input } from "./Input"

const meta: Meta = {
  title: "Foundations/Semantic Colors",
  parameters: {
    layout: "padded",
  },
}

export default meta

export const AllStates: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-12 max-w-2xl bg-surface-page p-8 rounded-xl border border-border-default">
      <div>
        <h2 className="text-xl font-bold mb-4">Inline Alerts</h2>
        <div className="flex flex-col gap-4">
          <InlineAlert variant="success" title="Success State">Operation completed successfully.</InlineAlert>
          <InlineAlert variant="info" title="Info State">Here is some information.</InlineAlert>
          <InlineAlert variant="warning" title="Warning State">Please be careful.</InlineAlert>
          <InlineAlert variant="danger" title="Danger State">A critical error occurred.</InlineAlert>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Status Badges</h2>
        <div className="flex flex-wrap gap-4">
          <StatusBadge variant="success">Success</StatusBadge>
          <StatusBadge variant="success-muted">Success Muted</StatusBadge>
          <StatusBadge variant="info">Info</StatusBadge>
          <StatusBadge variant="warning">Warning</StatusBadge>
          <StatusBadge variant="warning-muted">Warning Muted</StatusBadge>
          <StatusBadge variant="danger">Danger</StatusBadge>
          <StatusBadge variant="neutral">Neutral</StatusBadge>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Disabled & Loading States</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button disabled>Disabled Button</Button>
          <Button loading>Loading Button</Button>
          <Input disabled placeholder="Disabled Input" className="max-w-[200px]" />
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4">Field Error State</h2>
        <div className="flex flex-col gap-4">
          <Input error defaultValue="invalid@email" className="max-w-[300px]" />
        </div>
      </div>
    </div>
  ),
}
