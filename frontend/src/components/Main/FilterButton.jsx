import React from 'react';
import { useChatStore } from '../../store/chatStore.js';

const FilterButton = ({ id, label }) => {
    const setSelectedId = useChatStore((state) => state.setSelectedId);

    return (
        <button onClick={() => setSelectedId(id)}>
            {label}
        </button>
    );
};

export default FilterButton;
