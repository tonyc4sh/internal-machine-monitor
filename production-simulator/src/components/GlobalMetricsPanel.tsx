import React from 'react';
import { Clock, CheckCircle2, PlayCircle, Hourglass, TrendingUp, Activity } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSystemStore } from '../store';

export const GlobalMetricsPanel = React.memo(function GlobalMetricsPanel() {
	const metrics = useSystemStore(useShallow(state => state.getGlobalMetrics()));
	const productionTime = useSystemStore(state => state.productionTime);
	const isRunning = useSystemStore(state => state.isRunning);

	const formatTime = (minutes: number): string => {
		const hours = Math.floor(minutes / 60);
		const mins = Math.floor(minutes % 60);
		return `${hours}h ${mins.toString().padStart(2, '0')}m`;
	};

	const getLoadStatus = (load: number) => {
		if (load > 85) return { label: 'Critical', color: 'text-[var(--color-danger)]', bg: 'bg-[var(--color-danger)]' };
		if (load > 70) return { label: 'High', color: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning)]' };
		if (load > 40) return { label: 'Normal', color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent)]' };
		return { label: 'Low', color: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success)]' };
	};

	const loadStatus = getLoadStatus(metrics.hallLoad);

	return (
		<div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4">
			{/* Left: Status & Time */}
			<div className="lg:col-span-3 flex flex-row lg:flex-col gap-3">
				<div className="flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] p-4 flex-1">
					<div className={`p-2.5 ${isRunning ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-elevated)] text-[var(--color-text-muted)]'}`}>
						<Activity size={18} />
					</div>
					<div>
						<div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Status</div>
						<div className={`text-base font-bold ${isRunning ? 'text-[var(--color-success)] text-glow-success' : 'text-[var(--color-text-muted)]'}`}>
							{isRunning ? 'ONLINE' : 'PAUSED'}
						</div>
					</div>
				</div>

				<div className="flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] p-4 flex-1">
					<div className="p-2.5 bg-[var(--color-accent-dim)] text-[var(--color-accent)]">
						<Clock size={18} />
					</div>
					<div>
						<div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Production</div>
						<span className="text-base font-bold text-[var(--color-text-primary)] font-mono">{formatTime(productionTime)}</span>
					</div>
				</div>
			</div>

			{/* Center: Hall Load */}
			<div className="lg:col-span-6">
				<div className="h-full min-h-[110px] flex items-center justify-between p-5 bg-[var(--color-surface)] border border-[var(--color-border)] glow-cyan">
					<div className="flex-1">
						<div className="flex items-center gap-3 mb-2">
							<span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Hall Utilization</span>
							<span className={`text-xs font-bold ${loadStatus.color} px-2 py-0.5 bg-white/5`}>{loadStatus.label}</span>
						</div>
						<div className={`text-5xl font-bold ${loadStatus.color} mono-nums`}>
							{metrics.hallLoad}<span className="text-2xl opacity-50">%</span>
						</div>
						<div className="mt-3 h-2 bg-[var(--color-abyss)] overflow-hidden">
							<div className={`h-full ${loadStatus.bg} transition-all`} style={{ width: `${metrics.hallLoad}%` }} />
						</div>
					</div>

					<div className="relative w-24 h-24 ml-6 hidden sm:block">
						<svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
							<path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-abyss)" strokeWidth="2.5" />
							<path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray={`${metrics.hallLoad}, 100`} className={loadStatus.color} />
						</svg>
						<div className="absolute inset-0 flex items-center justify-center">
							<TrendingUp className={`${loadStatus.color} opacity-60`} size={22} />
						</div>
					</div>
				</div>
			</div>

			{/* Right: Key Metrics */}
			<div className="lg:col-span-3 grid grid-cols-3 lg:grid-cols-1 gap-3">
				<StatCard icon={<PlayCircle size={16} />} label="Active" value={metrics.inProgressCount} color="cyan" />
				<StatCard icon={<Hourglass size={16} />} label="Queue" value={metrics.waitingCount} color={metrics.waitingCount > 15 ? 'amber' : 'neutral'} />
				<StatCard icon={<CheckCircle2 size={16} />} label="Done" value={metrics.completedCount} color="emerald" />
			</div>
		</div>
	);
});

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
	const colors: Record<string, string> = {
		cyan: 'text-[var(--color-accent)]',
		amber: 'text-[var(--color-warning)]',
		emerald: 'text-[var(--color-success)]',
		neutral: 'text-[var(--color-text-secondary)]',
	};

	return (
		<div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)]">
			<div className="flex items-center gap-2.5">
				<div className={`opacity-60 ${colors[color]}`}>{icon}</div>
				<span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{label}</span>
			</div>
			<span className={`text-xl font-bold font-mono ${colors[color]}`}>{value}</span>
		</div>
	);
}


