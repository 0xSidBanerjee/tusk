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
          <div className="flex h-14 items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1 rounded-lg">
                <CheckSquare className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-bold tracking-tight">Tusk</h1>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border bg-background hover:bg-muted transition-all shadow-sm"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        <main className="h-[calc(100vh-56px)]">
          <TaskList />
        </main>

      </div>
    </QueryClientProvider>
  );
}

export default App;
