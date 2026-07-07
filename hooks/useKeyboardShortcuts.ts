import { useEffect, useCallback } from 'react';
import { AppView } from '../types';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const matchingShortcut = shortcuts.find(shortcut => {
        const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey === event.ctrlKey;
        const shiftMatch = shortcut.shiftKey === event.shiftKey;
        const altMatch = shortcut.altKey === event.altKey;
        const metaMatch = shortcut.metaKey === event.metaKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch;
      });

      if (matchingShortcut) {
        // Don't trigger if typing in input/textarea
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }

        event.preventDefault();
        matchingShortcut.action();
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);
};

// Common shortcuts for Rat Lab
export const createAppShortcuts = (
  onChangeView: (view: AppView) => void,
  onSave?: () => void,
  onNew?: () => void
): KeyboardShortcut[] => {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: '1',
      ctrlKey: true,
      action: () => onChangeView(AppView.DASHBOARD),
      description: 'Go to Dashboard'
    },
    {
      key: '2',
      ctrlKey: true,
      action: () => onChangeView(AppView.PERSONA_BUILDER),
      description: 'Go to Cohorts'
    },
    {
      key: '3',
      ctrlKey: true,
      action: () => onChangeView(AppView.SOCIETIES),
      description: 'Go to Sample Population'
    },
    {
      key: '4',
      ctrlKey: true,
      action: () => onChangeView(AppView.EXPERIMENT_LAB),
      description: 'Go to Simulations'
    },
    {
      key: '5',
      ctrlKey: true,
      action: () => onChangeView(AppView.ANALYSIS),
      description: 'Go to Analysis'
    },
    {
      key: '6',
      ctrlKey: true,
      action: () => onChangeView(AppView.ASSETS),
      description: 'Go to Assets'
    },
    {
      key: '7',
      ctrlKey: true,
      action: () => onChangeView(AppView.API_PLAYGROUND),
      description: 'Go to API Playground'
    }
  ];

  if (onSave) {
    shortcuts.push({
      key: 's',
      ctrlKey: true,
      action: onSave,
      description: 'Save'
    });
  }

  if (onNew) {
    shortcuts.push({
      key: 'n',
      ctrlKey: true,
      action: onNew,
      description: 'New'
    });
  }

  shortcuts.push({
    key: '/',
    ctrlKey: true,
    action: () => {
      // Open command palette (to be implemented)
      console.log('Command palette');
    },
    description: 'Open command palette'
  });

  shortcuts.push({
    key: '?',
    action: () => {
      // Show shortcuts modal (to be implemented)
      console.log('Show shortcuts');
    },
    description: 'Show keyboard shortcuts'
  });

  return shortcuts;
};

