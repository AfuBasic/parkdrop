import { Button, StatusBadge, Input, Field, SearchInput, MoneyInput, PhoneInput, Checkbox, Switch, InlineAlert, EmptyState, ParcelPattern, EmptyParcelIllustration, SyncIllustration } from '@/design-system';
import { toast } from 'sonner';

export function ThemeDemo() {
  return (
    <div className="min-h-screen bg-surface-page text-text-primary p-8 md:p-12 pb-32">
      <div className="max-w-5xl mx-auto space-y-24">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">ParkDrop Field Blue</h1>
          <p className="text-text-secondary text-lg">Design System Demonstration</p>
        </div>

        {/* Colors */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b border-border-default pb-2">Colors</h2>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-text-secondary">Brand Blue</h3>
            <div className="flex flex-wrap gap-4">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(weight => (
                <div key={weight} className="w-20">
                  <div className={`h-12 w-full rounded-md shadow-sm mb-2 bg-pd-blue-${weight}`} style={{ backgroundColor: `var(--color-pd-blue-${weight})` }} />
                  <div className="text-xs font-mono text-text-secondary">{weight}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-text-secondary">Neutral</h3>
            <div className="flex flex-wrap gap-4">
              {[0, 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(weight => (
                <div key={weight} className="w-20">
                  <div className={`h-12 w-full rounded-md shadow-sm mb-2 border border-border-default`} style={{ backgroundColor: `var(--color-pd-neutral-${weight})` }} />
                  <div className="text-xs font-mono text-text-secondary">{weight}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b border-border-default pb-2">Buttons</h2>
          
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <Button loading>Loading...</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        {/* Status Badges */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b border-border-default pb-2">Status Badges</h2>
          <div className="flex flex-wrap gap-4">
            <StatusBadge variant="neutral">Waiting</StatusBadge>
            <StatusBadge variant="success">Collected</StatusBadge>
            <StatusBadge variant="warning">Part Paid</StatusBadge>
            <StatusBadge variant="danger">Failed</StatusBadge>
            <StatusBadge variant="info">Syncing</StatusBadge>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b border-border-default pb-2">Forms & Inputs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Field label="Standard Input" htmlFor="demo-1" helperText="Helper text goes here">
              <Input id="demo-1" placeholder="Placeholder..." />
            </Field>

            <Field label="Error Input" htmlFor="demo-2" error="This field is required">
              <Input id="demo-2" error defaultValue="Invalid value" />
            </Field>

            <Field label="Money Input" htmlFor="demo-3">
              <MoneyInput id="demo-3" placeholder="0" />
            </Field>

            <Field label="Search Input" htmlFor="demo-4">
              <SearchInput id="demo-4" placeholder="Search packages..." />
            </Field>

            <Field label="Phone Input" htmlFor="demo-5">
              <PhoneInput id="demo-5" />
            </Field>
          </div>

          <div className="flex gap-8">
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <label htmlFor="terms" className="text-sm font-medium">Accept terms</label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="airplane-mode" />
              <label htmlFor="airplane-mode" className="text-sm font-medium">Offline mode</label>
            </div>
          </div>
        </section>

        {/* Alerts & Toasts */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b border-border-default pb-2">Alerts & Toasts</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InlineAlert variant="info" title="Information">Your packages are ready to be synced to the server.</InlineAlert>
            <InlineAlert variant="success" title="Success">Package #1234 has been successfully collected.</InlineAlert>
            <InlineAlert variant="warning" title="Warning">You have 5 SMS credits remaining. Please top up soon.</InlineAlert>
            <InlineAlert variant="danger" title="Error">Failed to send SMS to customer. Check connection.</InlineAlert>
          </div>

          <div className="flex flex-wrap gap-4 mt-8">
            <Button variant="secondary" onClick={() => toast("Package saved")}>Default Toast</Button>
            <Button variant="secondary" onClick={() => toast.success("Package collected successfully")}>Success Toast</Button>
            <Button variant="secondary" onClick={() => toast.error("Failed to connect to server")}>Error Toast</Button>
            <Button variant="secondary" onClick={() => toast.warning("Low SMS credits")}>Warning Toast</Button>
            <Button variant="secondary" onClick={() => toast.info("Syncing 5 packages...")}>Info Toast</Button>
          </div>
        </section>

        {/* Illustrations */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold border-b border-border-default pb-2">Illustrations & Empty States</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 border border-border-default rounded-xl bg-surface-default">
              <EmptyState 
                icon={<EmptyParcelIllustration />}
                title="No packages waiting"
                description="Packages that have not been collected will appear here."
                action={<Button size="sm">Add Package</Button>}
              />
            </div>
            
            <div className="p-8 border border-border-default rounded-xl bg-surface-default flex flex-col items-center justify-center text-center">
              <SyncIllustration className="mb-4" />
              <h3 className="font-semibold mb-1 text-text-primary">Syncing...</h3>
              <p className="text-sm text-text-secondary">Please keep the app open</p>
            </div>
          </div>

          <div className="h-48 border border-border-default rounded-xl bg-surface-default relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 z-0">
              <ParcelPattern />
            </div>
            <div className="z-10 bg-surface-default/90 p-4 rounded-lg shadow-sm border border-border-default font-medium">
              Background Pattern Example
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
