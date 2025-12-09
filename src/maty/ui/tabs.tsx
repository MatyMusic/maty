import * as React from "react";
import { cn } from "@/lib/cn";

type TabsContextType = {
  value: string;
  setValue: (v: string) => void;
};
const TabsCtx = React.createContext<TabsContextType | null>(null);

type TabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
};

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: TabsProps) {
  const isControlled = value !== undefined;
  const [inner, setInner] = React.useState(defaultValue || "");
  const current = isControlled ? (value as string) : inner;

  const setValue = React.useCallback(
    (v: string) => {
      if (!isControlled) setInner(v);
      onValueChange?.(v);
    },
    [isControlled, onValueChange],
  );

  React.useEffect(() => {
    // אם אין value ולא הוגדר default – קח את ה־Trigger הראשון
    if (!isControlled && !inner) {
      const first = React.Children.toArray(children).find(
        // @ts-ignore
        (c: any) => c?.type?.displayName === "TabsList",
      ) as any;
      const firstTrigger =
        first &&
        (React.Children.toArray(first.props.children).find(
          // @ts-ignore
          (cc: any) => cc?.type?.displayName === "TabsTrigger",
        ) as any);
      const v = firstTrigger?.props?.value;
      if (v) setInner(v);
    }
  }, [children, inner, isControlled]);

  return (
    <div className={cn("w-full", className)}>
      <TabsCtx.Provider value={{ value: current, setValue }}>
        {children}
      </TabsCtx.Provider>
    </div>
  );
}
Tabs.displayName = "Tabs";

export function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex rounded-xl border bg-white/70 p-1 dark:bg-zinc-900/60",
        className,
      )}
      {...props}
    />
  );
}
TabsList.displayName = "TabsList";

export function TabsTrigger({
  className,
  value,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const ctx = React.useContext(TabsCtx);
  if (!ctx) throw new Error("TabsTrigger must be used within <Tabs>");
  const active = ctx.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx.setValue(value)}
      aria-pressed={active}
      className={cn(
        "px-3 py-1.5 text-sm rounded-lg transition",
        active
          ? "bg-amber-600 text-white"
          : "hover:bg-amber-50 dark:hover:bg-white/10",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
TabsTrigger.displayName = "TabsTrigger";

export function TabsContent({
  className,
  value,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const ctx = React.useContext(TabsCtx);
  if (!ctx) throw new Error("TabsContent must be used within <Tabs>");
  if (ctx.value !== value) return null;
  return (
    <div className={cn("mt-3", className)} {...props}>
      {children}
    </div>
  );
}
TabsContent.displayName = "TabsContent";
