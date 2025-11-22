import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, AlertTriangle, Zap, Inbox, Clock, Hash, Layers } from 'lucide-react';
import { useSystemStore } from '../store';
import { PRIORITY_STYLES } from '../config';
import type { TaskInstance } from '../types';
import { TaskDetailsModal } from './TaskDetailsModal';

const PriorityIcon = ({ priority }: { priority: 'normal' | 'rush' | 'critical' }) => {
	const size = 12;
	switch (priority) {
		case 'critical': return <AlertTriangle size={size} />;
		case 'rush': return <Zap size={size} />;
		case 'normal': return <Box size={size} />;
	}
};

export const TaskPoolPanel = memo(function TaskPoolPanel() {
	const tasks = useSystemStore(state => state.taskPool);
	const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);

	const displayLimit = 50;
	const visibleTasks = tasks.slice(0, displayLimit);
	const remainingCount = Math.max(0, tasks.length - displayLimit);

	return (
		<div className="flex flex-col h-full overflow-hidden bg-[var(--color-surface)]">
			{/* Header */}
			<div className="p-4 border-b border-[var(--color-border-dim)] bg-white/[0.02]">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-[var(--color-accent-dim)] text-[var(--color-accent)]">
							<Layers size={16} />
						</div>
						<div>
							<h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wide">Task Pool</h2>
							<div className="text-xs text-[var(--color-text-muted)]">Incoming Orders</div>
						</div>
					</div>
					<span className="text-[var(--color-accent)] font-bold font-mono text-lg">
						{tasks.length}
					</span>
				</div>
			</div>

			{/* List */}
			<div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
				<AnimatePresence mode="popLayout">
					{tasks.length === 0 ? (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="flex flex-col items-center justify-center h-full py-8"
						>
							<div className="w-12 h-12 border border-[var(--color-border-dim)] flex items-center justify-center mb-3">
								<Inbox size={22} className="text-[var(--color-text-muted)]" />
							</div>
							<span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">No Tasks</span>
						</motion.div>
					) : (
						<>
							{visibleTasks.map((task) => {
								const style = PRIORITY_STYLES[task.priority];
								return (
									<motion.div
										key={task.id}
										layout="position"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										onClick={() => setSelectedTask(task)}
										className={`border-l-2 ${style.border} bg-[var(--color-elevated)] border border-[var(--color-border-dim)] px-3 py-2.5 hover:bg-white/[0.04] cursor-pointer`}
									>
										<div className="flex justify-between items-start gap-2 mb-1.5">
											<span className="text-sm text-[var(--color-text-secondary)] truncate flex-1">{task.displayName}</span>
											<span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 ${style.badge}`}>
												<PriorityIcon priority={task.priority} />
											</span>
										</div>
										<div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-mono">
											<span className="flex items-center gap-1.5 truncate">
												<Hash size={10} />
												<span className="truncate">{task.id}</span>
											</span>
											<span className="flex items-center gap-1">
												<Clock size={10} />
												{Math.round(task.workloadMinutes)}m
											</span>
										</div>
									</motion.div>
								);
							})}
							{remainingCount > 0 && (
								<div className="text-center py-3 text-xs text-[var(--color-text-muted)]">
									+ {remainingCount} more
								</div>
							)}
						</>
					)}
				</AnimatePresence>
			</div>

			<AnimatePresence>
				{selectedTask && (
					<TaskDetailsModal task={selectedTask} onClose={() => setSelectedTask(null)} />
				)}
			</AnimatePresence>
		</div>
	);
});
