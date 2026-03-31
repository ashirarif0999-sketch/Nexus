import React, { useState, useEffect } from 'react';

interface LazyEmojiPickerProps {
  onEmojiClick: (emoji: { emoji: string }) => void;
}

// Lazy load the emoji picker - only loads when this component mounts
const EmojiPickerWrapper: React.FC<LazyEmojiPickerProps> = ({ onEmojiClick }) => {
  const [EmojiPicker, setEmojiPicker] = useState<React.FC<{ onEmojiClick: (emoji: { emoji: string }) => void }> | null>(null);

  useEffect(() => {
    // Dynamically import emoji-picker-react
    import('emoji-picker-react').then((module) => {
      setEmojiPicker(() => module.default);
    });
  }, []);

  if (!EmojiPicker) {
    return (
      <div className="flex items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <EmojiPicker
      onEmojiClick={onEmojiClick}
    />
  );
};

// Loading fallback component
const EmojiPickerLoader: React.FC = () => (
  <div className="flex items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-lg">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

export type { LazyEmojiPickerProps };
export { EmojiPickerWrapper, EmojiPickerLoader };
