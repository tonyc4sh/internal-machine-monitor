import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Wrench, Microscope, Package, AlertTriangle } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSystemStore } from '../store';
import { PRIORITY_STYLES, MACHINE_STATUS_CONFIG } from '../config';
import { TaskDetailsModal } from './TaskDetailsModal';
import type { TaskInstance } from '../types';

interface MachineColumnProps {
	machineId: string;
}

const MachineIcon = ({ type }: { type: string }) => {
	const iconClass = "w-5 h-5 text-white";
	switch (type) {
		case 'CNC': return <Cpu className={iconClass} />;
		case 'Assembly': return <Wrench className={iconClass} />;
		case 'Test': return <Microscope className={iconClass} />;
		case 'Packaging': return <Package className={iconClass} />;
		default: return <Cpu className={iconClass} />;
	}
};

export const MachineColumn = React.memo(function MachineColumn({ machineId }: MachineColumnProps) {
	const machine = useSystemStore(state => state.machines.find(m => m.id === machineId));
	const metrics = useSystemStore(useShallow(state => state.getMachineMetrics(machineId)));
	const toggleMachineBreakdown = useSystemStore(state => state.toggleMachineBreakdown);
	const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);

	if (!machine) return null;

	const config = MACHINE_STATUS_CONFIG[machine.status];

	// Custom status styles for the new theme
	const getStatusStyles = (status: string) => {
		switch (status) {
			case 'processing': return {
				border: 'border-[var(--color-success)]/30',
				glow: 'glow-success',
				bg: 'bg-[var(--color-success)]/5',
				text: 'text-[var(--color-success)]',
				indicator: 'bg-[var(--color-success)]'
			};
			case 'breakdown': return {
				border: 'border-[var(--color-danger)]/40',
				glow: 'glow-danger',
				bg: 'bg-[var(--color-danger)]/5',
				text: 'text-[var(--color-danger)]',
				indicator: 'bg-[var(--color-danger)]'
			};
			case 'maintenance': return {
				border: 'border-[var(--color-warning)]/30',
				glow: 'glow-warning',
				bg: 'bg-[var(--color-warning)]/5',
				text: 'text-[var(--color-warning)]',
				indicator: 'bg-[var(--color-warning)]'
			};
			default: return {
				border: 'border-[var(--color-border)]',
				glow: '',
				bg: 'bg-[var(--color-surface)]',
				text: 'text-[var(--color-text-muted)]',
				indicator: 'bg-[var(--color-text-muted)]'
			};
		}
	};

	const statusStyle = getStatusStyles(machine.status);

	return (
		<motion.div
			className={`
				relative flex flex-col h-full overflow-hidden
				bg-[var(--color-surface)]
				border ${statusStyle.border}
				hover:border-[var(--color-border-bright)] transition-colors
				${statusStyle.glow}
			`}
		>
			{/* Top Status Line */}
			<div className={`absolute top-0 left-0 right-0 h-[2px] ${statusStyle.indicator}`} />			{/* Header Section */}
			<div className="flex-none p-4 border-b border-[var(--color-border-dim)] bg-white/[0.02]">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0 flex-1">
						<div className={`w-9 h-9 flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-abyss)] ${statusStyle.text}`}>
							<MachineIcon type={machine.type} />
						</div>
						<div className="min-w-0 flex-1">
							<h2 className="font-bold text-[var(--color-text-primary)] text-sm leading-tight truncate uppercase tracking-wide">
								{machine.name}
							</h2>
							<div className="flex items-center gap-2 mt-1">
								<span className={`w-2 h-2 ${statusStyle.indicator}`} />
								<span className={`text-xs font-bold uppercase tracking-wider ${statusStyle.text}`}>
									{config.labelText}
								</span>
							</div>
						</div>
					</div>

					<button
						onClick={() => toggleMachineBreakdown(machine.id)}
						className={`w-8 h-8 flex items-center justify-center border transition-colors ${machine.status === 'breakdown'
							? 'bg-[var(--color-danger)] text-white border-[var(--color-danger)]'
							: 'bg-[var(--color-elevated)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)]/40'}`}
						title={machine.status === 'breakdown' ? "Repair" : "Break"}
					>
						<AlertTriangle size={14} />
					</button>
				</div>

				{/* Mini Stats */}
				<div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[var(--color-border-dim)]">
					<div>
						<span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Eff</span>
						<div className="text-sm font-mono text-[var(--color-text-secondary)]">{Math.round(machine.effectiveTimeMultiplier * 100)}%</div>
					</div>
					<div className="border-l border-[var(--color-border-dim)] pl-2">
						<span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Util</span>
						<div className={`text-sm font-mono ${metrics?.utilization && metrics.utilization > 80 ? 'text-[var(--color-success)]' : 'text-[var(--color-text-secondary)]'}`}>
							{metrics?.utilization || 0}%
						</div>
					</div>
					<div className="border-l border-[var(--color-border-dim)] pl-2">
						<span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Done</span>
						<div className="text-sm font-mono text-[var(--color-success)]">{machine.completedTasks}</div>
					</div>
				</div>
			</div>

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
				{/* Current Task */}
				<div>
					<div className="flex justify-between items-center mb-2">
						<span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Active</span>
						{machine.currentTask && (
							<span className="text-xs text-[var(--color-success)] font-mono bg-[var(--color-success)]/10 px-2 py-0.5">
								{Math.round(machine.currentTask.progress * 100)}%
							</span>
						)}
					</div>

					<AnimatePresence mode="popLayout">
						{machine.currentTask ? (
							<motion.div
								key={machine.currentTask.id}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="bg-[var(--color-abyss)] border border-[var(--color-border-dim)] p-3"
							>
								<div className="flex justify-between items-center gap-2 mb-2">
									<span className="text-sm text-[var(--color-text-primary)] truncate">
										{machine.currentTask.displayName}
									</span>
									<span className="text-xs text-[var(--color-text-muted)] font-mono">
										{Math.round(machine.currentTask.remainingMinutes)}m
									</span>
								</div>
								<div className="h-1.5 bg-[var(--color-elevated)] overflow-hidden rounded-full">
									<div
										className="h-full bg-gradient-to-r from-[var(--color-success)] to-[var(--color-accent)] rounded-full"
										style={{
											width: `${machine.currentTask.progress * 100}%`,
											transition: 'width 300ms linear'
										}}
									/>
								</div>
							</motion.div>
						) : (
							<motion.div
								key="empty"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="border border-dashed border-[var(--color-border)] py-4 text-center"
							>
								<span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Idle</span>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Queue */}
				<div className="flex-1 flex flex-col min-h-0 mt-1">
					<div className="flex justify-between items-center mb-2">
						<span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
							Queue [{machine.queue.length}]
						</span>
						{metrics?.eta !== undefined && metrics.eta > 0 && (
							<span className="text-xs text-[var(--color-accent)] font-mono">~{metrics.eta}m</span>
						)}
					</div>

					<div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar">
						<AnimatePresence mode="popLayout">
							{machine.queue.length === 0 ? (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="flex flex-col items-center justify-center h-20 text-[var(--color-text-muted)]"
								>
									<span className="text-xs font-medium uppercase tracking-widest opacity-40">Queue Empty</span>
								</motion.div>
							) : (
								<>
									{machine.queue.slice(0, 20).map((task) => {
										const style = PRIORITY_STYLES[task.priority];
										return (
											<motion.div
												key={task.id}
												layout="position"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												onClick={() => setSelectedTask(task)}
												className={`border-l-2 ${style.border} bg-[var(--color-elevated)] border border-[var(--color-border-dim)] px-3 py-2 text-sm hover:bg-white/[0.04] cursor-pointer flex justify-between items-center gap-2`}
											>
												<span className="truncate flex-1 text-[var(--color-text-secondary)]">{task.displayName}</span>
												<span className="text-[var(--color-text-muted)] font-mono text-xs">
													{Math.round(task.workloadMinutes * machine.effectiveTimeMultiplier)}m
												</span>
											</motion.div>
										);
									})}
								</>
							)}
						</AnimatePresence>
					</div>
				</div>
			</div>

			<AnimatePresence>
				{selectedTask && (
					<TaskDetailsModal
						task={selectedTask}
						onClose={() => setSelectedTask(null)}
					/>
				)}
			</AnimatePresence>
		</motion.div>
	);
});



