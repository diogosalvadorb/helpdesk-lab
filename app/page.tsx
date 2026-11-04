import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Hello World</h1>
      <Button variant="outline">Click me</Button>
    </div>
  );
}
