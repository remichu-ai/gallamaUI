import React from 'react';
import {
    isStructuredToolPayloadValue,
    TOOL_PAYLOAD_FORMAT_YAML,
} from '../../services/toolTraceFormatting.js';

const YAML_KEY_LINE_PATTERN = /^(\s*(?:-\s+)?)?([^:\n][^:\n]*?):(?:\s(.*))?$/;

const renderYamlLine = ({
    line,
    index,
    lineClassName,
    keyClassName,
    prefixClassName,
}) => {
    const match = line.match(YAML_KEY_LINE_PATTERN);

    if (!match) {
        return (
            <span key={index} className={lineClassName}>
                {line || '\u200b'}
            </span>
        );
    }

    const [, prefix = '', key = '', value = ''] = match;

    return (
        <span key={index} className={lineClassName}>
            {prefix && <span className={prefixClassName}>{prefix}</span>}
            <span className={keyClassName}>{key}</span>
            :
            {value ? ` ${value}` : ''}
        </span>
    );
};

const ToolPayloadText = ({
    rawValue,
    value,
    format,
    className,
    errorClassName = '',
    tone = 'default',
    lineClassName,
    keyClassName,
    prefixClassName,
}) => {
    const shouldHighlightYamlKeys = (
        format === TOOL_PAYLOAD_FORMAT_YAML
        && isStructuredToolPayloadValue(rawValue)
    );

    return (
        <pre className={`${className} ${tone === 'error' ? errorClassName : ''}`}>
            {shouldHighlightYamlKeys
                ? String(value)
                    .split('\n')
                    .map((line, index) => renderYamlLine({
                        line,
                        index,
                        lineClassName,
                        keyClassName,
                        prefixClassName,
                    }))
                : value}
        </pre>
    );
};

export default ToolPayloadText;
