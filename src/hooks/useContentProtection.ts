import { useEffect, useState } from 'react';

const COPYRIGHT_CLIPBOARD_NOTICE =
  '© InfinityStore Chisopani — Unauthorized copying is prohibited.';

interface ContentProtectionOptions {
  enableDevToolsDetection?: boolean;
  devToolsThresholdPx?: number;
}

interface ContentProtectionState {
  isDevToolsOpen: boolean;
}

/**
 * Checks whether an element (or its ancestor) is explicitly allowed to support text selection / copy:
 * - Form controls: <input>, <textarea>, <select>, [contenteditable="true"]
 * - Explicitly tagged selectable elements: .select-text or [data-selectable="true"] (e.g., Order Tracking IDs)
 */
function isSelectableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    const active = typeof document !== 'undefined' ? document.activeElement : null;
    if (active instanceof HTMLElement) {
      return isSelectableElement(active);
    }
    return false;
  }

  const tag = target.tagName.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }

  if (target.isContentEditable) {
    return true;
  }

  if (
    target.closest(
      'input, textarea, select, [contenteditable="true"], .select-text, [data-selectable="true"]'
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Global anti-copy, anti-scrape, inspection shortcut deterrent, and production DevTools detection hook.
 */
export function useContentProtection(
  options: ContentProtectionOptions = {}
): ContentProtectionState {
  const { enableDevToolsDetection = true, devToolsThresholdPx = 160 } = options;
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // 1. Block right-click context menu globally (except inside editable form inputs if needed for spellcheck/paste)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 2. Block text selection outside inputs and selectable order confirmation IDs
    const handleSelectStart = (e: Event) => {
      if (isSelectableElement(e.target)) {
        return;
      }
      e.preventDefault();
    };

    // 3. Block drag-and-drop on images and storefront elements
    const handleDragStart = (e: DragEvent) => {
      if (isSelectableElement(e.target)) {
        return;
      }
      e.preventDefault();
    };

    // 4. Intercept DevTools, View Source, Save, and Print keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      const hasCtrlOrCmd = e.ctrlKey || e.metaKey;

      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+P / Cmd+P (Print)
      if (hasCtrlOrCmd && key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+S / Cmd+S (Save page)
      if (hasCtrlOrCmd && key === 's') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U / Cmd+U (View source) or Cmd+Option+U
      if (hasCtrlOrCmd && key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I / J / C or Cmd+Shift+I / J / C
      if (hasCtrlOrCmd && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Cmd+Option+I / J / C / U (macOS DevTools shortcuts)
      if (e.metaKey && e.altKey && (key === 'i' || key === 'j' || key === 'c' || key === 'u')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 5. Override clipboard copy outside of form inputs and selectable order tracking IDs
    const handleCopy = (e: ClipboardEvent) => {
      if (isSelectableElement(e.target) || isSelectableElement(document.activeElement)) {
        return;
      }

      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', COPYRIGHT_CLIPBOARD_NOTICE);
      }
    };

    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('selectstart', handleSelectStart, true);
    document.addEventListener('dragstart', handleDragStart, true);
    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('copy', handleCopy, true);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
      document.removeEventListener('dragstart', handleDragStart, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('copy', handleCopy, true);
    };
  }, []);

  // 6. Lightweight DevTools detection (Production mode ONLY)
  useEffect(() => {
    if (!enableDevToolsDetection || !import.meta.env.PROD || typeof window === 'undefined') {
      return;
    }

    const checkWindowThreshold = (): boolean => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      return widthDiff > devToolsThresholdPx || heightDiff > devToolsThresholdPx;
    };

    const evaluateDevTools = () => {
      let detected = checkWindowThreshold();

      // Lightweight timing-based debugger trap in production only
      if (!detected) {
        const start = performance.now();
        try {
          // eslint-disable-next-line no-new-func
          new Function('debugger')();
        } catch {
          // Ignore CSP restrictions if strict eval disabled
        }
        const elapsed = performance.now() - start;
        if (elapsed > 120) {
          detected = true;
        }
      }

      setIsDevToolsOpen(detected);
    };

    evaluateDevTools();
    window.addEventListener('resize', evaluateDevTools);
    const intervalId = window.setInterval(evaluateDevTools, 2500);

    return () => {
      window.removeEventListener('resize', evaluateDevTools);
      window.clearInterval(intervalId);
    };
  }, [enableDevToolsDetection, devToolsThresholdPx]);

  return { isDevToolsOpen };
}

export default useContentProtection;
