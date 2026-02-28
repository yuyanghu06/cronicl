import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { CourierText } from "@/components/ui/CourierText";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  onCreateProject: () => void;
}

export function EmptyState({ onCreateProject }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <DotMatrixText as="h2" className="text-2xl text-fg-dim mb-6">
        NO_PROJECTS
      </DotMatrixText>
      <CourierText className="text-fg-dim max-w-sm mb-10">
        Create your first project to begin designing your narrative.
      </CourierText>
      <Button variant="primary" onClick={onCreateProject}>
        NEW PROJECT
      </Button>
    </div>
  );
}
