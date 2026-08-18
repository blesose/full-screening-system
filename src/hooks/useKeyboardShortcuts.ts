import { useEffect, useCallback, useRef } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: (event: KeyboardEvent) => void;
  description?: string;
  preventDefault?: boolean;
}

export interface KeyboardShortcutOptions {
  /** Enable/disable all shortcuts */
  enabled?: boolean;
  /** Element to attach listeners to (default: window) */
  target?: EventTarget;
  /** Callback when a shortcut is triggered */
  onShortcut?: (shortcut: KeyboardShortcut) => void;
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: KeyboardShortcutOptions = {}
): void {
  const {
    enabled = true,
    target = typeof window !== 'undefined' ? window : undefined,
    onShortcut,
  } = options;

  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: Event) => {
      if (!enabled) return;

      const keyboardEvent = event as KeyboardEvent;

      // Don't trigger shortcuts if typing in input/textarea (except for specific keys)
      const target = keyboardEvent.target as HTMLElement;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
      const isContentEditable = target?.contentEditable === 'true';

      // Allow Ctrl+A in inputs for select all, but block other shortcuts
      if (isInput || isContentEditable) {
        // Only allow Ctrl+A in inputs
        if (!(keyboardEvent.ctrlKey && keyboardEvent.key === 'a')) {
          return;
        }
        // If it's Ctrl+A in input, prevent default to allow native select all
        return;
      }

      // Check each shortcut
      for (const shortcut of shortcutsRef.current) {
        const keyMatch = keyboardEvent.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? keyboardEvent.ctrlKey : !keyboardEvent.ctrlKey;
        const shiftMatch = shortcut.shift ? keyboardEvent.shiftKey : !keyboardEvent.shiftKey;
        const altMatch = shortcut.alt ? keyboardEvent.altKey : !keyboardEvent.altKey;
        const metaMatch = shortcut.meta ? keyboardEvent.metaKey : !keyboardEvent.metaKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          if (shortcut.preventDefault !== false) {
            keyboardEvent.preventDefault();
          }

          shortcut.action(keyboardEvent);
          onShortcut?.(shortcut);
          break;
        }
      }
    },
    [enabled, onShortcut]
  );

  useEffect(() => {
    if (!target) return;

    target.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [target, handleKeyDown]);
}

export function useShortcutDescriptions(
  shortcuts: KeyboardShortcut[]
): Array<{ key: string; description: string }> {
  return shortcuts
    .filter((s) => s.description)
    .map((s) => {
      const parts: string[] = [];
      if (s.ctrl) parts.push('Ctrl');
      if (s.shift) parts.push('Shift');
      if (s.alt) parts.push('Alt');
      if (s.meta) parts.push('Cmd');
      parts.push(s.key.toUpperCase());
      return {
        key: parts.join('+'),
        description: s.description!,
      };
    });
}

export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.meta) parts.push('Cmd');
  parts.push(shortcut.key.toUpperCase());
  return parts.join('+');
}