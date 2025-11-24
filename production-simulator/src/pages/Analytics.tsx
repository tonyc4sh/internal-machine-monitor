import { useState, useMemo, useCallback, memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSystemStore } from '../store';
import { GlobalMetricsPanel } from '../components/GlobalMetricsPanel';
import { KPICard, ChartCard, AlertDistributionPanel, RecipientCard } from '../components/AnalyticsWidgets';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Activity, CheckCircle2, PlayCircle, Hourglass, FileText, Users, Briefcase, ShieldCheck, Wrench, Code, Download, FileSpreadsheet } from 'lucide-react';
import { TaskDetailsModal } from '../components/TaskDetailsModal';
import ExcelJS from 'exceljs';
import type { TaskInstance, SystemEvent } from '../types';

// ============ RECHARTS OPTIMIZED STYLES (stable references) ============
const CHART_STYLES = {
	// Tooltip styles
	tooltipContent: { backgroundColor: '#0c0c0f', border: '1px solid #00d4ff33', borderRadius: '4px', padding: '8px 12px' },
	tooltipContentAlt: { backgroundColor: '#0c0c0f', border: '1px solid #ffffff15', borderRadius: '4px', padding: '8px 12px' },
	tooltipLabel: { color: '#00d4ff', fontWeight: 'bold', fontSize: '11px' },
	tooltipItem: { color: '#e0e0e8', fontSize: '12px' },
	// Axis styles
	tick: { fontSize: 10, fill: '#6a6a78' },
	// Cursor styles
	cursorFill: { fill: 'rgba(0, 212, 255, 0.04)' },
	cursorStroke: { stroke: '#00d4ff33', strokeWidth: 1 },
	// Legend styles
	legendWrapper: { fontSize: '10px', paddingTop: '6px' },
} as const;

const TASK_COLORS: Record<string, string> = { Completed: '#00ff88', Active: '#ffaa00', Waiting: '#7b61ff' };

// Event type color mapping for distinct colors
const EVENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
	task_created: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
	task_assigned: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
	task_started: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
	task_completed: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
	task_cancelled: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },
	machine_breakdown: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
	machine_repaired: { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30' },
	alert_sent: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
	rebalance_triggered: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
};

const getEventColors = (type: string) => EVENT_COLORS[type] || { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' };

// --- Sub-components for Performance ---

const AnalyticsKPIs = () => {
	const metrics = useSystemStore(useShallow(state => state.getGlobalMetrics()));
	const eventLogLength = useSystemStore(state => state.eventLog.length);

	return (
		<section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
			<KPICard title="Throughput" value={`${metrics.throughput}/hr`} icon={<Activity size={24} />} color="cyan" />
			<KPICard title="Completed" value={metrics.completedCount} icon={<CheckCircle2 size={24} />} color="emerald" />
			<KPICard title="In Progress" value={metrics.inProgressCount} icon={<PlayCircle size={24} />} color="amber" />
			<KPICard title="Waiting" value={metrics.waitingCount} icon={<Hourglass size={24} />} color="slate" />
			<KPICard title="Events" value={eventLogLength} icon={<FileText size={24} />} color="purple" className="col-span-2 sm:col-span-1" />
		</section>
	);
};

// Helper function to format production time as HH:MM
const formatTimeHHMM = (productionMinutes: number) => {
	const hours = Math.floor(productionMinutes / 60);
	const minutes = Math.floor(productionMinutes % 60);
	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// ============ ISOLATED CHART COMPONENTS (React.memo for performance) ============

// Hall Load Chart - isolated for optimal re-renders
const HallLoadChart = memo(({ data }: { data: Array<{ timeLabel: string; hallLoad: number }> }) => {
	// Stable formatter reference (critical for Recharts performance)
	const formatValue = useCallback((value: number) => [`${value.toFixed(1)}%`, 'Load'], []);
	const formatTick = useCallback((val: number) => `${val}%`, []);

	return (
		<ResponsiveContainer width="100%" height={240} debounce={100}>
			<AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} syncId="analytics">
				<defs>
					<linearGradient id="hallLoadGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#00d4ff" stopOpacity={0.3} />
						<stop offset="100%" stopColor="#00d4ff" stopOpacity={0.02} />
					</linearGradient>
				</defs>
				<CartesianGrid strokeDasharray="3 3" stroke="#1a1a1f" vertical={false} />
				<XAxis
					dataKey="timeLabel"
					stroke="#5c5c66"
					tick={CHART_STYLES.tick}
					axisLine={false}
					tickLine={false}
					interval="preserveStartEnd"
				/>
				<YAxis
					stroke="#5c5c66"
					tick={CHART_STYLES.tick}
					domain={[0, 100]}
					width={32}
					axisLine={false}
					tickLine={false}
					tickFormatter={formatTick}
				/>
				<Tooltip
					cursor={CHART_STYLES.cursorFill}
					contentStyle={CHART_STYLES.tooltipContent}
					labelStyle={CHART_STYLES.tooltipLabel}
					itemStyle={CHART_STYLES.tooltipItem}
					formatter={formatValue}
				/>
				<Area
					type="monotone"
					dataKey="hallLoad"
					stroke="#00d4ff"
					fill="url(#hallLoadGradient)"
					strokeWidth={2}
					dot={false}
					activeDot={{ r: 4, stroke: '#00d4ff', strokeWidth: 2, fill: '#0c0c0f' }}
					isAnimationActive={false}
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
});
HallLoadChart.displayName = 'HallLoadChart';

// Task Volume Chart - isolated for optimal re-renders
const TaskVolumeChart = memo(({ data }: { data: Array<{ timeLabel: string; completedTasks: number; activeTasks: number; waitingTasks: number }> }) => {
	// Stable formatter reference
	const formatValue = useCallback((value: number, name: string) => {
		return [<span key={name} style={{ color: TASK_COLORS[name] || '#fff' }}>{value}</span>, name];
	}, []);
	const formatLegend = useCallback((value: string) => <span style={{ color: '#8a8a98', marginLeft: '3px' }}>{value}</span>, []);

	return (
		<ResponsiveContainer width="100%" height={240} debounce={100}>
			<AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} syncId="analytics">
				<defs>
					<linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#00ff88" stopOpacity={0.2} />
						<stop offset="100%" stopColor="#00ff88" stopOpacity={0.02} />
					</linearGradient>
					<linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#ffaa00" stopOpacity={0.15} />
						<stop offset="100%" stopColor="#ffaa00" stopOpacity={0.02} />
					</linearGradient>
					<linearGradient id="waitingGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#7b61ff" stopOpacity={0.15} />
						<stop offset="100%" stopColor="#7b61ff" stopOpacity={0.02} />
					</linearGradient>
				</defs>
				<CartesianGrid strokeDasharray="3 3" stroke="#1a1a1f" vertical={false} />
				<XAxis
					dataKey="timeLabel"
					stroke="#5c5c66"
					tick={CHART_STYLES.tick}
					axisLine={false}
					tickLine={false}
					interval="preserveStartEnd"
				/>
				<YAxis
					stroke="#5c5c66"
					tick={CHART_STYLES.tick}
					width={32}
					axisLine={false}
					tickLine={false}
				/>
				<Tooltip
					cursor={CHART_STYLES.cursorStroke}
					contentStyle={CHART_STYLES.tooltipContentAlt}
					labelStyle={CHART_STYLES.tooltipLabel}
					formatter={formatValue}
				/>
				<Area type="monotone" dataKey="completedTasks" stroke="#00ff88" strokeWidth={1.5} fill="url(#completedGradient)" name="Completed" dot={false} activeDot={{ r: 3, fill: '#00ff88' }} isAnimationActive={false} />
				<Area type="monotone" dataKey="activeTasks" stroke="#ffaa00" strokeWidth={1.5} fill="url(#activeGradient)" name="Active" dot={false} activeDot={{ r: 3, fill: '#ffaa00' }} isAnimationActive={false} />
				<Area type="monotone" dataKey="waitingTasks" stroke="#7b61ff" strokeWidth={1.5} fill="url(#waitingGradient)" name="Waiting" dot={false} activeDot={{ r: 3, fill: '#7b61ff' }} isAnimationActive={false} />
				<Legend
					wrapperStyle={CHART_STYLES.legendWrapper}
					iconType="line"
					iconSize={10}
					formatter={formatLegend}
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
});
TaskVolumeChart.displayName = 'TaskVolumeChart';

// Machine Utilization Chart - isolated for optimal re-renders
const MachineUtilizationChart = memo(({ data }: { data: Array<{ name: string; utilization: number }> }) => {
	const formatValue = useCallback((value: number) => [`${value}%`, 'Utilization'], []);
	const formatTick = useCallback((val: number) => `${val}%`, []);

	return (
		<ResponsiveContainer width="100%" height={180} debounce={100}>
			<BarChart data={data}>
				<CartesianGrid strokeDasharray="3 3" stroke="#1a1a1f" vertical={false} />
				<XAxis dataKey="name" stroke="#5c5c66" tick={CHART_STYLES.tick} axisLine={false} tickLine={false} />
				<YAxis stroke="#5c5c66" tick={CHART_STYLES.tick} domain={[0, 100]} width={32} axisLine={false} tickLine={false} tickFormatter={formatTick} />
				<Tooltip
					cursor={CHART_STYLES.cursorFill}
					contentStyle={CHART_STYLES.tooltipContentAlt}
					labelStyle={CHART_STYLES.tooltipLabel}
					formatter={formatValue}
				/>
				<Bar dataKey="utilization" fill="#00d4ff" radius={[2, 2, 0, 0]} isAnimationActive={false} />
			</BarChart>
		</ResponsiveContainer>
	);
});
MachineUtilizationChart.displayName = 'MachineUtilizationChart';

// ============ MAIN CHARTS CONTAINER ============
const AnalyticsCharts = () => {
	const analyticsHistory = useSystemStore(state => state.analyticsHistory);
	const productionTime = useSystemStore(state => state.productionTime);
	const machines = useSystemStore(state => state.machines);
	const [selectedTimeRange, setSelectedTimeRange] = useState<'5m' | '15m' | '30m' | '1h'>('15m');

	// Memoized data transformations
	const chartData = useMemo(() => {
		const ranges = { '5m': 5, '15m': 15, '30m': 30, '1h': 60 };
		const cutoff = productionTime - ranges[selectedTimeRange];
		return analyticsHistory
			.filter(snap => snap.productionTime >= cutoff)
			.map(snap => ({
				...snap,
				timeLabel: formatTimeHHMM(snap.productionTime)
			}));
	}, [analyticsHistory, productionTime, selectedTimeRange]);

	const machineData = useMemo(() => machines.map(m => ({
		name: m.id,
		utilization: Math.round((m.totalProcessingTime / (productionTime || 1)) * 100),
		status: m.status
	})), [machines, productionTime]);

	return (
		<>
			<section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
				<ChartCard title="Hall Load Trend" timeRange={selectedTimeRange} onTimeRangeChange={setSelectedTimeRange}>
					<HallLoadChart data={chartData} />
				</ChartCard>

				<ChartCard title="Task Volume Trends" timeRange={selectedTimeRange} onTimeRangeChange={setSelectedTimeRange}>
					<TaskVolumeChart data={chartData} />
				</ChartCard>
			</section>

			<section>
				<ChartCard title="Machine Utilization" fullWidth>
					<MachineUtilizationChart data={machineData} />
				</ChartCard>
			</section>
		</>
	);
};

const AnalyticsDistribution = () => {
	const eventLog = useSystemStore(state => state.eventLog);
	const machines = useSystemStore(state => state.machines);

	// All status data for legend (always show all statuses)
	const allStatusData = useMemo(() => {
		const statusCounts = {
			processing: machines.filter(m => m.status === 'processing').length,
			idle: machines.filter(m => m.status === 'idle').length,
			breakdown: machines.filter(m => m.status === 'breakdown').length,
			maintenance: machines.filter(m => m.status === 'maintenance').length,
		};
		return [
			{ name: 'Processing', value: statusCounts.processing, color: '#00ff88' },
			{ name: 'Idle', value: statusCounts.idle, color: '#5c5c66' },
			{ name: 'Breakdown', value: statusCounts.breakdown, color: '#ff3355' },
			{ name: 'Maintenance', value: statusCounts.maintenance, color: '#ffaa00' },
		];
	}, [machines]);

	// Only non-zero values for the pie chart
	const machineStatusData = useMemo(() => {
		return allStatusData.filter(d => d.value > 0);
	}, [allStatusData]);

	return (
		<section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
			<div className="lg:col-span-1">
				<AlertDistributionPanel events={eventLog} />
			</div>

			<div className="bg-[var(--color-surface)] p-5 border border-[var(--color-border)] relative overflow-hidden hud-panel">
				<h3 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
					<span className="w-2 h-2 bg-[var(--color-success)]" />
					Machine Status
				</h3>
				<div className="flex items-center gap-4">
					{/* Pie Chart */}
					<div className="w-[140px] h-[140px] relative flex-shrink-0">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={machineStatusData}
									cx="50%"
									cy="50%"
									innerRadius={45}
									outerRadius={65}
									paddingAngle={3}
									dataKey="value"
									stroke="none"
								>
									{machineStatusData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} />
									))}
								</Pie>
								<Tooltip
									contentStyle={{ backgroundColor: '#0c0c0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0', color: '#f0f0f4', fontSize: '12px' }}
									itemStyle={{ color: '#a0a0a8' }}
								/>
							</PieChart>
						</ResponsiveContainer>
						{/* Center Text */}
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
							<div className="text-center">
								<div className="text-2xl font-bold text-[var(--color-text-primary)] mono-nums">{machines.length}</div>
								<div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Total</div>
							</div>
						</div>
					</div>
					{/* Legend - always show all statuses */}
					<div className="flex-1 space-y-2">
						{allStatusData.map((item) => (
							<div key={item.name} className="flex items-center justify-between text-sm">
								<div className="flex items-center gap-2">
									<span className="w-3 h-3" style={{ backgroundColor: item.color, opacity: item.value > 0 ? 1 : 0.3 }} />
									<span className={`text-xs uppercase tracking-wide ${item.value > 0 ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)]'}`}>{item.name}</span>
								</div>
								<span className={`font-bold mono-nums ${item.value > 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>{item.value}</span>
							</div>
						))}
					</div>
				</div>
			</div>

			<div className="bg-[var(--color-surface)] p-5 border border-[var(--color-border)] hud-panel">
				<h3 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider mb-4">Notification Recipients</h3>
				<div className="space-y-3">
					<RecipientCard name="Production Floor" role="Technicians" count={eventLog.filter(e => e.data?.recipients?.includes('technician')).length} icon={<Wrench size={18} />} />
					<RecipientCard name="Operations" role="Supervisors" count={eventLog.filter(e => e.data?.recipients?.includes('supervisor')).length} icon={<Users size={18} />} />
					<RecipientCard name="Management" role="Managers" count={eventLog.filter(e => e.data?.recipients?.includes('manager')).length} icon={<Briefcase size={18} />} />
					<RecipientCard name="Quality Assurance" role="QC Team" count={eventLog.filter(e => e.data?.recipients?.includes('quality_control')).length} icon={<ShieldCheck size={18} />} />
				</div>
			</div>
		</section>
	);
};

const EventLogTable = () => {
	const eventLog = useSystemStore(state => state.eventLog);
	const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);

	const handleEventClick = (event: SystemEvent) => {
		if (event.data?.taskId) {
			const state = useSystemStore.getState();
			const taskInPool = state.taskPool.find(t => t.id === event.data?.taskId);
			const taskInMachine = state.machines.flatMap(m => m.queue).find(t => t.id === event.data?.taskId) ||
				state.machines.find(m => m.currentTask?.id === event.data?.taskId)?.currentTask;

			const task = taskInPool || taskInMachine;

			if (task) {
				setSelectedTask(task);
			}
		}
	};

	const exportToCSV = useCallback(() => {
		if (eventLog.length === 0) return;

		// CSV Headers
		const headers = ['Timestamp', 'Date', 'Time', 'Event Type', 'Message', 'Severity', 'Task ID', 'Machine ID', 'Recipients'];

		// CSV Rows
		const rows = eventLog.map(event => {
			const date = new Date(event.timestamp);
			return [
				event.timestamp,
				date.toLocaleDateString('en-US'),
				date.toLocaleTimeString('en-US'),
				event.type.replace(/_/g, ' ').toUpperCase(),
				`"${event.message.replace(/"/g, '""')}"`, // Escape quotes in CSV
				event.severity.toUpperCase(),
				event.data?.taskId || '',
				event.data?.machineId || '',
				event.data?.recipients?.join('; ') || ''
			].join(',');
		});

		const csvContent = [headers.join(','), ...rows].join('\n');
		const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
		const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `forgegrid-events-${new Date().toISOString().split('T')[0]}.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}, [eventLog]);

	const exportToJSON = useCallback(() => {
		if (eventLog.length === 0) return;

		const exportData = {
			exportDate: new Date().toISOString(),
			totalEvents: eventLog.length,
			events: eventLog.map(event => ({
				id: event.id,
				timestamp: event.timestamp,
				dateFormatted: new Date(event.timestamp).toLocaleString('en-US'),
				type: event.type,
				typeFormatted: event.type.replace(/_/g, ' ').toUpperCase(),
				message: event.message,
				severity: event.severity,
				data: {
					taskId: event.data?.taskId || null,
					machineId: event.data?.machineId || null,
					recipients: event.data?.recipients || []
				}
			}))
		};

		const jsonContent = JSON.stringify(exportData, null, 2);
		const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `forgegrid-events-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}, [eventLog]);

	const exportToExcel = useCallback(async () => {
		const state = useSystemStore.getState();
		const machines = state.machines;
		const metrics = state.getGlobalMetrics();
		const analyticsHistory = state.analyticsHistory;
		const completedTasks = state.completedTasks;
		const productionTime = state.productionTime;
		const now = new Date();

		// Create professional workbook with ExcelJS
		const workbook = new ExcelJS.Workbook();
		workbook.creator = 'ForgeGrid Production Intelligence';
		workbook.created = now;
		workbook.modified = now;

		// Color scheme
		const colors = {
			primary: '00D4FF',      // Cyan accent
			success: '00FF88',      // Green
			warning: 'FFAA00',      // Orange
			danger: 'FF3355',       // Red
			info: '7B61FF',         // Purple
			dark: '0C0C0F',         // Dark background
			surface: '141419',      // Surface
			text: 'F0F0F4',         // Light text
			muted: '7A7A88',        // Muted text
			header: '1A1A22',       // Header bg
		};

		// ═══════════════════════════════════════════════════════════════════
		// 📊 DASHBOARD SHEET
		// ═══════════════════════════════════════════════════════════════════
		const dashboard = workbook.addWorksheet('Dashboard', {
			properties: { tabColor: { argb: colors.primary } },
			views: [{ showGridLines: false }]
		});

		// Set column widths
		dashboard.columns = [
			{ width: 5 }, { width: 25 }, { width: 20 }, { width: 15 }, { width: 15 }, { width: 15 }
		];

		// Title
		dashboard.mergeCells('B2:E2');
		const titleCell = dashboard.getCell('B2');
		titleCell.value = 'FORGEGRID PRODUCTION INTELLIGENCE REPORT';
		titleCell.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: colors.primary } };
		titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
		dashboard.getRow(2).height = 35;

		// Subtitle
		dashboard.mergeCells('B3:E3');
		const subtitleCell = dashboard.getCell('B3');
		subtitleCell.value = `Generated: ${now.toLocaleString('en-US')} | Runtime: ${productionTime.toFixed(1)} min`;
		subtitleCell.font = { name: 'Segoe UI', size: 10, color: { argb: colors.muted } };
		subtitleCell.alignment = { horizontal: 'center' };

		// KPI Section Header
		dashboard.getCell('B5').value = 'KEY PERFORMANCE INDICATORS';
		dashboard.getCell('B5').font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: colors.text } };
		dashboard.getCell('B5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.header } };
		dashboard.mergeCells('B5:E5');

		// KPI Data
		const kpiData = [
			['Throughput Rate', `${metrics.throughput} tasks/hour`, metrics.throughput > 10 ? 'OPTIMAL' : 'LOW', metrics.throughput > 10 ? colors.success : colors.warning],
			['Hall Utilization', `${metrics.hallLoad}%`, metrics.hallLoad > 70 ? 'HIGH' : metrics.hallLoad > 40 ? 'NORMAL' : 'LOW', metrics.hallLoad > 70 ? colors.success : colors.warning],
			['Tasks Completed', `${metrics.completedCount}`, 'COMPLETED', colors.success],
			['Tasks In Progress', `${metrics.inProgressCount}`, metrics.inProgressCount > 0 ? 'ACTIVE' : 'IDLE', colors.primary],
			['Queue Backlog', `${metrics.waitingCount}`, metrics.waitingCount > 20 ? 'HIGH' : 'NORMAL', metrics.waitingCount > 20 ? colors.warning : colors.success],
		];

		kpiData.forEach((kpi, index) => {
			const row = dashboard.getRow(7 + index);
			row.getCell(2).value = kpi[0];
			row.getCell(2).font = { name: 'Segoe UI', size: 11, color: { argb: colors.text } };
			row.getCell(3).value = kpi[1];
			row.getCell(3).font = { name: 'Consolas', size: 12, bold: true, color: { argb: colors.primary } };
			row.getCell(3).alignment = { horizontal: 'right' };
			row.getCell(4).value = kpi[2];
			row.getCell(4).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: kpi[3] as string } };
			row.getCell(4).alignment = { horizontal: 'center' };

			// Add subtle row background
			for (let col = 2; col <= 4; col++) {
				row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? colors.surface : colors.dark } };
				row.getCell(col).border = {
					bottom: { style: 'thin', color: { argb: '2A2A33' } }
				};
			}
		});

		// Machine Status Section
		dashboard.getCell('B14').value = 'MACHINE FLEET STATUS';
		dashboard.getCell('B14').font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: colors.text } };
		dashboard.getCell('B14').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.header } };
		dashboard.mergeCells('B14:E14');

		const statusData = [
			['Processing', machines.filter(m => m.status === 'processing').length, colors.success],
			['Idle', machines.filter(m => m.status === 'idle').length, colors.muted],
			['Breakdown', machines.filter(m => m.status === 'breakdown').length, colors.danger],
			['Maintenance', machines.filter(m => m.status === 'maintenance').length, colors.warning],
		];

		statusData.forEach((status, index) => {
			const row = dashboard.getRow(16 + index);
			row.getCell(2).value = status[0];
			row.getCell(2).font = { name: 'Segoe UI', size: 11, color: { argb: colors.text } };
			row.getCell(3).value = status[1];
			row.getCell(3).font = { name: 'Consolas', size: 14, bold: true, color: { argb: status[2] as string } };
			row.getCell(3).alignment = { horizontal: 'center' };
			row.getCell(4).value = `${((status[1] as number / machines.length) * 100).toFixed(0)}%`;
			row.getCell(4).font = { name: 'Segoe UI', size: 10, color: { argb: colors.muted } };
			row.getCell(4).alignment = { horizontal: 'right' };
		});

		// ═══════════════════════════════════════════════════════════════════
		// 🏭 MACHINES SHEET
		// ═══════════════════════════════════════════════════════════════════
		const machinesSheet = workbook.addWorksheet('Machines', {
			properties: { tabColor: { argb: colors.success } },
			views: [{ state: 'frozen', ySplit: 1 }]
		});

		// Headers
		const machineHeaders = ['Machine ID', 'Name', 'Type', 'Status', 'Speed', 'Processing Time', 'Tasks Done', 'Queue', 'Utilization'];
		machinesSheet.columns = [
			{ header: machineHeaders[0], key: 'id', width: 12 },
			{ header: machineHeaders[1], key: 'name', width: 28 },
			{ header: machineHeaders[2], key: 'type', width: 12 },
			{ header: machineHeaders[3], key: 'status', width: 14 },
			{ header: machineHeaders[4], key: 'speed', width: 10 },
			{ header: machineHeaders[5], key: 'processingTime', width: 16 },
			{ header: machineHeaders[6], key: 'tasksDone', width: 12 },
			{ header: machineHeaders[7], key: 'queue', width: 8 },
			{ header: machineHeaders[8], key: 'utilization', width: 12 },
		];

		// Style header row
		const headerRow = machinesSheet.getRow(1);
		headerRow.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: colors.primary } };
		headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.header } };
		headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
		headerRow.height = 25;

		// Add machine data
		machines.forEach((machine, index) => {
			const utilization = productionTime > 0 ? ((machine.totalProcessingTime / productionTime) * 100) : 0;
			const row = machinesSheet.addRow({
				id: machine.id,
				name: machine.name,
				type: machine.type,
				status: machine.status.toUpperCase(),
				speed: machine.effectiveTimeMultiplier < 0.9 ? 'FAST' : machine.effectiveTimeMultiplier > 1.1 ? 'SLOW' : 'NORMAL',
				processingTime: `${machine.totalProcessingTime.toFixed(1)} min`,
				tasksDone: machine.completedTasks,
				queue: machine.queue.length,
				utilization: `${utilization.toFixed(1)}%`
			});

			row.font = { name: 'Segoe UI', size: 10, color: { argb: colors.text } };
			row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? colors.surface : colors.dark } };

			// Status color coding
			const statusCell = row.getCell(4);
			const statusColors: Record<string, string> = {
				'PROCESSING': colors.success,
				'IDLE': colors.muted,
				'BREAKDOWN': colors.danger,
				'MAINTENANCE': colors.warning
			};
			statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: statusColors[machine.status.toUpperCase()] || colors.text } };

			// Utilization conditional formatting
			const utilCell = row.getCell(9);
			utilCell.font = { name: 'Consolas', size: 10, bold: true, color: { argb: utilization > 70 ? colors.success : utilization > 40 ? colors.warning : colors.muted } };
		});

		// Add autofilter
		machinesSheet.autoFilter = 'A1:I1';

		// ═══════════════════════════════════════════════════════════════════
		// 📈 TRENDS SHEET (Data for Charts)
		// ═══════════════════════════════════════════════════════════════════
		if (analyticsHistory.length > 0) {
			const trendsSheet = workbook.addWorksheet('Trends', {
				properties: { tabColor: { argb: colors.info } },
				views: [{ state: 'frozen', ySplit: 1 }]
			});

			trendsSheet.columns = [
				{ header: 'Time (min)', key: 'time', width: 12 },
				{ header: 'Hall Load %', key: 'hallLoad', width: 14 },
				{ header: 'Throughput', key: 'throughput', width: 12 },
				{ header: 'Waiting', key: 'waiting', width: 10 },
				{ header: 'Active', key: 'active', width: 10 },
				{ header: 'Completed', key: 'completed', width: 12 },
			];

			const trendHeader = trendsSheet.getRow(1);
			trendHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: colors.info } };
			trendHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.header } };
			trendHeader.alignment = { horizontal: 'center' };

			analyticsHistory.forEach((snap, index) => {
				const row = trendsSheet.addRow({
					time: Number(snap.productionTime.toFixed(1)),
					hallLoad: snap.hallLoad,
					throughput: snap.throughput,
					waiting: snap.waitingTasks,
					active: snap.activeTasks,
					completed: snap.completedTasks
				});
				row.font = { name: 'Consolas', size: 10, color: { argb: colors.text } };
				row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? colors.surface : colors.dark } };
			});

			// Statistics summary at bottom
			const lastDataRow = analyticsHistory.length + 2;
			trendsSheet.getCell(`A${lastDataRow + 2}`).value = 'STATISTICS';
			trendsSheet.getCell(`A${lastDataRow + 2}`).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: colors.primary } };

			const stats = [
				['Hall Load', Math.min(...analyticsHistory.map(h => h.hallLoad)), Math.max(...analyticsHistory.map(h => h.hallLoad)), (analyticsHistory.reduce((s, h) => s + h.hallLoad, 0) / analyticsHistory.length)],
				['Throughput', Math.min(...analyticsHistory.map(h => h.throughput)), Math.max(...analyticsHistory.map(h => h.throughput)), (analyticsHistory.reduce((s, h) => s + h.throughput, 0) / analyticsHistory.length)],
			];

			trendsSheet.getRow(lastDataRow + 3).values = ['Metric', 'Min', 'Max', 'Average'];
			trendsSheet.getRow(lastDataRow + 3).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: colors.muted } };

			stats.forEach((stat, i) => {
				const row = trendsSheet.getRow(lastDataRow + 4 + i);
				row.values = [stat[0], stat[1], stat[2], Number((stat[3] as number).toFixed(1))];
				row.font = { name: 'Consolas', size: 10, color: { argb: colors.text } };
			});
		}

		// ═══════════════════════════════════════════════════════════════════
		// 📋 EVENT LOG SHEET
		// ═══════════════════════════════════════════════════════════════════
		const eventsSheet = workbook.addWorksheet('Event Log', {
			properties: { tabColor: { argb: colors.warning } },
			views: [{ state: 'frozen', ySplit: 1 }]
		});

		eventsSheet.columns = [
			{ header: '#', key: 'index', width: 6 },
			{ header: 'Date', key: 'date', width: 12 },
			{ header: 'Time', key: 'time', width: 10 },
			{ header: 'Event Type', key: 'type', width: 20 },
			{ header: 'Severity', key: 'severity', width: 12 },
			{ header: 'Message', key: 'message', width: 50 },
			{ header: 'Task ID', key: 'taskId', width: 15 },
			{ header: 'Machine', key: 'machine', width: 12 },
		];

		const eventHeader = eventsSheet.getRow(1);
		eventHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: colors.warning } };
		eventHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.header } };
		eventHeader.alignment = { horizontal: 'center' };
		eventHeader.height = 25;

		// Event type colors
		const eventTypeColors: Record<string, string> = {
			'task_created': '3B82F6',
			'task_assigned': '6366F1',
			'task_started': '06B6D4',
			'task_completed': '10B981',
			'task_cancelled': '64748B',
			'machine_breakdown': 'EF4444',
			'machine_repaired': '14B8A6',
			'alert_sent': 'F59E0B',
			'rebalance_triggered': '8B5CF6',
		};

		eventLog.forEach((event, index) => {
			const date = new Date(event.timestamp);
			const row = eventsSheet.addRow({
				index: index + 1,
				date: date.toLocaleDateString('en-US'),
				time: date.toLocaleTimeString('en-US'),
				type: event.type.replace(/_/g, ' ').toUpperCase(),
				severity: event.severity.toUpperCase(),
				message: event.message,
				taskId: event.data?.taskId || '',
				machine: event.data?.machineId || ''
			});

			row.font = { name: 'Segoe UI', size: 10, color: { argb: colors.text } };
			row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? colors.surface : colors.dark } };

			// Color code event type
			const typeCell = row.getCell(4);
			typeCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: eventTypeColors[event.type] || colors.text } };

			// Color code severity
			const sevCell = row.getCell(5);
			const sevColors: Record<string, string> = { 'INFO': colors.primary, 'WARNING': colors.warning, 'CRITICAL': colors.danger };
			sevCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: sevColors[event.severity.toUpperCase()] || colors.text } };
		});

		eventsSheet.autoFilter = 'A1:H1';

		// ═══════════════════════════════════════════════════════════════════
		// ✅ COMPLETED TASKS SHEET
		// ═══════════════════════════════════════════════════════════════════
		if (completedTasks.length > 0) {
			const tasksSheet = workbook.addWorksheet('Completed Tasks', {
				properties: { tabColor: { argb: colors.success } },
				views: [{ state: 'frozen', ySplit: 1 }]
			});

			tasksSheet.columns = [
				{ header: 'Task ID', key: 'id', width: 14 },
				{ header: 'Name', key: 'name', width: 30 },
				{ header: 'Client', key: 'client', width: 22 },
				{ header: 'Priority', key: 'priority', width: 10 },
				{ header: 'Workload', key: 'workload', width: 12 },
				{ header: 'Machine', key: 'machine', width: 12 },
				{ header: 'Value', key: 'value', width: 14 },
			];

			const taskHeader = tasksSheet.getRow(1);
			taskHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: colors.success } };
			taskHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.header } };
			taskHeader.alignment = { horizontal: 'center' };

			completedTasks.slice(-200).forEach((task, index) => {
				const row = tasksSheet.addRow({
					id: task.id,
					name: task.displayName,
					client: task.clientName,
					priority: task.priority.toUpperCase(),
					workload: `${task.workloadMinutes.toFixed(1)} min`,
					machine: task.assignedMachine || 'N/A',
					value: task.orderValue
				});

				row.font = { name: 'Segoe UI', size: 10, color: { argb: colors.text } };
				row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? colors.surface : colors.dark } };

				// Priority coloring
				const prioCell = row.getCell(4);
				const prioColors: Record<string, string> = { 'CRITICAL': colors.danger, 'RUSH': colors.warning, 'NORMAL': colors.muted };
				prioCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: prioColors[task.priority.toUpperCase()] || colors.text } };

				// Format value as currency
				const valCell = row.getCell(7);
				valCell.numFmt = '$#,##0';
				valCell.font = { name: 'Consolas', size: 10, color: { argb: colors.success } };
			});

			tasksSheet.autoFilter = 'A1:G1';

			// Summary section
			const summaryRow = completedTasks.length + 4;
			tasksSheet.getCell(`A${summaryRow}`).value = 'SUMMARY';
			tasksSheet.getCell(`A${summaryRow}`).font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: colors.primary } };

			const summaryData = [
				['Total Tasks:', completedTasks.length],
				['Total Revenue:', completedTasks.reduce((s, t) => s + t.orderValue, 0)],
				['Avg Task Value:', completedTasks.reduce((s, t) => s + t.orderValue, 0) / completedTasks.length],
				['Critical Tasks:', completedTasks.filter(t => t.priority === 'critical').length],
				['Rush Tasks:', completedTasks.filter(t => t.priority === 'rush').length],
			];

			summaryData.forEach((item, i) => {
				const row = tasksSheet.getRow(summaryRow + 1 + i);
				row.getCell(1).value = item[0];
				row.getCell(1).font = { name: 'Segoe UI', size: 10, color: { argb: colors.muted } };
				row.getCell(2).value = item[1];
				row.getCell(2).font = { name: 'Consolas', size: 11, bold: true, color: { argb: colors.text } };
				if (i === 1 || i === 2) {
					row.getCell(2).numFmt = '$#,##0.00';
				}
			});
		}

		// ═══════════════════════════════════════════════════════════════════
		// Generate and Download File
		// ═══════════════════════════════════════════════════════════════════
		const buffer = await workbook.xlsx.writeBuffer();
		const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `ForgeGrid_Report_${now.toISOString().split('T')[0]}_${now.toTimeString().split(' ')[0].replace(/:/g, '')}.xlsx`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}, [eventLog]);

	return (
		<>
			<div className="bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden flex flex-col h-[600px] hud-panel">
				<div className="p-4 border-b border-[var(--color-border-dim)] flex justify-between items-center bg-[var(--color-elevated)]">
					<h3 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-3">
						<FileText size={18} className="text-[var(--color-accent)]" />
						System Event Log
					</h3>
					<div className="flex gap-2">
						<button
							onClick={exportToExcel}
							disabled={eventLog.length === 0}
							className="p-2.5 border border-[var(--color-border)] hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all text-[var(--color-text-muted)] hover:text-emerald-400 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--color-border)] disabled:hover:bg-transparent disabled:hover:text-[var(--color-text-muted)]"
							title="Export Full Report (Excel with multiple sheets)"
						>
							<FileSpreadsheet size={16} />
							<span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">EXCEL</span>
						</button>
						<button
							onClick={exportToCSV}
							disabled={eventLog.length === 0}
							className="p-2.5 border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/10 transition-all text-[var(--color-text-muted)] hover:text-[var(--color-accent)] flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--color-border)] disabled:hover:bg-transparent disabled:hover:text-[var(--color-text-muted)]"
							title="Export to CSV"
						>
							<Download size={16} />
							<span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">CSV</span>
						</button>
						<button
							onClick={exportToJSON}
							disabled={eventLog.length === 0}
							className="p-2.5 border border-[var(--color-border)] hover:border-[var(--color-info)]/50 hover:bg-[var(--color-info)]/10 transition-all text-[var(--color-text-muted)] hover:text-[var(--color-info)] flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--color-border)] disabled:hover:bg-transparent disabled:hover:text-[var(--color-text-muted)]"
							title="Export to JSON"
						>
							<Code size={16} />
							<span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">JSON</span>
						</button>
					</div>
				</div>

				<div className="overflow-auto flex-1 p-0">
					<table className="w-full text-left border-collapse">
						<thead className="bg-[var(--color-elevated)] sticky top-0 z-10">
							<tr>
								<th className="p-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider border-b border-[var(--color-border)]">Time</th>
								<th className="p-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider border-b border-[var(--color-border)]">Type</th>
								<th className="p-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider border-b border-[var(--color-border)]">Message</th>
								<th className="p-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider border-b border-[var(--color-border)]">Severity</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[var(--color-border-dim)]">
							{eventLog.slice().reverse().map((event) => (
								<tr
									key={event.id}
									className={`group hover:bg-[var(--color-elevated)] transition-colors ${event.data?.taskId ? 'cursor-pointer' : ''}`}
									onClick={() => handleEventClick(event)}
								>
									<td className="p-4 text-sm text-[var(--color-text-muted)] font-mono whitespace-nowrap">
										{new Date(event.timestamp).toLocaleTimeString()}
									</td>
									<td className="p-4">
										{(() => {
											const colors = getEventColors(event.type);
											return (
												<span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase tracking-wide border ${colors.bg} ${colors.text} ${colors.border}`}>
													{event.type.replace(/_/g, ' ')}
												</span>
											);
										})()}
									</td>
									<td className="p-4 text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors max-w-xs truncate">
										{event.message}
										{event.data?.taskId && (
											<span className="ml-2 text-xs text-[var(--color-accent)]/80 bg-[var(--color-accent)]/10 px-2 py-0.5 border border-[var(--color-accent)]/20 group-hover:border-[var(--color-accent)]/40 transition-colors">
												{event.data.taskId}
											</span>
										)}
									</td>
									<td className="p-4 text-sm text-[var(--color-text-muted)] font-mono uppercase">
										{event.severity}
									</td>
								</tr>
							))}
							{eventLog.length === 0 && (
								<tr>
									<td colSpan={4} className="p-12 text-center text-[var(--color-text-muted)] text-sm">
										No events recorded yet. Start the simulation to generate logs.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{selectedTask && (
				<TaskDetailsModal
					task={selectedTask}
					onClose={() => setSelectedTask(null)}
				/>
			)}
		</>
	);
};

export function Analytics() {
	return (
		<div className="flex flex-col h-full overflow-hidden relative z-10">
			{/* Metrics Bar */}
			<div className="flex-none px-4 lg:px-8 py-4 border-b border-[var(--color-border-dim)] bg-[var(--color-abyss)]/60">
				<GlobalMetricsPanel />
			</div>

			{/* Main Content */}
			<main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar bg-[var(--color-void)]">
				<AnalyticsKPIs />
				<AnalyticsCharts />
				<AnalyticsDistribution />
				<EventLogTable />
			</main>
		</div>
	);
}
