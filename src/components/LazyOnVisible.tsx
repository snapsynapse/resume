import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface LazyOnVisibleProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
}

const LazyOnVisible = ({
  children,
  fallback = null,
  rootMargin = "600px 0px",
}: LazyOnVisibleProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(() =>
    import.meta.env.MODE === "test" ||
    typeof window === "undefined" ||
    !("IntersectionObserver" in window),
  );

  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, visible]);

  return <div ref={ref}>{visible ? children : fallback}</div>;
};

export default LazyOnVisible;
