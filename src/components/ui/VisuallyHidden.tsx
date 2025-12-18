import React from 'react';

interface VisuallyHiddenProps {
    children: React.ReactNode;
    /** HTML element to render. Defaults to 'span' */
    as?: 'span' | 'div' | 'p' | 'label';
}

/**
 * VisuallyHidden component - Hides content visually but keeps it accessible to screen readers.
 * Use this for providing additional context to assistive technologies without affecting visual design.
 *
 * @example
 * <VisuallyHidden>This text is only visible to screen readers</VisuallyHidden>
 *
 * <button>
 *   <Icon />
 *   <VisuallyHidden>Delete item</VisuallyHidden>
 * </button>
 */
export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({
    children,
    as = 'span'
}) => {
    const Component = as;
    return (
        <Component
            className="sr-only"
            style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
            }}
        >
            {children}
        </Component>
    );
};
