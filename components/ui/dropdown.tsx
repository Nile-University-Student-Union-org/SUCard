"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useId,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { ChevronDown, Check, AlertCircle } from "lucide-react";
import { ValidationBubble } from "./validation-bubble";

export interface DropdownItemConfig {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

export type DropdownAlignment = "left" | "right" | "center";
export type DropdownPlacement = "bottom" | "top";

interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  close: () => void;
  align: DropdownAlignment;
  placement: DropdownPlacement;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  menuId: string;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdown() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown compound components must be rendered inside <Dropdown />");
  }
  return context;
}

export interface DropdownRootProps {
  children?: ReactNode;
  align?: DropdownAlignment;
  placement?: DropdownPlacement;
  className?: string;
  label?: string;
  ariaLabel?: string;
  error?: string;
  helperText?: string;
  validationBubble?: ReactNode;
  onDismissValidationBubble?: () => void;
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  options?: DropdownItemConfig[];
  placeholder?: string;
  disabled?: boolean;
  buttonClassName?: string;
  contentClassName?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export const Dropdown: React.FC<DropdownRootProps> = ({
  children,
  align = "left",
  placement = "bottom",
  className = "",
  label,
  ariaLabel,
  error,
  helperText,
  validationBubble,
  onDismissValidationBubble,
  id,
  value,
  onChange,
  options,
  placeholder = "Select option...",
  disabled = false,
  buttonClassName = "",
  contentClassName = "",
  searchable = false,
  searchPlaceholder = "Search options...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const close = () => setIsOpen(false);
  const openFromKeyboard = (last = false) => {
    if (!isOpen) setSearch("");
    setIsOpen(true);
    requestAnimationFrame(() => {
      if (searchable && !last) {
        searchRef.current?.focus();
        return;
      }
      const items = dropdownRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not(:disabled)'
      );
      (last ? items?.[items.length - 1] : items?.[0])?.focus();
    });
  };
  const inputId = id || (label ? `${menuId}-trigger` : undefined);
  const isFullWidth = className.includes("w-full");

  // Shorthand select mode
  if (options) {
    const selectedOption = options.find((opt) => opt.value === value);
    const visibleOptions = searchable && search.trim()
      ? options.filter(opt => `${opt.label} ${opt.description || ""} ${opt.badge || ""}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
      : options;

    const dropdownNode = (
      <div
        ref={dropdownRef}
        className={`relative ${isFullWidth ? "w-full" : "inline-block"} text-left`}
        onKeyDownCapture={(event) => {
          if (event.key === "Escape" && isOpen) {
            event.stopPropagation();
            setIsOpen(false);
            triggerRef.current?.focus();
          }
        }}
      >
        <button
          ref={triggerRef}
          id={inputId}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!isOpen) setSearch("");
            setIsOpen(!isOpen);
            if (!isOpen && searchable) requestAnimationFrame(() => searchRef.current?.focus());
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              openFromKeyboard(event.key === "ArrowUp");
            }
          }}
          className={`inline-flex min-w-0 max-w-full min-h-[44px] items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-[12px] bg-white dark:bg-zinc-900
                     border-2 ${error ? "border-destructive focus:border-destructive text-destructive" : "border-slate-300 dark:border-zinc-700 text-charcoal dark:text-zinc-200 hover:border-brand/50 dark:hover:border-brand-soft/50"}
                     text-sm font-medium
                     focus:outline-none focus:border-brand dark:focus:border-brand-soft focus-visible:ring-2 focus-visible:ring-brand dark:focus-visible:ring-brand-soft
                     transition-[transform,border-color,background-color,box-shadow,color] duration-140 active:scale-[0.98] motion-reduce:transition-none motion-reduce:transform-none cursor-pointer shadow-xs
                     disabled:opacity-50 disabled:pointer-events-none select-none ${buttonClassName}`}
          aria-haspopup="menu"
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          aria-controls={menuId}
        >
          <div className="flex min-w-0 items-center gap-2 truncate">
            {selectedOption?.icon && (
              <selectedOption.icon className="w-4 h-4 text-brand dark:text-brand-soft shrink-0" />
            )}
            <span className={`truncate ${selectedOption ? "font-bold text-charcoal dark:text-white" : "text-ash dark:text-zinc-400 font-normal"}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-ash transition-transform duration-200 shrink-0 ${
              isOpen ? "rotate-180 text-brand dark:text-brand-soft" : ""
            }`}
          />
        </button>

        <DropdownContent className={contentClassName}>
          {searchable && (
            <input
              ref={searchRef}
              type="search"
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={search}
              onChange={event => setSearch(event.target.value)}
              onKeyDown={event => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  event.stopPropagation();
                  dropdownRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus();
                }
              }}
              className="mb-1 w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-zinc-700 dark:bg-zinc-900"
            />
          )}
          {visibleOptions.length === 0 && (
            <p className="px-3 py-3 text-sm text-ash dark:text-zinc-400" role="status">No matching options</p>
          )}
          {visibleOptions.map((opt) => (
            <DropdownItem
              key={opt.value}
              active={opt.value === value}
              disabled={opt.disabled}
              onClick={() => {
                onChange?.(opt.value);
                close();
              }}
            >
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {opt.icon && (
                    <opt.icon className="w-4 h-4 text-ash group-hover:text-brand dark:group-hover:text-brand-soft shrink-0" />
                  )}
                  <div className="min-w-0 text-left">
                    <p className="truncate font-semibold">{opt.label}</p>
                    {opt.description && (
                      <p className="truncate text-[11px] text-slate-600 dark:text-zinc-400 font-normal">
                        {opt.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {opt.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                      {opt.badge}
                    </span>
                  )}
                  {opt.value === value && (
                    <Check className="w-3.5 h-3.5 text-brand dark:text-brand-soft" />
                  )}
                </div>
              </div>
            </DropdownItem>
          ))}
        </DropdownContent>
      </div>
    );

    return (
      <DropdownContext.Provider value={{ isOpen, setIsOpen, close, align, placement, triggerRef, menuId }}>
        <div className={isFullWidth ? "w-full space-y-1.5 text-left relative" : "space-y-1.5 text-left relative"}>
          {label && (
            <label
              htmlFor={inputId}
              className="block text-xs font-bold text-slate-700 dark:text-zinc-300"
            >
              {label}
            </label>
          )}

          {dropdownNode}

          {validationBubble && (
            <div className="pt-0.5">
              <ValidationBubble
                message={validationBubble}
                placement="bottom-left"
                variant="warning"
                onDismiss={onDismissValidationBubble}
                dismissible={!!onDismissValidationBubble}
              />
            </div>
          )}

          {error && !validationBubble ? (
            <p className="text-xs font-bold text-destructive flex items-center gap-1 animate-in fade-in-0 duration-150">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          ) : helperText && !validationBubble ? (
            <p className="text-xs font-medium text-ash dark:text-zinc-400">
              {helperText}
            </p>
          ) : null}
        </div>
      </DropdownContext.Provider>
    );
  }

  // Compound component mode
  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, close, align, placement, triggerRef, menuId }}>
      <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export interface DropdownTriggerProps {
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
}

export const DropdownTrigger: React.FC<DropdownTriggerProps> = ({
  children,
  ariaLabel,
  className = "",
}) => {
  const { isOpen, setIsOpen, triggerRef, menuId } = useDropdown();

  return (
    <button
      ref={triggerRef}
      aria-label={ariaLabel}
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          setIsOpen(true);
          const trigger = event.currentTarget;
          const last = event.key === "ArrowUp";
          requestAnimationFrame(() => {
            const items = trigger.parentElement?.querySelectorAll<HTMLButtonElement>(
              '[role="menuitem"]:not(:disabled)'
            );
            (last ? items?.[items.length - 1] : items?.[0])?.focus();
          });
        }
      }}
      className={`cursor-pointer inline-flex ${className}`}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      aria-controls={menuId}
    >
      {children}
    </button>
  );
};

export interface DropdownContentProps {
  children: ReactNode;
  className?: string;
  minWidth?: string;
}

export const DropdownContent: React.FC<DropdownContentProps> = ({
  children,
  className = "",
  minWidth = "min-w-[12rem]",
}) => {
  const { isOpen, align, placement, menuId } = useDropdown();
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const anchor = panel?.offsetParent;
    if (!panel || !(anchor instanceof HTMLElement)) return;
    if (align !== "center") {
      panel.style.removeProperty("left");
      return;
    }
    const updateLeft = () => {
      const rect = anchor.getBoundingClientRect();
      const left = rect.left + (anchor.clientWidth - panel.offsetWidth) / 2;
      panel.style.left = `${Math.round(left) - rect.left}px`;
    };
    updateLeft();
    const observer = new ResizeObserver(updateLeft);
    observer.observe(anchor);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [align, isOpen]);

  const alignClass = align === "right" ? "right-0" : "left-0";
  const placementClass =
    placement === "top"
      ? "bottom-full mb-2 origin-bottom"
      : "top-full mt-2 origin-top";

  return (
    <div
      ref={panelRef}
      id={menuId}
      aria-hidden={!isOpen}
      inert={!isOpen}
      onKeyDown={(event) => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        const items = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')
        );
        if (!items.length) return;
        event.preventDefault();
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        const next =
          event.key === "Home" ? 0 :
          event.key === "End" ? items.length - 1 :
          event.key === "ArrowUp" ? (index - 1 + items.length) % items.length :
          (index + 1) % items.length;
        items[next]?.focus();
      }}
      className={`
        absolute z-50 ${minWidth} max-w-[calc(100vw-32px)] ${alignClass} ${placementClass}
        max-h-[70dvh] overflow-y-auto overscroll-contain rounded-[14px] p-1.5
        bg-white/95 dark:bg-zinc-900/90 backdrop-blur-md backdrop-saturate-150
        border-2 border-slate-300 dark:border-zinc-800
        shadow-xl shadow-slate-900/5 dark:shadow-black/50
        transition-[transform,opacity] motion-reduce:transition-none motion-reduce:transform-none
        ${
          isOpen
            ? "opacity-100 transform-none pointer-events-auto duration-180 ease-out"
            : `opacity-0 scale-95 pointer-events-none duration-120 ease-in ${
                placement === "top" ? "translate-y-2" : "-translate-y-2"
              }`
        }
        ${className}
      `}
      role="menu"
    >
      <div className="space-y-0.5">{children}</div>
    </div>
  );
};

export interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  onClick,
  active = false,
  disabled = false,
  className = "",
}) => {
  const { close } = useDropdown();

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    close();
  };

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={handleClick}
      className={`
        group w-full min-h-[44px] flex items-center px-3 py-2 rounded-[10px] text-xs font-bold
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:focus-visible:ring-brand-soft
        transition-[transform,background-color,color] duration-140 select-none text-left cursor-pointer motion-reduce:transition-none motion-reduce:transform-none
        ${
          active
            ? "bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft"
            : "text-charcoal dark:text-zinc-200 hover:bg-slate-100/80 dark:hover:bg-zinc-800/70 hover:text-brand dark:hover:text-white"
        }
        ${disabled ? "opacity-40 pointer-events-none" : "active:scale-[0.97] motion-reduce:active:scale-100"}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export const DropdownSeparator: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div
    className={`h-[1px] my-1 bg-slate-200/80 dark:bg-zinc-800/80 -mx-1.5 ${className}`}
    role="separator"
  />
);

export const DropdownLabel: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 select-none ${className}`}
  >
    {children}
  </div>
);
