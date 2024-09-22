// AutoScroll.jsx
import React, { useEffect, useRef, useState } from 'react';
import styles from './AutoScroll.module.css';

const AutoScroll = ({ children }) => {
    const containerRef = useRef(null);
    const [isUserScrolling, setIsUserScrolling] = useState(false);

    // Track scroll position
    const handleScroll = () => {
        const container = containerRef.current;
        if (!container) return;

        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
        setIsUserScrolling(!isAtBottom);
    };

    // Manage the scroll event listener
    useEffect(() => {
        const container = containerRef.current;

        if (container) {
            container.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    // Scroll to the bottom if not user scrolling
    useEffect(() => {
        if (containerRef.current && !isUserScrolling) {
            containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [children, isUserScrolling]);

    return (
        <div ref={containerRef} className={styles.container}>
            {children}
        </div>
    );
};

export default AutoScroll;
