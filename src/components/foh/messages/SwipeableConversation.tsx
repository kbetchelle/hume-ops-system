import { useState, useRef, useEffect } from 'react';
import { Archive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Conversation } from '@/types/messaging';

interface SwipeableConversationProps {
  conversation: Conversation;
  children: React.ReactNode;
  onArchive: (conversationKey: string) => void;
  isSelected: boolean;
}

export function SwipeableConversation({
  conversation,
  children,
  onArchive,
  isSelected,
}: SwipeableConversationProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isArchiving, setIsArchiving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 80; // Minimum swipe distance to trigger archive
  const maxSwipeDistance = 150; // Maximum visual swipe distance

  useEffect(() => {
    // Reset swipe when conversation changes
    setSwipeOffset(0);
    setIsArchiving(false);
  }, [conversation.key]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;

    // Only allow swipe to the left (diff > 0)
    if (diff > 0) {
      // Cap the swipe offset at maxSwipeDistance
      const offset = Math.min(diff, maxSwipeDistance);
      setSwipeOffset(offset);
      setTouchEnd(currentTouch);
    } else {
      setSwipeOffset(0);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setSwipeOffset(0);
      return;
    }

    const distance = touchStart - touchEnd;
    
    if (distance >= minSwipeDistance) {
      // Trigger archive
      setIsArchiving(true);
      setTimeout(() => {
        onArchive(conversation.key);
        setSwipeOffset(0);
        setIsArchiving(false);
      }, 300);
    } else {
      // Reset swipe
      setSwipeOffset(0);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Calculate background color opacity based on swipe progress
  const archiveOpacity = Math.min(swipeOffset / minSwipeDistance, 1);
  const showArchiveIcon = swipeOffset > 20;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Archive background */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-6 bg-destructive transition-opacity"
        style={{
          opacity: archiveOpacity,
        }}
      >
        {showArchiveIcon && (
          <div className="flex items-center gap-2 text-white">
            <Archive className="h-5 w-5" />
            {swipeOffset >= minSwipeDistance && (
              <span className="text-sm font-medium">Release to archive</span>
            )}
          </div>
        )}
      </div>

      {/* Swipeable content */}
      <div
        className={`relative bg-background transition-transform ${
          isArchiving ? 'opacity-50' : ''
        }`}
        style={{
          transform: `translateX(-${swipeOffset}px)`,
          transition: touchStart ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
