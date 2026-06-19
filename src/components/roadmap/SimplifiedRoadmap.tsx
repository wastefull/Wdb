import React from "react";
import { CheckCircle2, Circle, Clock, ShieldCheck } from "lucide-react";
import {
  ACTIVE_STAGE,
  ROADMAP_BACKLOG,
  ROADMAP_PROGRESS,
  ROADMAP_STAGES,
  RoadmapStage,
  RoadmapStageStatus,
  RoadmapTabId,
} from "../../config/roadmap";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { PageTemplate } from "../shared/PageTemplate";
import { PhaseFilteredTests } from "./PhaseFilteredTests";
import { TestSuite } from "./TestSuite";

interface SimplifiedRoadmapProps {
  onBack?: () => void;
  defaultTab?: RoadmapTabId;
  /** When true, locks to overview tab only. */
  staffMode?: boolean;
}

function StageStatusIcon({ status }: { status: RoadmapStageStatus }) {
  if (status === "complete") {
    return <CheckCircle2 className="size-5 text-green-600" />;
  }
  if (status === "active") {
    return <Clock className="size-5 text-blue-600" />;
  }
  return <Circle className="size-5 text-gray-400" />;
}

function StageStatusBadge({ status }: { status: RoadmapStageStatus }) {
  if (status === "complete") {
    return <Badge className="bg-green-600 hover:bg-green-700">Complete</Badge>;
  }
  if (status === "active") {
    return <Badge className="bg-blue-600 hover:bg-blue-700">Active</Badge>;
  }
  return <Badge variant="outline">Planned</Badge>;
}

function DeliverableIcon({
  status,
}: {
  status: RoadmapStage["deliverables"][number]["status"];
}) {
  if (status === "complete") {
    return <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />;
  }
  if (status === "active") {
    return <Clock className="size-4 text-blue-600 mt-0.5 shrink-0" />;
  }
  return <Circle className="size-4 text-gray-400 mt-0.5 shrink-0" />;
}

function RoadmapOverview({
  onSelectStage,
}: {
  onSelectStage: (stage: RoadmapStage) => void;
}) {
  return (
    <div className="space-y-8">
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>
            {ROADMAP_PROGRESS.complete} of {ROADMAP_PROGRESS.total} stages
            complete; Stage {ACTIVE_STAGE.number} is active
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="flex-1 h-4 bg-muted rounded-full overflow-hidden"
              role="progressbar"
              aria-label="Roadmap completion"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={ROADMAP_PROGRESS.percentComplete}
            >
              <div
                className="h-full bg-linear-to-r from-green-500 to-green-600"
                style={{ width: `${ROADMAP_PROGRESS.percentComplete}%` }}
              />
            </div>
            <span className="font-bold text-2xl min-w-16 text-right">
              {ROADMAP_PROGRESS.percentComplete}%
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-green-600 hover:bg-green-700">
              {ROADMAP_PROGRESS.complete} Complete
            </Badge>
            <Badge className="bg-blue-600 hover:bg-blue-700">
              {ROADMAP_PROGRESS.active} Active
            </Badge>
            <Badge variant="outline">{ROADMAP_PROGRESS.planned} Planned</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Stages 9 and 10 are intentionally the final sequence: Privacy, Audit
            & Revision History, followed by Scale.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl">Development Stages</h2>
        {ROADMAP_STAGES.map((stage, index) => (
          <div key={stage.number} className="flex gap-4">
            <div className="flex flex-col items-center">
              <StageStatusIcon status={stage.status} />
              {index < ROADMAP_STAGES.length - 1 && (
                <div className="w-0.5 flex-1 bg-border mt-2 mb-2" />
              )}
            </div>
            <button
              type="button"
              onClick={() => onSelectStage(stage)}
              className="flex-1 text-left mb-2"
            >
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono text-muted-foreground">
                          Stage {stage.number}
                        </span>
                        <StageStatusBadge status={stage.status} />
                      </div>
                      <CardTitle>{stage.title}</CardTitle>
                      {stage.completedDate && (
                        <CardDescription className="mt-1">
                          {stage.completedDate}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {stage.summary}
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    {stage.deliverables.length} deliverables ·{" "}
                    {stage.acceptanceTests.length} acceptance tests
                  </p>
                </CardContent>
              </Card>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StageDetail({ stage }: { stage: RoadmapStage }) {
  const hasRunnableTests = stage.number >= 2 && stage.number <= 6;

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-mono text-muted-foreground mb-2">
                Stage {stage.number}
              </div>
              <CardTitle className="text-2xl">{stage.title}</CardTitle>
              <CardDescription className="mt-2">
                {stage.summary}
              </CardDescription>
            </div>
            <StageStatusBadge status={stage.status} />
          </div>
        </CardHeader>
        {(stage.completedDate || stage.legacyPhases?.length) && (
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {stage.completedDate && <p>{stage.completedDate}</p>}
            {stage.legacyPhases?.length && (
              <p>Legacy phase references: {stage.legacyPhases.join(", ")}</p>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deliverables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stage.deliverables.map((deliverable) => (
            <div key={deliverable.title} className="flex items-start gap-3">
              <DeliverableIcon status={deliverable.status} />
              <div>
                <div className="font-medium">{deliverable.title}</div>
                {deliverable.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {deliverable.description}
                  </div>
                )}
                <Badge variant="outline" className="mt-2 capitalize">
                  {deliverable.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            Acceptance Tests
          </CardTitle>
          <CardDescription>
            Planned tests define the completion gate now; executable tests are
            attached as implementation begins.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {stage.acceptanceTests.map((test) => (
            <div key={test.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{test.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {test.description}
                  </div>
                  {test.legacyPhases?.length && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Legacy phases: {test.legacyPhases.join(", ")}
                    </div>
                  )}
                </div>
                <Badge
                  variant={test.status === "automated" ? "default" : "outline"}
                >
                  {test.status === "automated" ? "Automated" : "Planned"}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {hasRunnableTests && (
        <PhaseFilteredTests
          stage={stage.number}
          title={`Stage ${stage.number} Regression Tests`}
          description={
            stage.number === 5
              ? "Executable acceptance checks for the material experience contracts"
              : stage.number === 6
                ? "Executable checks for graph schema, RLS, compatibility, and backup coverage"
                : "Executable tests mapped from legacy phase identifiers"
          }
        />
      )}
    </div>
  );
}

function Backlog() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">Backlog</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Deferred work that is not part of an active stage completion gate.
        </p>
      </div>
      {ROADMAP_BACKLOG.map((category) => (
        <Card key={category.title}>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>{category.title}</CardTitle>
              <Badge variant="outline" className="capitalize">
                {category.priority} priority
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {category.items.map((item) => (
              <div
                key={item.title}
                className="border-b last:border-b-0 pb-4 last:pb-0"
              >
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {item.description}
                </div>
                {item.origin && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Origin: {item.origin}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SimplifiedRoadmap({
  onBack,
  defaultTab,
  staffMode,
}: SimplifiedRoadmapProps) {
  const initialStageNumber =
    defaultTab?.startsWith("stage-") && Number(defaultTab.replace("stage-", ""))
      ? Number(defaultTab.replace("stage-", ""))
      : ACTIVE_STAGE.number;
  const [selectedStageNumber, setSelectedStageNumber] =
    React.useState(initialStageNumber);
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "stages" | "tests" | "backlog"
  >(
    staffMode
      ? "overview"
      : defaultTab === "overview" ||
          defaultTab === "tests" ||
          defaultTab === "backlog"
        ? defaultTab
        : defaultTab?.startsWith("stage-")
          ? "stages"
          : "overview",
  );

  React.useEffect(() => {
    if (staffMode) {
      setActiveTab("overview");
      return;
    }

    if (defaultTab?.startsWith("stage-")) {
      const stageNumber = Number(defaultTab.replace("stage-", ""));
      if (ROADMAP_STAGES.some((stage) => stage.number === stageNumber)) {
        setSelectedStageNumber(stageNumber);
      }
      setActiveTab("stages");
      return;
    }

    setActiveTab(
      defaultTab === "overview" ||
        defaultTab === "tests" ||
        defaultTab === "backlog"
        ? defaultTab
        : "overview",
    );
  }, [defaultTab, staffMode]);

  const selectedStage =
    ROADMAP_STAGES.find((stage) => stage.number === selectedStageNumber) ??
    ACTIVE_STAGE;

  const selectStage = (stage: RoadmapStage) => {
    setSelectedStageNumber(stage.number);
    setActiveTab("stages");
  };

  return (
    <PageTemplate
      title="WasteDB Development Roadmap"
      description="The operational source of truth for development stages and acceptance tests"
      onBack={onBack}
      maxWidth="5xl"
    >
      {!staffMode && (
        <>
          <div className="mb-6 flex items-center gap-3">
            <span className="text-sm font-['Sniglet'] text-muted-foreground">
              Active:
            </span>
            <Badge className="bg-[#bae1ff] text-black hover:bg-[#9dd1ff]">
              Stage {ACTIVE_STAGE.number}: {ACTIVE_STAGE.title}
            </Badge>
          </div>

          <div className="mb-6 border-b">
            <div className="flex gap-2">
              {(["overview", "stages", "tests", "backlog"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 capitalize text-sm ${
                      activeTab === tab
                        ? "border-b-2 border-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "overview" && (
        <RoadmapOverview onSelectStage={selectStage} />
      )}

      {activeTab === "stages" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stages</CardTitle>
              <CardDescription>
                Select a stage to review deliverables and completion gates.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {ROADMAP_STAGES.map((stage) => (
                <button
                  key={stage.number}
                  type="button"
                  onClick={() => setSelectedStageNumber(stage.number)}
                  className={`px-3 py-2 rounded-md border text-sm ${
                    selectedStageNumber === stage.number
                      ? "bg-[#bae1ff] border-[#9dd1ff] text-black"
                      : "hover:bg-muted"
                  }`}
                >
                  Stage {stage.number}
                </button>
              ))}
            </CardContent>
          </Card>
          <StageDetail stage={selectedStage} />
        </div>
      )}

      {activeTab === "tests" && <TestSuite />}
      {activeTab === "backlog" && <Backlog />}
    </PageTemplate>
  );
}
