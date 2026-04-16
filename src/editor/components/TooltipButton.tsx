import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
import clsx from 'clsx';
import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type FocusEvent, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';

interface TooltipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip?: string;
}

interface TooltipPosition {
  left: number;
  top: number;
}

const INITIAL_POSITION: TooltipPosition = {
  left: 0,
  top: 0,
};

export function TooltipButton({
  tooltip,
  className,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  disabled,
  children,
  ...props
}: TooltipButtonProps) {
  const tooltipId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(INITIAL_POSITION);
  const [isPositioned, setIsPositioned] = useState(false);

  useEffect(() => {
    if (!open || !buttonRef.current || !tooltipRef.current) {
      return;
    }

    setIsPositioned(false);

    return autoUpdate(buttonRef.current, tooltipRef.current, () => {
      if (!buttonRef.current || !tooltipRef.current) {
        return;
      }

      void computePosition(buttonRef.current, tooltipRef.current, {
        placement: 'bottom',
        middleware: [offset(10), flip({ fallbackPlacements: ['top'] }), shift({ padding: 10 })],
      }).then(({ x, y }) => {
        setPosition({ left: x, top: y });
        setIsPositioned(true);
      });
    });
  }, [open]);

  function handleMouseEnter(event: MouseEvent<HTMLButtonElement>) {
    if (!tooltip || disabled) {
      onMouseEnter?.(event);
      return;
    }

    onMouseEnter?.(event);
    setOpen(true);
  }

  function handleMouseLeave(event: MouseEvent<HTMLButtonElement>) {
    onMouseLeave?.(event);
    setOpen(false);
  }

  function handleFocus(event: FocusEvent<HTMLButtonElement>) {
    if (!tooltip || disabled) {
      onFocus?.(event);
      return;
    }

    onFocus?.(event);
    setOpen(true);
  }

  function handleBlur(event: FocusEvent<HTMLButtonElement>) {
    onBlur?.(event);
    setOpen(false);
  }

  return (
    <>
      <button
        {...props}
        ref={buttonRef}
        type={props.type ?? 'button'}
        className={clsx(className, tooltip && 'has-tooltip')}
        aria-describedby={open && tooltip ? tooltipId : undefined}
        data-tooltip={tooltip}
        disabled={disabled}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
      </button>
      {open && tooltip && typeof document !== 'undefined'
        ? createPortal(
            <div
              id={tooltipId}
              ref={tooltipRef}
              role="tooltip"
              className="floating-tooltip"
              style={{
                left: `${position.left}px`,
                top: `${position.top}px`,
                opacity: isPositioned ? 1 : 0,
              }}
            >
              {tooltip}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
