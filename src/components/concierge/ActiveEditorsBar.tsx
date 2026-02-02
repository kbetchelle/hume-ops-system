// Stub component for active editors display
export function ActiveEditorsBar({ editors }: { editors: any[] }) {
  if (editors.length === 0) return null;
  
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{editors.length} active editor(s)</span>
    </div>
  );
}
