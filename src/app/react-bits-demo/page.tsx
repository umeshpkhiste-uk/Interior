import AnimatedContent from "@/components/AnimatedContent";

export default function ReactBitsDemoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 p-12">
      <AnimatedContent distance={80} direction="vertical" duration={0.8}>
        <div className="rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
          <h1 className="text-2xl font-semibold">React Bits is wired up</h1>
          <p className="text-muted-foreground">
            This card scroll-reveals via AnimatedContent from the @react-bits shadcn registry.
          </p>
        </div>
      </AnimatedContent>
    </main>
  );
}
