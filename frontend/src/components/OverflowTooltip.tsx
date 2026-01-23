import { useCallback, useEffect, useRef, useState } from "react";

import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";

import type { ReactNode } from "react";

interface OverflowTooltipProps {
    children: ReactNode;
    title: string;
}

const OverflowTooltip = ({ children, title }: OverflowTooltipProps) => {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const checkOverflow = useCallback(() => {
        if (wrapperRef.current) {
            // Find any element with text-overflow: ellipsis or noWrap
            const textElements = wrapperRef.current.querySelectorAll<HTMLElement>("*");
            let hasOverflow = false;

            textElements.forEach((el) => {
                if (el.scrollWidth > el.clientWidth) {
                    hasOverflow = true;
                }
            });

            // Also check the wrapper itself
            if (wrapperRef.current.scrollWidth > wrapperRef.current.clientWidth) {
                hasOverflow = true;
            }

            setIsOverflowing(hasOverflow);
        }
    }, []);

    useEffect(() => {
        checkOverflow();
        window.addEventListener("resize", checkOverflow);
        return () => window.removeEventListener("resize", checkOverflow);
    }, [title, checkOverflow]);

    const handleTooltipClick = useCallback((e: React.MouseEvent) => {
        // Prevent click on tooltip from triggering parent actions
        e.stopPropagation();
        e.preventDefault();
    }, []);

    const handleTooltipMouseDown = useCallback((e: React.MouseEvent) => {
        // Prevent mousedown from triggering button ripple effect
        e.stopPropagation();
    }, []);

    return (
        <Tooltip
            enterDelay={1000}
            enterNextDelay={1000}
            placement="bottom-start"
            title={isOverflowing ? title : ""}
            slotProps={{
                popper: {
                    sx: { pointerEvents: "auto" },
                },
                tooltip: {
                    onClick: handleTooltipClick,
                    onMouseDown: handleTooltipMouseDown,
                    sx: { userSelect: "text", cursor: "text", pointerEvents: "auto" },
                },
            }}
        >
            <Box ref={wrapperRef} sx={{ flexGrow: 1, minWidth: 0, overflow: "hidden" }}>
                {children}
            </Box>
        </Tooltip>
    );
};

export default OverflowTooltip;
