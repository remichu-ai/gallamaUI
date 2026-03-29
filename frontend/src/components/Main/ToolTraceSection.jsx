import React, { useMemo, useState } from 'react';
import {
    normalizeResponsesOutputItems,
    normalizeToolCallsToTraceItems,
} from '../../services/api/requestTransforms.js';
import { formatToolPayloadValue } from '../../services/toolTraceFormatting.js';
import ToolPayloadText from './ToolPayloadText.jsx';
import useUIStore from '../../store/uiStore.js';
import styles from './ToolTraceSection.module.css';

const ACTUAL_TOOL_TRACE_TYPES = new Set(['tool_call', 'tool_result', 'tool_activity']);

const TraceDetail = ({ label, rawValue, value, tone = 'default', format }) => {
    if (!value) {
        return null;
    }

    return (
        <div className={styles.detailGroup}>
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

const ToolTraceSection = ({ responseItems, toolCalls }) => {
    const { toolPayloadFormat } = useUIStore();
    const responseTraceItems = useMemo(
        () => normalizeResponsesOutputItems(responseItems ?? []).trace_items
            .filter((item) => ACTUAL_TOOL_TRACE_TYPES.has(item.type)),
        [responseItems],
    );
    const fallbackToolTraceItems = useMemo(
        () => normalizeToolCallsToTraceItems(toolCalls ?? []),
        [toolCalls],
    );
    const displayTraceItems = useMemo(
        () => (responseTraceItems.length > 0 ? responseTraceItems : fallbackToolTraceItems),
        [responseTraceItems, fallbackToolTraceItems],
    );
    const [isVisible, setIsVisible] = useState(true);

    if (!displayTraceItems.some((item) => ACTUAL_TOOL_TRACE_TYPES.has(item.type))) {
        return null;
    }

    return (
        <div className={styles.traceSection}>
            <div className={styles.header}>
                <span className={styles.headerTitle}>Tool Activity</span>
                <button
                    className={styles.toggleButton}
                    onClick={() => setIsVisible((visible) => !visible)}
                >
                    {isVisible ? 'Hide' : 'Show'}
                </button>
            </div>
            {isVisible && (
                <div className={styles.traceList}>
                    {displayTraceItems.map((item, index) => (
                        <div className={styles.traceItem} key={item.id ?? `${item.type}-${index}`}>
                            <div className={styles.traceTopRow}>
                                <span className={styles.traceBadge}>{item.label}</span>
                                {item.status && <span className={styles.traceStatus}>{item.status}</span>}
                            </div>
                            {(item.name || item.server_label) && (
                                <div className={styles.traceHeading}>
                                    <span className={styles.traceName}>{item.name ?? item.server_label}</span>
                                    {item.server_label && item.name && (
                                        <span className={styles.traceServer}>{item.server_label}</span>
                                    )}
                                </div>
                            )}
                            {item.text && <div className={styles.traceText}>{item.text}</div>}
                            <TraceDetail
                                label="Arguments"
                                rawValue={item.argumentsValue}
                                value={formatToolPayloadValue(item.argumentsValue, toolPayloadFormat)}
                                format={toolPayloadFormat}
                            />
                            <TraceDetail
                                label="Result"
                                rawValue={item.outputValue}
                                value={formatToolPayloadValue(item.outputValue, toolPayloadFormat)}
                                format={toolPayloadFormat}
                            />
                            <TraceDetail
                                label="Error"
                                rawValue={item.error}
                                value={item.error}
                                tone="error"
                                format={toolPayloadFormat}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export { ToolTraceSection };
