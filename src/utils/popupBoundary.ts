/**
 * Simplified utility for detecting boundary overflow and repositioning popup elements.
 * Uses getBoundingClientRect() for accurate overflow detection.
 */

export interface Position {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
}

/**
 * Detects if an element would overflow the viewport and returns the optimal position.
 * Simpler and more reliable approach using viewport bounds.
 */
export function getPopupPosition(
  popupElement: HTMLElement,
  triggerElement: HTMLElement,
  preferredPosition: 'left' | 'right' = 'right'
): Position {
  const popupRect = popupElement.getBoundingClientRect();
  const triggerRect = triggerElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 8;

  // Calculate the horizontal position relative to trigger
  let position: Position = {};
  
  if (preferredPosition === 'right') {
    // Calculate right position (distance from trigger's right edge)
    const rightPos = triggerRect.right + padding;
    
    // Check if it would overflow right edge
    if (rightPos + popupRect.width > viewportWidth - padding) {
      // Flip to left
      const leftPos = triggerRect.left - popupRect.width - padding;
      if (leftPos >= padding) {
        position.left = `-${popupRect.width}px`;
      } else {
        // Can't fit on either side, center it
        position.left = '0px';
        position.right = '0px';
      }
    } else {
      position.right = `-${triggerRect.width}px`;
    }
  } else {
    // Calculate left position (distance from trigger's left edge)
    const leftPos = triggerRect.left - popupRect.width - padding;
    
    // Check if it would overflow left edge
    if (leftPos < padding) {
      // Flip to right
      const rightPos = viewportWidth - triggerRect.right - popupRect.width - padding;
      if (rightPos >= padding) {
        position.right = `-${popupRect.width}px`;
      } else {
        // Can't fit on either side, center it
        position.left = '0px';
        position.right = '0px';
      }
    } else {
      position.left = `-${popupRect.width}px`;
    }
  }

  return position;
}

/**
 * Get context menu position that stays within viewport bounds.
 */
export function getContextMenuPosition(
  menuWidth: number,
  menuHeight: number,
  mouseX: number,
  mouseY: number
): Position {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 8;
  
  let left = mouseX;
  let top = mouseY;
  
  // Check right overflow
  if (left + menuWidth > viewportWidth - padding) {
    left = viewportWidth - menuWidth - padding;
  }
  
  // Check left overflow
  if (left < padding) {
    left = padding;
  }
  
  // Check bottom overflow
  if (top + menuHeight > viewportHeight - padding) {
    top = viewportHeight - menuHeight - padding;
  }
  
  // Check top overflow
  if (top < padding) {
    top = padding;
  }
  
  return {
    left: `${left}px`,
    top: `${top}px`
  };
}