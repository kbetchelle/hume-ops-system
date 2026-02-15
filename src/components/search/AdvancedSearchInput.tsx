import { useState, useRef, useEffect } from "react";
import { Search, X, Clock, Tag, FolderOpen, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { parseSearchQuery, hasFilters, getFilterSummary } from "@/lib/searchFilterParser";
import type { SearchSuggestion } from "@/hooks/useSearchAutocomplete";
import { cn } from "@/lib/utils";

export interface AdvancedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  showHistory?: boolean;
  className?: string;
  focusTrigger?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function AdvancedSearchInput({
  value,
  onChange,
  placeholder = "Search pages...",
  suggestions = [],
  showHistory = true,
  className,
  focusTrigger,
  onFocus,
  onBlur,
}: AdvancedSearchInputProps) {
  const [open, setOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const parsed = parseSearchQuery(value);
  const activeFilters = hasFilters(parsed);

  // Handle programmatic focus trigger
  useEffect(() => {
    if (focusTrigger && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [focusTrigger]);

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const handleSuggestionSelect = (suggestionValue: string) => {
    // If it's a pattern (ends with :), just insert it and let user continue typing
    if (suggestionValue.endsWith(':')) {
      onChange(suggestionValue);
      setOpen(false);
      inputRef.current?.focus();
      return;
    }

    // For other suggestions, add to existing query
    const currentParsed = parseSearchQuery(value);
    
    // If suggestion is a filter (tag: or folder:), append it
    if (suggestionValue.startsWith('tag:') || suggestionValue.startsWith('folder:')) {
      const parts = [currentParsed.plainText, suggestionValue].filter(Boolean);
      onChange(parts.join(' '));
    } else {
      // For history items, replace entire query
      onChange(suggestionValue);
    }
    
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    setInputFocused(true);
    setOpen(true);
    onFocus?.();
  };

  const handleInputBlur = () => {
    setInputFocused(false);
    
    // Clear any existing timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    
    // Delay to allow click on suggestions
    blurTimeoutRef.current = setTimeout(() => {
      setOpen(false);
      onBlur?.();
      blurTimeoutRef.current = null;
    }, 200);
  };

  // Group suggestions by type
  const historySuggestions = suggestions.filter(s => s.type === 'history');
  const tagSuggestions = suggestions.filter(s => s.type === 'tag');
  const folderSuggestions = suggestions.filter(s => s.type === 'folder');
  const patternSuggestions = suggestions.filter(s => s.type === 'pattern');

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'history':
        return <Clock className="h-3.5 w-3.5" />;
      case 'tag':
        return <Tag className="h-3.5 w-3.5" />;
      case 'folder':
        return <FolderOpen className="h-3.5 w-3.5" />;
      case 'pattern':
        return <ChevronRight className="h-3.5 w-3.5" />;
      default:
        return <Search className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={placeholder}
              className={cn(
                "pl-10 rounded-none",
                value && "pr-10"
              )}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleClear();
                  e.preventDefault();
                }
              }}
            />
            {value && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-none"
                onClick={handleClear}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </PopoverTrigger>
        
        <PopoverContent
          className="w-[400px] p-0 rounded-none"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandList>
              <CommandEmpty>No suggestions</CommandEmpty>
              
              {showHistory && historySuggestions.length > 0 && (
                <CommandGroup heading="Recent Searches">
                  {historySuggestions.map((suggestion, idx) => (
                    <CommandItem
                      key={`history-${idx}`}
                      value={suggestion.value}
                      onSelect={() => handleSuggestionSelect(suggestion.value)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        {getSuggestionIcon(suggestion.type)}
                        <span className="flex-1">{suggestion.label}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {tagSuggestions.length > 0 && (
                <CommandGroup heading="Tags">
                  {tagSuggestions.map((suggestion, idx) => (
                    <CommandItem
                      key={`tag-${idx}`}
                      value={suggestion.value}
                      onSelect={() => handleSuggestionSelect(suggestion.value)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        {getSuggestionIcon(suggestion.type)}
                        <span className="flex-1">{suggestion.label}</span>
                        {suggestion.description && (
                          <span className="text-xs text-muted-foreground">
                            {suggestion.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {folderSuggestions.length > 0 && (
                <CommandGroup heading="Folders">
                  {folderSuggestions.map((suggestion, idx) => (
                    <CommandItem
                      key={`folder-${idx}`}
                      value={suggestion.value}
                      onSelect={() => handleSuggestionSelect(suggestion.value)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        {getSuggestionIcon(suggestion.type)}
                        <span className="flex-1">{suggestion.label}</span>
                        {suggestion.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {suggestion.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {patternSuggestions.length > 0 && (
                <CommandGroup heading="Search Patterns">
                  {patternSuggestions.map((suggestion, idx) => (
                    <CommandItem
                      key={`pattern-${idx}`}
                      value={suggestion.value}
                      onSelect={() => handleSuggestionSelect(suggestion.value)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        {getSuggestionIcon(suggestion.type)}
                        <span className="flex-1 font-mono text-xs">{suggestion.label}</span>
                        {suggestion.description && (
                          <span className="text-xs text-muted-foreground">
                            {suggestion.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {activeFilters && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{getFilterSummary(parsed)}</span>
          {parsed.filters.tags.map((tag, idx) => (
            <Badge key={`tag-${idx}`} variant="secondary" className="rounded-none text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
          {parsed.filters.folders.map((folder, idx) => (
            <Badge key={`folder-${idx}`} variant="secondary" className="rounded-none text-xs">
              <FolderOpen className="h-3 w-3 mr-1" />
              {folder}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
