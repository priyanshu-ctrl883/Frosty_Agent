"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  type ReactNode,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, X, Search } from "lucide-react";
import styles from "./Dropdown.module.css";

export type DropdownOption<T = string | number> = {
  value: T;
  label: ReactNode;
  description?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
  group?: string;
  color?: string;
};

export type DropdownSize = "sm" | "md" | "lg";
export type DropdownVariant = "default" | "subtle" | "ghost";

export type DropdownProps<T extends string | number = string> = {
  value?: T | null;
  onChange?: (value: T) => void;
  options?: (DropdownOption<T> | string | number)[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  style?: CSSProperties;
  size?: DropdownSize;
  variant?: DropdownVariant;
  searchable?: boolean;
  searchPlaceholder?: string;
  clearable?: boolean;
  onClear?: () => void;
  leadingIcon?: ReactNode;
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string | boolean;
  portal?: boolean;
  name?: string;
  id?: string;
  autoFocus?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
  renderOption?: (option: DropdownOption<T>, isSelected: boolean) => ReactNode;
  renderTrigger?: (selectedOption: DropdownOption<T> | undefined, isOpen: boolean) => ReactNode;
};

export function Dropdown<T extends string | number = string>({
  value,
  onChange,
  options = [],
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  triggerClassName = "",
  dropdownClassName = "",
  style,
  size = "md",
  variant = "default",
  searchable = false,
  searchPlaceholder = "Search...",
  clearable = false,
  onClear,
  leadingIcon,
  label,
  required = false,
  helperText,
  error,
  portal = true,
  name,
  id,
  fullWidth = true,
  children,
  renderOption,
  renderTrigger,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [dropdownPosition, setDropdownPosition] = useState<CSSProperties>({});
  const [isPlacementTop, setIsPlacementTop] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLUListElement>(null);

  // Normalize options array + children support
  const normalizedOptions = useMemo<DropdownOption<T>[]>(() => {
    let result: DropdownOption<T>[] = [];

    if (Array.isArray(options) && options.length > 0) {
      result = options.map((opt) => {
        if (typeof opt === "string" || typeof opt === "number") {
          return {
            value: opt as unknown as T,
            label: String(opt),
          };
        }
        return opt as DropdownOption<T>;
      });
    } else if (children) {
      // Parse <option> tags if passed as children
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.props) {
          const props = child.props as any;
          result.push({
            value: (props.value ?? props.children) as unknown as T,
            label: props.children || String(props.value),
            disabled: Boolean(props.disabled),
          });
        }
      });
    }

    return result;
  }, [options, children]);

  // Selected option resolution
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value);
  }, [normalizedOptions, value]);

  // Filtered options based on search
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) {
      return normalizedOptions;
    }
    const q = searchQuery.toLowerCase();
    return normalizedOptions.filter((opt) => {
      const labelStr = typeof opt.label === "string" ? opt.label : String(opt.value);
      const descStr = opt.description || "";
      const groupStr = opt.group || "";
      return (
        labelStr.toLowerCase().includes(q) ||
        descStr.toLowerCase().includes(q) ||
        groupStr.toLowerCase().includes(q)
      );
    });
  }, [normalizedOptions, searchable, searchQuery]);

  // Non-disabled filtered options for keyboard navigation
  const selectableOptions = useMemo(() => {
    return filteredOptions.filter((opt) => !opt.disabled);
  }, [filteredOptions]);

  // Grouped options representation
  const groupedData = useMemo(() => {
    const hasGroups = filteredOptions.some((opt) => Boolean(opt.group));
    if (!hasGroups) {
      return [{ groupName: null, items: filteredOptions }];
    }

    const groupsMap = new Map<string | null, DropdownOption<T>[]>();
    for (const opt of filteredOptions) {
      const g = opt.group || null;
      if (!groupsMap.has(g)) {
        groupsMap.set(g, []);
      }
      groupsMap.get(g)!.push(opt);
    }

    return Array.from(groupsMap.entries()).map(([groupName, items]) => ({
      groupName,
      items,
    }));
  }, [filteredOptions]);

  // Smart positioning calculation
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedHeight = Math.min(
      Math.max(filteredOptions.length * 38 + (searchable ? 48 : 0) + 16, 80),
      320
    );

    const shouldPlaceTop = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
    setIsPlacementTop(shouldPlaceTop);

    const calculatedWidth = Math.max(rect.width, 160);
    let left = rect.left;
    if (left + calculatedWidth > viewportWidth - 12) {
      left = Math.max(12, viewportWidth - calculatedWidth - 12);
    }

    if (shouldPlaceTop) {
      setDropdownPosition({
        position: "fixed",
        bottom: viewportHeight - rect.top + 4,
        left,
        width: rect.width,
        minWidth: calculatedWidth,
        maxWidth: "calc(100vw - 24px)",
        maxHeight: Math.min(spaceAbove - 16, 320),
        zIndex: 100001,
      });
    } else {
      setDropdownPosition({
        position: "fixed",
        top: rect.bottom + 4,
        left,
        width: rect.width,
        minWidth: calculatedWidth,
        maxWidth: "calc(100vw - 24px)",
        maxHeight: Math.min(spaceBelow - 16, 320),
        zIndex: 100001,
      });
    }
  }, [filteredOptions.length, searchable]);

  // Handle opening / layout effect
  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  // Event listeners for window scroll/resize to track trigger
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable]);

  // Reset highlighted index when options filter changes
  useEffect(() => {
    if (isOpen) {
      const idx = selectableOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [isOpen, selectableOptions, value]);

  // Scroll active option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && optionsListRef.current) {
      const activeEl = optionsListRef.current.querySelector(
        `[data-highlight-index="${highlightedIndex}"]`
      ) as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Option selection handler
  const handleSelect = useCallback(
    (optValue: T) => {
      if (onChange) {
        onChange(optValue);
      }
      setIsOpen(false);
      setSearchQuery("");
      triggerRef.current?.focus();
    },
    [onChange]
  );

  // Clear value handler
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onClear) {
        onClear();
      } else if (onChange) {
        onChange("" as unknown as T);
      }
      setSearchQuery("");
    },
    [onChange, onClear]
  );

  // Keyboard navigation on trigger / dropdown
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < selectableOptions.length - 1 ? prev + 1 : 0
          );
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : selectableOptions.length - 1
          );
          break;
        }
        case "Enter": {
          e.preventDefault();
          const targetOpt = selectableOptions[highlightedIndex];
          if (targetOpt) {
            handleSelect(targetOpt.value);
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery("");
          triggerRef.current?.focus();
          break;
        }
        case "Tab": {
          setIsOpen(false);
          setSearchQuery("");
          break;
        }
      }
    },
    [disabled, isOpen, selectableOptions, highlightedIndex, handleSelect]
  );

  // Size styling class
  const sizeClass =
    size === "sm" ? styles.sizeSm : size === "lg" ? styles.sizeLg : styles.sizeMd;

  // Variant styling class
  const variantClass =
    variant === "subtle"
      ? styles.variantSubtle
      : variant === "ghost"
      ? styles.variantGhost
      : styles.variantDefault;

  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : null;

  // Render trigger inner content
  const renderTriggerContent = () => {
    if (renderTrigger) {
      return renderTrigger(selectedOption, isOpen);
    }

    if (!selectedOption) {
      return (
        <span className={`${styles.valueText} ${styles.placeholder}`}>
          {placeholder}
        </span>
      );
    }

    return (
      <div className={styles.triggerContent}>
        {selectedOption.icon && (
          <span className={styles.leadingIcon}>{selectedOption.icon}</span>
        )}
        {selectedOption.color && (
          <span
            className={styles.colorDot}
            style={{ backgroundColor: selectedOption.color }}
          />
        )}
        <span className={styles.valueText}>{selectedOption.label}</span>
        {selectedOption.badge && (
          <span className={styles.badge}>{selectedOption.badge}</span>
        )}
      </div>
    );
  };

  // Dropdown Popover Element
  const dropdownElement = (
    <div
      ref={dropdownRef}
      role="presentation"
      className={`${styles.dropdownMenu} ${
        isPlacementTop ? styles.dropdownMenuTop : ""
      } ${dropdownClassName}`}
      style={dropdownPosition}
      onKeyDown={handleKeyDown}
    >
      {searchable && (
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={14} />
          <input
            ref={searchInputRef}
            type="text"
            className={styles.searchInput}
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.searchClearBtn}
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      <ul
        ref={optionsListRef}
        className={styles.optionsList}
        role="listbox"
        aria-label={label || name || "Dropdown options"}
      >
        {filteredOptions.length === 0 ? (
          <li className={styles.emptyState}>No options found</li>
        ) : (
          groupedData.map((group, gIdx) => (
            <React.Fragment key={group.groupName || `group-${gIdx}`}>
              {group.groupName && (
                <>
                  {gIdx > 0 && <li className={styles.groupDivider} role="separator" />}
                  <li className={styles.groupHeader} role="presentation">
                    {group.groupName}
                  </li>
                </>
              )}

              {group.items.map((opt) => {
                const isSelected = opt.value === value;
                const selectableIdx = selectableOptions.findIndex(
                  (s) => s.value === opt.value
                );
                const isHighlighted = selectableIdx === highlightedIndex;

                const itemSizeClass =
                  size === "sm" ? styles.optionSm : size === "lg" ? styles.optionLg : "";

                return (
                  <li
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    data-highlight-index={selectableIdx}
                    data-selected={isSelected}
                    className={`${styles.option} ${itemSizeClass} ${
                      isSelected ? styles.optionSelected : ""
                    } ${isHighlighted ? styles.optionActive : ""} ${
                      opt.disabled ? styles.optionDisabled : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!opt.disabled) {
                        handleSelect(opt.value);
                      }
                    }}
                    onMouseEnter={() => {
                      if (!opt.disabled && selectableIdx >= 0) {
                        setHighlightedIndex(selectableIdx);
                      }
                    }}
                  >
                    {renderOption ? (
                      renderOption(opt, isSelected)
                    ) : (
                      <>
                        <div className={styles.optionMain}>
                          {opt.icon && (
                            <span className={styles.optionIcon}>{opt.icon}</span>
                          )}
                          {opt.color && (
                            <span
                              className={styles.colorDot}
                              style={{ backgroundColor: opt.color }}
                            />
                          )}
                          <div className={styles.optionTextWrap}>
                            <span className={styles.optionLabel}>{opt.label}</span>
                            {opt.description && (
                              <span className={styles.optionDescription}>
                                {opt.description}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={styles.optionEnd}>
                          {opt.badge && (
                            <span className={styles.badge}>{opt.badge}</span>
                          )}
                          {isSelected && (
                            <Check className={styles.checkIcon} size={15} />
                          )}
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </React.Fragment>
          ))
        )}
      </ul>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className}`}
      style={{ width: fullWidth ? "100%" : "auto", ...style }}
    >
      {label && (
        <div className={styles.labelWrapper}>
          <label htmlFor={id} className={styles.label}>
            {label}
            {required && <span className={styles.requiredStar}>*</span>}
          </label>
        </div>
      )}

      <button
        ref={triggerRef}
        id={id}
        name={name}
        type="button"
        disabled={disabled}
        className={`${styles.trigger} ${sizeClass} ${variantClass} ${
          isOpen ? styles.triggerOpen : ""
        } ${hasError ? styles.triggerError : ""} ${triggerClassName}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
          }
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={hasError}
      >
        <div className={styles.triggerContent}>
          {leadingIcon && <span className={styles.leadingIcon}>{leadingIcon}</span>}
          {renderTriggerContent()}
        </div>

        <div className={styles.actions}>
          {clearable && Boolean(value) && !disabled && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
              aria-label="Clear selection"
              tabIndex={-1}
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ""}`}
          />
        </div>
      </button>

      {helperText && !errorMessage && (
        <p className={styles.helperText}>{helperText}</p>
      )}
      {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

      {isOpen &&
        !disabled &&
        typeof document !== "undefined" &&
        (portal ? createPortal(dropdownElement, document.body) : dropdownElement)}
    </div>
  );
}

export default Dropdown;
