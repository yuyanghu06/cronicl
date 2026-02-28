import { useNavigate } from "react-router";
import { Card } from "@/components/ui/Card";
import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { CourierText } from "@/components/ui/CourierText";
import { SyntMonoText } from "@/components/ui/SyntMonoText";
import { Badge } from "@/components/ui/Badge";
import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(`/editor/${project.id}`)}
      className="cursor-pointer hover:border-border-strong group"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <DotMatrixText className="text-xs text-fg-dim">
          PRJ_{project.id.split("-")[1]?.padStart(3, "0") ?? "000"}
        </DotMatrixText>
        <Badge
          variant={project.status === "active" ? "active" : "default"}
        >
          {project.status}
        </Badge>
      </div>

      {/* Title */}
      <CourierText
        as="h3"
        className="text-xl text-fg-bright group-hover:text-fg-max transition-colors mb-3"
      >
        {project.name}
      </CourierText>

      {/* Description */}
      <CourierText className="text-sm text-fg-dim line-clamp-2 mb-5">
        {project.description}
      </CourierText>

      {/* Divider */}
      <div className="h-px bg-border-subtle mb-4" />

      {/* Metadata */}
      <div className="flex items-center gap-4">
        <SyntMonoText className="text-xs">
          {project.nodeCount} nodes
        </SyntMonoText>
        <SyntMonoText className="text-xs text-fg-muted">
          //
        </SyntMonoText>
        <SyntMonoText className="text-xs">
          {project.branchCount} branches
        </SyntMonoText>
        <SyntMonoText className="text-xs text-fg-muted ml-auto">
          {project.lastEdited}
        </SyntMonoText>
      </div>
    </Card>
  );
}
