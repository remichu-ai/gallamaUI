import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles, Wrench } from 'lucide-react';
import useUIStore from '../../store/uiStore.js';
import {
    normalizeResponsesOutputItems,
    normalizeToolCallsToTraceItems,
} from '../../services/api/requestTransforms.js';
import { buildOrderedTraceEntries } from '../../services/assistantTraceOrdering.js';
import { formatToolPayloadValue } from '../../services/toolTraceFormatting.js';
import ToolPayloadText from './ToolPayloadText.jsx';
import { AnimatedReasoning, ReasoningSection } from './ReasoningSection.jsx';
import { ToolTraceSection } from './ToolTraceSection.jsx';
import styles from './AssistantTraceSection.module.css';

const ACTUAL_TOOL_TRACE_TYPES = new Set(['tool_call', 'tool_result', 'tool_activity']);
const DISPLAY_TRACE_TYPES = new Set(['reasoning', ...ACTUAL_TOOL_TRACE_TYPES]);

const toSingleLine = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const formatMeta = (...parts) => parts.filter(Boolean).join(' • ');

const formatReasoningMeta = (reasoning, isContentLoading) => {
    if (!reasoning && isContentLoading) {
        return 'Streaming';
    }

    const wordCount = toSingleLine(reasoning).split(' ').filter(Boolean).length;
    if (wordCount === 0) {
        return '';
    }

    return `${wordCount} word${wordCount === 1 ? '' : 's'}`;
};

const getPendingMcpServerLabel = (responseItems = []) => {
    const pendingMcpToolCall = responseItems.find(
        (item) => item?.type === 'mcp_call' && item?.status === 'in_progress',
    );

    if (pendingMcpToolCall?.server_label) {
        return pendingMcpToolCall.server_label;
    }

    const discoveredMcpServer = responseItems.find((item) => item?.type === 'mcp_list_tools');
    return discoveredMcpServer?.server_label ?? '';
};

const hasExplicitOpenState = (openTraceItems, entryId) => (
    Object.prototype.hasOwnProperty.call(openTraceItems, entryId)
);

const getTraceItemOpenState = (openTraceItems, entry) => (
    hasExplicitOpenState(openTraceItems, entry.id)
        ? openTraceItems[entry.id]
        : Boolean(entry.defaultOpen)
);

const mergeToolTraceItems = (traceItems = []) => {
    const mergedEntries = [];
    const entryIndexByCallId = new Map();

    traceItems.forEach((item, index) => {
        if (!ACTUAL_TOOL_TRACE_TYPES.has(item.type)) {
            return;
        }

        const baseEntry = {
            id: item.id ?? `${item.type}-${index}`,
            label: item.label ?? 'Tool activity',
            name: item.name ?? item.server_label ?? 'Tool',
            serverLabel: item.server_label ?? '',
            status: item.status ?? '',
            text: item.text ?? '',
            argumentsValue: item.argumentsValue ?? '',
            outputValue: item.outputValue ?? '',
            error: item.error ?? '',
            callId: item.call_id ?? null,
        };

        if (item.type === 'tool_call' && item.call_id) {
            entryIndexByCallId.set(item.call_id, mergedEntries.length);
            mergedEntries.push(baseEntry);
            return;
        }

        if (item.type === 'tool_result' && item.call_id && entryIndexByCallId.has(item.call_id)) {
            const existingIndex = entryIndexByCallId.get(item.call_id);
            const existingEntry = mergedEntries[existingIndex];

            mergedEntries[existingIndex] = {
                ...existingEntry,
                status: item.status ?? existingEntry.status,
                outputValue: item.outputValue ?? existingEntry.outputValue,
                error: item.error ?? existingEntry.error,
                text: item.text ?? existingEntry.text,
            };
            return;
        }

        mergedEntries.push(baseEntry);
    });

    return mergedEntries.map((entry) => ({
        ...entry,
        meta: formatMeta(entry.label, entry.serverLabel, entry.status),
    }));
};

const mergeDisplayTraceSources = (primaryTraceItems = [], secondaryTraceItems = []) => {
    const mergedItems = [];
    const seenIds = new Set();
    const seenReasoningTexts = new Set();
    const primaryTraceCount = primaryTraceItems.length;

    [...primaryTraceItems, ...secondaryTraceItems].forEach((item, index) => {
        if (!item || !DISPLAY_TRACE_TYPES.has(item?.type)) {
            return;
        }

        const normalizedReasoningText = item?.type === 'reasoning'
            ? toSingleLine(item.text ?? '')
            : '';

        // Prefer response-derived reasoning items over synthetic trace entries from the store.
        if (normalizedReasoningText) {
            const isSecondaryTraceItem = index >= primaryTraceCount;
            if (isSecondaryTraceItem && seenReasoningTexts.has(normalizedReasoningText)) {
                return;
            }
            seenReasoningTexts.add(normalizedReasoningText);
        }

        const itemId = item.id ?? `${item.type}-${index}`;
        if (seenIds.has(itemId)) {
            return;
        }

        seenIds.add(itemId);
        mergedItems.push(item);
    });

    return mergedItems;
};

const DetailBlock = ({ label, rawValue, value, tone = 'default', format }) => {
    if (!value) {
        return null;
    }

    return (
        <div className={styles.detailBlock}>
            <span className={styles.detailLabel}>{label}</span>
            <ToolPayloadText
                rawValue={rawValue}
                value={value}
                format={format}
                className={styles.detailValue}
                errorClassName={styles.detailValueError}
                tone={tone}
                lineClassName={styles.detailValueLine}
                keyClassName={styles.detailValueKey}
                prefixClassName={styles.detailValuePrefix}
            />
         </div>
    );
};

const DisclosureArrow = ({ isOpen }) => {
    const ArrowIcon = isOpen ? ChevronDown : ChevronRight;

    return (
        <span
            className={`${styles.disclosureArrow} ${isOpen ? styles.disclosureArrowVisible : ''}`}
            aria-hidden="true"
        >
            <ArrowIcon size={14} strokeWidth={2.2} />
        </span>
    );
};

const CollapsibleTraceItem = ({
    icon: Icon,
    iconClassName = '',
    summary,
    meta,
    isOpen = false,
    onToggle,
    bodyTitle = '',
    children,
}) => {
    return (
        <div className={styles.traceItem}>
            <button
                type="button"
                className={styles.traceToggle}
                onClick={onToggle}
                aria-expanded={isOpen}
            >
                <span className={`${styles.traceIconWrap} ${iconClassName}`}>
                    <Icon size={16} />
                </span>
                <span className={styles.traceToggleCopy}>
                    <span className={styles.traceToggleTitle}>{summary}</span>
                    {meta && <span className={styles.traceMeta}>{meta}</span>}
                    <DisclosureArrow isOpen={isOpen} />
                </span>
            </button>
            {isOpen && (
                <div className={styles.traceBody}>
                    <div className={styles.traceBodyLine} />
                    <div className={styles.traceBodyContent}>
                        {bodyTitle && <div className={styles.traceBodyTitle}>{bodyTitle}</div>}
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const AssistantTraceSection = ({
    reasoning,
    traceItems,
    responseItems,
    toolCalls,
    isContentLoading,
}) => {
    const { showReasoning, traceDisplayMode, toolPayloadFormat, isMobileViewport } = useUIStore();

    const normalizedResponseItems = useMemo(
        () => normalizeResponsesOutputItems(responseItems ?? []),
        [responseItems],
    );
    const responseTraceItems = useMemo(
        () => normalizedResponseItems.trace_items.filter((item) => DISPLAY_TRACE_TYPES.has(item.type)),
        [normalizedResponseItems],
    );
    const providedTraceItems = useMemo(
        () => (Array.isArray(traceItems) ? traceItems.filter((item) => DISPLAY_TRACE_TYPES.has(item?.type)) : []),
        [traceItems],
    );
    const mergedTraceItems = useMemo(
        () => mergeDisplayTraceSources(responseTraceItems, providedTraceItems),
        [providedTraceItems, responseTraceItems],
    );
    const fallbackToolTraceItems = useMemo(
        () => normalizeToolCallsToTraceItems(toolCalls ?? []),
        [toolCalls],
    );
    const orderedTraceEntries = useMemo(
        () => buildOrderedTraceEntries(mergedTraceItems),
        [mergedTraceItems],
    );
    const effectiveTraceItems = mergedTraceItems.length > 0 ? mergedTraceItems : fallbackToolTraceItems;
    const toolEntries = useMemo(
        () => mergeToolTraceItems(effectiveTraceItems),
        [effectiveTraceItems],
    );
    const pendingMcpServerLabel = useMemo(
        () => getPendingMcpServerLabel(responseItems ?? []),
        [responseItems],
    );
    const effectiveReasoning = reasoning || normalizedResponseItems.reasoning || '';
    const hasReasoning = Boolean(toSingleLine(effectiveReasoning));
    const [openTraceItems, setOpenTraceItems] = useState({});
    const visibleOrderedTraceEntries = useMemo(
        () => orderedTraceEntries.filter((entry) => showReasoning || entry.kind !== 'reasoning'),
        [orderedTraceEntries, showReasoning],
    );
    const hasVisibleToolEntry = visibleOrderedTraceEntries.some((entry) => entry.kind === 'tool');
    const isPreparingMcpCall = Boolean(pendingMcpServerLabel) && !hasVisibleToolEntry;
    const modernTraceEntries = useMemo(() => {
        if (visibleOrderedTraceEntries.length > 0) {
            return visibleOrderedTraceEntries.map((entry) => (
                entry.kind === 'reasoning'
                    ? {
                        id: entry.id,
                        kind: 'reasoning',
                        summary: 'Thinking',
                        meta: entry.meta,
                        text: entry.text,
                        defaultOpen: isMobileViewport,
                    }
                    : {
                        id: entry.id,
                        kind: 'tool',
                        summary: entry.traceType === 'tool_result'
                            ? `${entry.name} result`
                            : (entry.status === 'in_progress' ? `Running ${entry.name}` : entry.name),
                        meta: entry.meta,
                        text: entry.text,
                        argumentsValue: entry.argumentsValue,
                        outputValue: entry.outputValue,
                        error: entry.error,
                        bodyTitle: entry.text ? 'Activity' : '',
                        defaultOpen: Boolean(entry.error) || entry.status === 'in_progress',
                    }
            ));
        }

        const fallbackEntries = [];

        if (showReasoning && (hasReasoning || isContentLoading)) {
            fallbackEntries.push({
                id: 'fallback-reasoning',
                kind: 'reasoning',
                summary: isPreparingMcpCall
                    ? 'Preparing MCP call…'
                    : (isContentLoading && !hasReasoning ? 'Thinking…' : 'Show thinking'),
                meta: isPreparingMcpCall
                    ? formatMeta('MCP', pendingMcpServerLabel, 'Streaming')
                    : formatReasoningMeta(effectiveReasoning, isContentLoading),
                text: effectiveReasoning,
                defaultOpen: isMobileViewport || (isContentLoading && !effectiveReasoning),
                isLoading: !hasReasoning,
            });
        }

        toolEntries.forEach((entry) => {
            fallbackEntries.push({
                id: entry.id,
                kind: 'tool',
                summary: entry.name,
                meta: entry.meta,
                text: entry.text,
                argumentsValue: entry.argumentsValue,
                outputValue: entry.outputValue,
                error: entry.error,
                bodyTitle: entry.text ? 'Activity' : '',
                defaultOpen: Boolean(entry.error),
            });
        });

        return fallbackEntries;
    }, [
        effectiveReasoning,
        hasReasoning,
        isContentLoading,
        isMobileViewport,
        isPreparingMcpCall,
        pendingMcpServerLabel,
        showReasoning,
        toolEntries,
        visibleOrderedTraceEntries,
    ]);
    const showTraceStackToggle = modernTraceEntries.length > 1;
    const areAllTraceItemsOpen = modernTraceEntries.length > 0
        && modernTraceEntries.every((entry) => getTraceItemOpenState(openTraceItems, entry));

    const toggleTraceItem = (entry) => {
        setOpenTraceItems((current) => {
            const currentValue = getTraceItemOpenState(current, entry);
            return {
                ...current,
                [entry.id]: !currentValue,
            };
        });
    };

    const toggleAllTraceItems = () => {
        const nextOpenState = !areAllTraceItemsOpen;

        setOpenTraceItems(
            modernTraceEntries.reduce((nextState, entry) => ({
                ...nextState,
                [entry.id]: nextOpenState,
            }), {}),
        );
    };

    if (traceDisplayMode === 'retro') {
        return (
            <>
                <ReasoningSection reasoning={effectiveReasoning} isContentLoading={isContentLoading} />
                <ToolTraceSection responseItems={responseItems} toolCalls={toolCalls} />
            </>
        );
    }

    if (modernTraceEntries.length > 0) {
        return (
            <div className={styles.traceStack}>
                {showTraceStackToggle && (
                    <div className={styles.traceStackHeader}>
                        <button
                            type="button"
                            className={styles.traceStackButton}
                            onClick={toggleAllTraceItems}
                            aria-label={`${areAllTraceItemsOpen ? 'Collapse' : 'Expand'} all thinking and tool blocks`}
                        >
                            <span>{areAllTraceItemsOpen ? 'Collapse all' : 'Expand all'}</span>
                            <DisclosureArrow isOpen={areAllTraceItemsOpen} />
                        </button>
                    </div>
                )}
                {modernTraceEntries.map((entry) => (
                    entry.kind === 'reasoning' ? (
                        <CollapsibleTraceItem
                            key={entry.id}
                            icon={Sparkles}
                            iconClassName={styles.traceIconThinking}
                            summary={entry.summary}
                            meta={entry.meta}
                            isOpen={getTraceItemOpenState(openTraceItems, entry)}
                            onToggle={() => toggleTraceItem(entry)}
                        >
                            {entry.isLoading ? (
                                <div className={styles.loadingText}>
                                    <AnimatedReasoning isContentLoading={isContentLoading} />
                                </div>
                            ) : (
                                <div className={styles.reasoningText}>{entry.text}</div>
                            )}
                        </CollapsibleTraceItem>
                    ) : (
                        <CollapsibleTraceItem
                            key={entry.id}
                            icon={Wrench}
                            iconClassName={styles.traceIconTool}
                            summary={entry.summary}
                            meta={entry.meta}
                            isOpen={getTraceItemOpenState(openTraceItems, entry)}
                            onToggle={() => toggleTraceItem(entry)}
                            bodyTitle={entry.bodyTitle}
                        >
                            {entry.text && <div className={styles.toolText}>{entry.text}</div>}
                            <DetailBlock
                                label="Arguments"
                                rawValue={entry.argumentsValue}
                                value={formatToolPayloadValue(entry.argumentsValue, toolPayloadFormat)}
                                format={toolPayloadFormat}
                            />
                            <DetailBlock
                                label="Result"
                                rawValue={entry.outputValue}
                                value={formatToolPayloadValue(entry.outputValue, toolPayloadFormat)}
                                format={toolPayloadFormat}
                            />
                            <DetailBlock
                                label="Error"
                                rawValue={entry.error}
                                value={entry.error}
                                tone="error"
                                format={toolPayloadFormat}
                            />
                        </CollapsibleTraceItem>
                    )
                ))}
            </div>
        );
    }

    return null;
};

export default AssistantTraceSection;
