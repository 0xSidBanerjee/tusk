import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TaskList } from "./features/tasks/TaskList";
import { useTheme } from "./hooks/useTheme";
import { Sun, Moon, CheckSquare } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300 selection:bg-primary selection:text-primary-foreground">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-5xl flex h-16 items-center justify-between mx-auto px-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg">
                <CheckSquare className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Tusk</h1>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border bg-background hover:bg-muted transition-all shadow-sm"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          </div>
        </header>

        <main className="container max-w-5xl mx-auto px-4 py-8 md:py-12">
          <TaskList />
        </main>

        <footer className="border-t py-6 md:py-0">
          <div className="container max-w-5xl mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built with Go and React. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
