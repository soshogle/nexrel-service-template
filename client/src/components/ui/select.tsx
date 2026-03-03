import * as React from "react";
import { ChevronDownIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  itemLabels: React.MutableRefObject<Map<string, React.ReactNode>>;
  labelVersion: number;
  bumpLabel: () => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select components must be used within <Select>");
  return ctx;
}

function Select({
  children,
  value,
  onValueChange,
  defaultValue,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  dir?: "ltr" | "rtl";
}) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const itemLabels = React.useRef<Map<string, React.ReactNode>>(new Map());
  const [labelVersion, setLabelVersion] = React.useState(0);
  const resolvedValue = value ?? internalValue;

  const handleChange = React.useCallback(
    (v: string) => {
      onValueChange?.(v);
      if (value === undefined) setInternalValue(v);
    },
    [onValueChange, value],
  );

  const bumpLabel = React.useCallback(() => setLabelVersion((n) => n + 1), []);

  const ctx = React.useMemo(
    () => ({
      value: resolvedValue,
      onValueChange: handleChange,
      open,
      setOpen,
      triggerRef,
      itemLabels,
      labelVersion,
      bumpLabel,
    }),
    [resolvedValue, handleChange, open, labelVersion, bumpLabel],
  );

  return (
    <SelectContext.Provider value={ctx}>
      <div data-slot="select" className="relative inline-block">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

function SelectGroup({ children, ...props }: { children: React.ReactNode }) {
  return (
    <div data-slot="select-group" {...props}>
      {children}
    </div>
  );
}

function SelectValue({ placeholder }: { placeholder?: React.ReactNode }) {
  const { value, itemLabels, labelVersion } = useSelectContext();
  void labelVersion;
  const label = value ? itemLabels.current.get(value) : undefined;

  return (
    <span
      data-slot="select-value"
      data-placeholder={!label ? "" : undefined}
      className="line-clamp-1 flex items-center gap-2"
    >
      {label || placeholder || value || ""}
    </span>
  );
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "default";
}) {
  const { open, setOpen, triggerRef } = useSelectContext();

  return (
    <button
      ref={triggerRef}
      type="button"
      role="combobox"
      aria-expanded={open}
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      onClick={() => setOpen((prev) => !prev)}
      {...props}
    >
      {children}
      <ChevronDownIcon className="size-4 opacity-50" />
    </button>
  );
}

function SelectContent({
  className,
  children,
  position,
  align,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  position?: "popper" | "item-aligned";
  align?: "start" | "center" | "end";
}) {
  const { open, setOpen, triggerRef } = useSelectContext();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, setOpen, triggerRef]);

  return (
    <>
      {/* Always render children so items can register labels, but only show dropdown when open */}
      <div
        ref={contentRef}
        data-slot="select-content"
        data-state={open ? "open" : "closed"}
        className={cn(
          "bg-popover text-popover-foreground absolute z-50 mt-1 max-h-60 min-w-[8rem] overflow-y-auto rounded-md border p-1 shadow-md",
          open
            ? "animate-in fade-in-0 zoom-in-95"
            : "hidden",
          className,
        )}
        style={{
          width: triggerRef.current?.offsetWidth
            ? `${Math.max(triggerRef.current.offsetWidth, 128)}px`
            : undefined,
        }}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

function SelectLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  value: itemValue,
  disabled,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
}) {
  const { value, onValueChange, setOpen, itemLabels, bumpLabel } =
    useSelectContext();
  const isSelected = value === itemValue;

  const prevLabel = React.useRef<React.ReactNode>(undefined);
  if (prevLabel.current !== children) {
    prevLabel.current = children;
    itemLabels.current.set(itemValue, children);
  }

  React.useEffect(() => {
    bumpLabel();
    return () => {
      itemLabels.current.delete(itemValue);
    };
  }, [itemValue, bumpLabel, itemLabels]);

  return (
    <div
      role="option"
      aria-selected={isSelected}
      data-slot="select-item"
      data-disabled={disabled || undefined}
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isSelected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      onClick={() => {
        if (disabled) return;
        onValueChange?.(itemValue);
        setOpen(false);
      }}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        {isSelected && <CheckIcon className="size-4" />}
      </span>
      <span>{children}</span>
    </div>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="select-separator"
      className={cn(
        "bg-border pointer-events-none -mx-1 my-1 h-px",
        className,
      )}
      {...props}
    />
  );
}

function SelectScrollUpButton() {
  return null;
}

function SelectScrollDownButton() {
  return null;
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
