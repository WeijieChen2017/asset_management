import { useMemo, useState } from 'react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Drawer } from './ui/Drawer';
import { useToast } from './ui/Toast';
import type { MLModelDef } from '../data/mlModels';

interface MLModelDrawerProps {
  open: boolean;
  model: MLModelDef | null;
  inputPayload: Record<string, unknown> | null;
  onClose: () => void;
  onRunMock: (model: MLModelDef) => void;
}

export function MLModelDrawer({ open, model, inputPayload, onClose, onRunMock }: MLModelDrawerProps) {
  const { toast } = useToast();
  const [showInput, setShowInput] = useState(true);
  const [showOutput, setShowOutput] = useState(true);

  const inputJson = useMemo(
    () => JSON.stringify(inputPayload ?? {}, null, 2),
    [inputPayload]
  );
  const outputJson = useMemo(
    () => JSON.stringify(model?.mockOutput ?? {}, null, 2),
    [model]
  );

  const copyJson = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast(`${label} copied`, 'success');
    } catch {
      toast(`Failed to copy ${label.toLowerCase()}`, 'error');
    }
  };

  if (!model) {
    return <Drawer open={open} onClose={onClose} title="Run ML Model" />;
  }

  return (
    <Drawer open={open} onClose={onClose} title={`Run ${model.id} (${model.location})`}>
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary">{model.name}</h3>
          <Badge variant="info">{model.location}</Badge>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Goal</p>
          <p className="text-sm text-text-secondary">{model.goal}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Owning Backend Module</p>
          <code className="text-xs text-text-primary">{model.owningModule}</code>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Reads From State Paths</p>
            <div className="space-y-1">
              {model.readsFrom.map((path) => (
                <code key={path} className="block text-xs text-text-secondary">{path}</code>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Writes To State Paths</p>
            <div className="space-y-1">
              {model.writesTo.map((path) => (
                <code key={path} className="block text-xs text-text-secondary">{path}</code>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Transfers (Input JSON)</p>
            <Button variant="secondary" size="sm" onClick={() => setShowInput((v) => !v)}>
              {showInput ? 'Collapse' : 'Expand'}
            </Button>
          </div>
          {showInput && (
            <pre className="text-xs bg-surface-3 border border-border-custom rounded-lg p-3 overflow-x-auto text-text-secondary">{inputJson}</pre>
          )}
          <Button variant="secondary" size="sm" onClick={() => copyJson('Input JSON', inputJson)}>
            Copy Input JSON
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Expected Output JSON</p>
            <Button variant="secondary" size="sm" onClick={() => setShowOutput((v) => !v)}>
              {showOutput ? 'Collapse' : 'Expand'}
            </Button>
          </div>
          {showOutput && (
            <pre className="text-xs bg-surface-3 border border-border-custom rounded-lg p-3 overflow-x-auto text-text-secondary">{outputJson}</pre>
          )}
          <Button variant="secondary" size="sm" onClick={() => copyJson('Output JSON', outputJson)}>
            Copy Output JSON
          </Button>
        </div>

        <Button className="w-full" onClick={() => onRunMock(model)}>
          Run (Mock)
        </Button>
      </div>
    </Drawer>
  );
}
