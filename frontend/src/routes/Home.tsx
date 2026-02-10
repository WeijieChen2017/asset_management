import { useState } from 'react';
import { usePortfolio } from '../store/portfolio';
import { mlModelMap, type MLModelId } from '../data/mlModels';
import { Card } from '../components/ui/Card';
import { MLModelDrawer } from '../components/MLModelDrawer';
import { useToast } from '../components/ui/Toast';
import { useTheme } from '../store/theme';
import { PieChart, Repeat, BarChart3, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

type StageId = 'Allocation' | 'Trading' | 'Reporting';
type Point = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };

const FLOW_LAYOUT = {
  width: 1100,
  height: 520,
  canvasPadding: 28,
  cardWidth: 330,
  cardHeight: 78,
  nodeSpacingX: 500,
  nodeSpacingY: 392,
  edgeGap: 12,
  arrowStrokeWidth: 3.4,
  arrowHeadSize: 8.4,
  pillOffset: 10,
  connectorLabelOffsetY: 14,
  connectorGapAroundLabel: 12,
  minLabelClearance: 12,
};

const STAGE_ACCENTS: Record<StageId, string> = {
  Allocation: '#7EA9E1',
  Trading: '#7ABAA2',
  Reporting: '#A990D7',
};

function fmt$(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(v);
}

function getPillPlacement(start: Point, end: Point, offset: number, control?: Point) {
  const midpoint = control
    ? {
        x: 0.25 * start.x + 0.5 * control.x + 0.25 * end.x,
        y: 0.25 * start.y + 0.5 * control.y + 0.25 * end.y,
      }
    : {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      };
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return {
    midpoint,
    pill: {
      x: midpoint.x + nx * offset,
      y: midpoint.y + ny * offset,
    },
  };
}

function pointInRect(point: Point, rect: Rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function expandRect(rect: Rect, padding: number): Rect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    w: rect.w + padding * 2,
    h: rect.h + padding * 2,
  };
}

function edgeIntersectsRect(edge: { start: Point; end: Point; control?: Point }, rect: Rect): boolean {
  const steps = edge.control ? 50 : 20;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    let point: Point;
    if (edge.control) {
      const omt = 1 - t;
      point = {
        x: omt * omt * edge.start.x + 2 * omt * t * edge.control.x + t * t * edge.end.x,
        y: omt * omt * edge.start.y + 2 * omt * t * edge.control.y + t * t * edge.end.y,
      };
    } else {
      point = {
        x: edge.start.x + (edge.end.x - edge.start.x) * t,
        y: edge.start.y + (edge.end.y - edge.start.y) * t,
      };
    }
    if (pointInRect(point, rect)) return true;
  }
  return false;
}

export default function Home() {
  const { state, dispatch } = usePortfolio();
  const { toast } = useToast();
  const { theme } = useTheme();
  const { allocation, trading, reporting } = state;
  const isDark = theme === 'dark';

  const [hoveredModelId, setHoveredModelId] = useState<MLModelId | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<MLModelId | null>(null);

  const openOrders = trading.orders.filter((o) => o.status === 'Working' || o.status === 'PartiallyFilled').length;
  const lastFill = trading.orders.find((o) => o.filledAt);

  const statusCards = [
    {
      title: 'Asset Allocation',
      icon: PieChart,
      color: 'text-accent-blue',
      link: '/allocation',
      items: [
        { label: 'Last run', value: allocation.lastRunAt ? new Date(allocation.lastRunAt).toLocaleString() : 'Never' },
        { label: 'Targets', value: `${Object.keys(allocation.targetWeights).length} positions` },
        { label: 'Scheme', value: allocation.objective },
      ],
    },
    {
      title: 'Trading',
      icon: Repeat,
      color: 'text-accent-green',
      link: '/trading',
      items: [
        { label: 'Open orders', value: String(openOrders) },
        { label: 'Last fill', value: lastFill?.filledAt ? new Date(lastFill.filledAt).toLocaleString() : 'None' },
        { label: 'Positions', value: String(trading.positions.length) },
      ],
    },
    {
      title: 'Risk',
      icon: Activity,
      color: 'text-accent-warning',
      link: '/reporting',
      items: [
        { label: 'Annualized Vol', value: `${reporting.kpis.annualizedVol.toFixed(1)}%` },
        { label: 'Tracking Error', value: `${reporting.kpis.trackingError.toFixed(1)}%` },
        { label: 'Max Drawdown', value: `${reporting.kpis.maxDrawdown.toFixed(1)}%` },
      ],
    },
    {
      title: 'Performance',
      icon: BarChart3,
      color: 'text-accent-violet',
      link: '/reporting',
      items: [
        { label: 'YTD Return', value: `${reporting.kpis.ytdReturn.toFixed(2)}%` },
        { label: 'Sharpe Ratio', value: reporting.kpis.sharpe.toFixed(2) },
        { label: 'Info Ratio', value: reporting.kpis.informationRatio.toFixed(2) },
      ],
    },
  ];

  const modelRunState: Record<MLModelId, boolean> = {
    ML_12: trading.recommendedTrades.length > 0 || Boolean(trading.orderPlan),
    ML_13: Boolean(reporting.expectedSummary) || Boolean(reporting.allocationExplainability),
    ML_23: Boolean(reporting.execution),
    ML_31: Boolean(reporting.suggestedAllocationInputs),
    ML_32: Boolean(trading.controlsSuggested),
  };

  const marginY = (FLOW_LAYOUT.height - (FLOW_LAYOUT.nodeSpacingY + FLOW_LAYOUT.cardHeight)) / 2;
  const topCenterY = marginY + FLOW_LAYOUT.cardHeight / 2;
  const centerX = FLOW_LAYOUT.width / 2;
  const allocationCenter = { x: centerX - FLOW_LAYOUT.nodeSpacingX / 2, y: topCenterY };
  const tradingCenter = { x: centerX + FLOW_LAYOUT.nodeSpacingX / 2, y: topCenterY };
  const reportingCenter = { x: centerX, y: topCenterY + FLOW_LAYOUT.nodeSpacingY };

  const stageNodes: Array<{ id: StageId; title: string; subtitle: string; center: Point; accent: string }> = [
    { id: 'Allocation', title: 'Allocation', subtitle: 'Stage 1: Optimize weights', center: allocationCenter, accent: STAGE_ACCENTS.Allocation },
    { id: 'Trading', title: 'Trading', subtitle: 'Stage 2: Execute orders', center: tradingCenter, accent: STAGE_ACCENTS.Trading },
    { id: 'Reporting', title: 'Reporting', subtitle: 'Stage 3: Analyze and feedback', center: reportingCenter, accent: STAGE_ACCENTS.Reporting },
  ];

  const flowModelLabels: Record<MLModelId, string> = {
    ML_12: mlModelMap.ML_12.name,
    ML_13: mlModelMap.ML_13.name,
    ML_23: mlModelMap.ML_23.name,
    ML_31: mlModelMap.ML_31.name,
    ML_32: mlModelMap.ML_32.name,
  };

  const flowPalette = {
    canvasBg: isDark ? '#131924' : '#F8FAFC',
    canvasBorder: isDark ? '#2C3546' : '#E2E8F0',
    canvasInsetShadow: isDark ? 'inset 0 0 0 1px rgba(255,255,255,0.03)' : 'inset 0 0 0 1px rgba(15, 23, 42, 0.03)',
    dropShadow: isDark ? '#000000' : '#0F172A',
    marker: isDark ? '#A7B4C8' : '#64748B',
    edgeCore: isDark ? '#9AA8BE' : '#64748B',
    edgeFeedback: isDark ? '#7F8EA6' : '#94A3B8',
    leader: isDark ? '#42506A' : '#CBD5E1',
    pillFill: isDark ? '#1A2230' : '#FFFFFF',
    pillStroke: isDark ? '#42506A' : '#CBD5E1',
    pillText: isDark ? '#D5DEEC' : '#334155',
    stageFill: isDark ? '#171F2D' : '#FFFFFF',
    stageTitle: isDark ? '#EDF3FD' : '#0F172A',
    stageSubtitle: isDark ? '#A8B4C7' : '#64748B',
  };

  const rectByStage = Object.fromEntries(
    stageNodes.map((node) => [
      node.id,
      {
        x: node.center.x - FLOW_LAYOUT.cardWidth / 2,
        y: node.center.y - FLOW_LAYOUT.cardHeight / 2,
        w: FLOW_LAYOUT.cardWidth,
        h: FLOW_LAYOUT.cardHeight,
      },
    ])
  ) as Record<StageId, { x: number; y: number; w: number; h: number }>;

  const flowEdges: Array<{
    id: MLModelId;
    source: StageId;
    target: StageId;
    roleLabel: string;
    kind: 'core' | 'feedback';
    start: Point;
    end: Point;
    labelOffset: number;
    control?: Point;
  }> = [
    {
      id: 'ML_12',
      source: 'Allocation',
      target: 'Trading',
      roleLabel: flowModelLabels.ML_12,
      kind: 'core',
      start: { x: rectByStage.Allocation.x + rectByStage.Allocation.w + FLOW_LAYOUT.edgeGap, y: allocationCenter.y },
      end: { x: rectByStage.Trading.x - FLOW_LAYOUT.edgeGap, y: tradingCenter.y },
      labelOffset: -FLOW_LAYOUT.pillOffset,
    },
    {
      id: 'ML_13',
      source: 'Allocation',
      target: 'Reporting',
      roleLabel: flowModelLabels.ML_13,
      kind: 'core',
      start: {
        x: allocationCenter.x + FLOW_LAYOUT.cardWidth * 0.18,
        y: rectByStage.Allocation.y + rectByStage.Allocation.h + FLOW_LAYOUT.edgeGap,
      },
      end: {
        x: reportingCenter.x - FLOW_LAYOUT.cardWidth * 0.18,
        y: rectByStage.Reporting.y - FLOW_LAYOUT.edgeGap,
      },
      labelOffset: FLOW_LAYOUT.pillOffset,
    },
    {
      id: 'ML_23',
      source: 'Trading',
      target: 'Reporting',
      roleLabel: flowModelLabels.ML_23,
      kind: 'core',
      start: {
        x: tradingCenter.x - FLOW_LAYOUT.cardWidth * 0.18,
        y: rectByStage.Trading.y + rectByStage.Trading.h + FLOW_LAYOUT.edgeGap,
      },
      end: {
        x: reportingCenter.x + FLOW_LAYOUT.cardWidth * 0.18,
        y: rectByStage.Reporting.y - FLOW_LAYOUT.edgeGap,
      },
      labelOffset: -FLOW_LAYOUT.pillOffset,
    },
    {
      id: 'ML_31',
      source: 'Reporting',
      target: 'Allocation',
      roleLabel: flowModelLabels.ML_31,
      kind: 'feedback',
      start: {
        x: reportingCenter.x - FLOW_LAYOUT.cardWidth * 0.22,
        y: rectByStage.Reporting.y - FLOW_LAYOUT.edgeGap,
      },
      end: {
        x: allocationCenter.x - FLOW_LAYOUT.cardWidth * 0.22,
        y: rectByStage.Allocation.y + rectByStage.Allocation.h + FLOW_LAYOUT.edgeGap,
      },
      control: {
        x: FLOW_LAYOUT.canvasPadding + 46,
        y: reportingCenter.y - FLOW_LAYOUT.nodeSpacingY * 0.44,
      },
      labelOffset: -FLOW_LAYOUT.pillOffset - 2,
    },
    {
      id: 'ML_32',
      source: 'Reporting',
      target: 'Trading',
      roleLabel: flowModelLabels.ML_32,
      kind: 'feedback',
      start: {
        x: reportingCenter.x + FLOW_LAYOUT.cardWidth * 0.22,
        y: rectByStage.Reporting.y - FLOW_LAYOUT.edgeGap,
      },
      end: {
        x: tradingCenter.x + FLOW_LAYOUT.cardWidth * 0.22,
        y: rectByStage.Trading.y + rectByStage.Trading.h + FLOW_LAYOUT.edgeGap,
      },
      control: {
        x: FLOW_LAYOUT.width - FLOW_LAYOUT.canvasPadding - 46,
        y: reportingCenter.y - FLOW_LAYOUT.nodeSpacingY * 0.44,
      },
      labelOffset: FLOW_LAYOUT.pillOffset + 2,
    },
  ];

  const focusModelId = hoveredModelId ?? selectedModelId;
  const focusedEdge = focusModelId ? flowEdges.find((edge) => edge.id === focusModelId) : undefined;
  const focusedStages = new Set<StageId>(focusedEdge ? [focusedEdge.source, focusedEdge.target] : []);

  const selectedModel = selectedModelId ? mlModelMap[selectedModelId] : null;

  const runModelFromDrawer = (modelId: MLModelId) => {
    const model = mlModelMap[modelId];
    dispatch({ type: 'RUN_ML_MODEL', payload: { modelId, output: model.mockOutput } });
    toast(`${model.name} completed (confidence: ${model.confidence.toFixed(2)})`, 'success');
    setSelectedModelId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Portfolio Dashboard</h2>
        <p className="text-sm text-text-secondary mt-1">
          {state.portfolio.name} — AUM {fmt$(state.portfolio.totalAum)}
        </p>
      </div>

      <Card title="Platform Flow">
        <div className="grid grid-cols-12">
          <div className="col-span-12">
            <div
              className="rounded-2xl p-[var(--space-4)] border"
              style={{
                background: flowPalette.canvasBg,
                borderColor: flowPalette.canvasBorder,
                boxShadow: flowPalette.canvasInsetShadow,
              }}
            >
              <div className="platform-flow-canvas">
                <svg viewBox={`0 0 ${FLOW_LAYOUT.width} ${FLOW_LAYOUT.height}`} className="w-full h-auto">
                <defs>
                  <filter id="stageSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={flowPalette.dropShadow} floodOpacity={isDark ? '0.35' : '0.12'} />
                  </filter>
                  <marker
                    id="connectorArrow"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth={FLOW_LAYOUT.arrowHeadSize}
                    markerHeight={FLOW_LAYOUT.arrowHeadSize}
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={flowPalette.marker} />
                  </marker>
                </defs>

                {flowEdges.map((edge) => {
                  const active = focusModelId === edge.id;
                  const ready = modelRunState[edge.id];
                  const strokeColor = active ? STAGE_ACCENTS[edge.source] : edge.kind === 'core' ? flowPalette.edgeCore : flowPalette.edgeFeedback;
                  const pillWidth = Math.max(160, edge.roleLabel.length * 6.1 + 24);
                  const pillHeight = 30;
                  const isSplitLaneConnector = edge.id === 'ML_12';

                  let connectorStart = edge.start;
                  let connectorEnd = edge.end;
                  let connectorControl = edge.control;
                  let midpoint: Point;
                  let pill: Point;

                  if (isSplitLaneConnector) {
                    const baseY = (edge.start.y + edge.end.y) / 2;
                    const labelCenterX = (edge.start.x + edge.end.x) / 2;
                    const minOffsetForClearance =
                      (FLOW_LAYOUT.minLabelClearance + pillHeight / 2 + FLOW_LAYOUT.arrowStrokeWidth / 2) / 2;
                    let laneOffset = Math.max(FLOW_LAYOUT.connectorLabelOffsetY, minOffsetForClearance);

                    for (let step = 0; step < 18; step += 1) {
                      const testPill: Point = { x: labelCenterX, y: baseY - laneOffset };
                      const testConnector = {
                        start: { x: edge.start.x, y: baseY + laneOffset },
                        end: { x: edge.end.x, y: baseY + laneOffset },
                      };
                      const testPillRect: Rect = {
                        x: testPill.x - pillWidth / 2,
                        y: testPill.y - pillHeight / 2,
                        w: pillWidth,
                        h: pillHeight,
                      };
                      const expandedPillRect = expandRect(testPillRect, FLOW_LAYOUT.connectorGapAroundLabel);
                      const arrowClearance =
                        testConnector.start.y - (testPillRect.y + testPillRect.h) - FLOW_LAYOUT.arrowStrokeWidth / 2;

                      const ownIntersects = edgeIntersectsRect(testConnector, expandedPillRect);
                      const otherIntersects = flowEdges.some((other) => {
                        if (other.id === edge.id) return false;
                        return edgeIntersectsRect(
                          {
                            start: other.start,
                            end: other.end,
                            control: other.control,
                          },
                          expandRect(testPillRect, 8)
                        );
                      });

                      if (!ownIntersects && !otherIntersects && arrowClearance >= FLOW_LAYOUT.minLabelClearance) {
                        break;
                      }
                      laneOffset += 2;
                    }

                    connectorStart = { x: edge.start.x, y: baseY + laneOffset };
                    connectorEnd = { x: edge.end.x, y: baseY + laneOffset };
                    connectorControl = undefined;
                    midpoint = { x: labelCenterX, y: baseY };
                    pill = { x: labelCenterX, y: baseY - laneOffset };
                  } else {
                    const placement = getPillPlacement(edge.start, edge.end, edge.labelOffset, edge.control);
                    midpoint = placement.midpoint;
                    pill = placement.pill;
                  }

                  const d = connectorControl
                    ? `M ${connectorStart.x} ${connectorStart.y} Q ${connectorControl.x} ${connectorControl.y} ${connectorEnd.x} ${connectorEnd.y}`
                    : `M ${connectorStart.x} ${connectorStart.y} L ${connectorEnd.x} ${connectorEnd.y}`;
                  const pillX = pill.x - pillWidth / 2;
                  const pillY = pill.y - pillHeight / 2;

                  return (
                    <g
                      key={`edge-${edge.id}`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredModelId(edge.id)}
                      onMouseLeave={() => setHoveredModelId(null)}
                      onClick={() => setSelectedModelId(edge.id)}
                    >
                      <path d={d} fill="none" stroke="transparent" strokeWidth={14} />
                      <path
                        d={d}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={FLOW_LAYOUT.arrowStrokeWidth}
                        strokeOpacity={active ? 1 : ready ? 0.88 : 0.58}
                        strokeDasharray={edge.kind === 'feedback' ? '10 8' : undefined}
                        markerEnd="url(#connectorArrow)"
                      />
                      <line x1={midpoint.x} y1={midpoint.y} x2={pill.x} y2={pill.y} stroke={flowPalette.leader} strokeOpacity={0.8} strokeWidth={1} />
                      <rect
                        x={pillX}
                        y={pillY}
                        width={pillWidth}
                        height={pillHeight}
                        rx={pillHeight / 2}
                        fill={flowPalette.pillFill}
                        stroke={active ? STAGE_ACCENTS[edge.source] : flowPalette.pillStroke}
                        strokeWidth={1}
                      />
                      <text x={pillX + pillWidth / 2} y={pill.y + 4} textAnchor="middle" fill={flowPalette.pillText} fontSize="11.6" fontWeight="500">
                        {edge.roleLabel}
                      </text>
                    </g>
                  );
                })}

                {stageNodes.map((stage) => {
                  const rect = rectByStage[stage.id];
                  const focused = focusedStages.has(stage.id);
                  return (
                    <g key={`stage-${stage.id}`} filter="url(#stageSoftShadow)">
                      <rect
                        x={rect.x}
                        y={rect.y}
                        width={rect.w}
                        height={rect.h}
                        rx={16}
                        fill={flowPalette.stageFill}
                        stroke={stage.accent}
                        strokeWidth={focused ? 3 : 2}
                      />
                      <text
                        x={stage.center.x}
                        y={rect.y + 32}
                        textAnchor="middle"
                        fill={flowPalette.stageTitle}
                        fontSize="20"
                        fontWeight="600"
                      >
                        {stage.title}
                      </text>
                      <text
                        x={stage.center.x}
                        y={rect.y + 52}
                        textAnchor="middle"
                        fill={flowPalette.stageSubtitle}
                        fontSize="12.5"
                        fontWeight="400"
                      >
                        {stage.subtitle}
                      </text>
                    </g>
                  );
                })}
                </svg>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-text-muted mt-3 text-center">Hover a connector to highlight flow. Click a connector to inspect model details.</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statusCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} to={card.link} className="block group">
              <div className="bg-surface-2 border border-border-custom rounded-xl p-5 hover:border-accent-blue/40 transition-colors h-full">
                <div className="flex items-center gap-2.5 mb-4">
                  <Icon size={20} className={card.color} />
                  <h3 className="text-base font-bold text-text-primary">{card.title}</h3>
                </div>
                <div className="space-y-2.5">
                  {card.items.map((item) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-text-secondary">{item.label}</span>
                      <span className="text-text-primary font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <MLModelDrawer
        open={selectedModelId !== null}
        model={selectedModel}
        inputPayload={selectedModel ? selectedModel.buildInput(state) : null}
        onClose={() => setSelectedModelId(null)}
        onRunMock={(model) => runModelFromDrawer(model.id)}
      />
    </div>
  );
}
