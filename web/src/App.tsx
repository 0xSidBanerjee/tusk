import { useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TaskList } from "./features/tasks/TaskList";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen bg-background text-foreground transition-colors duration-300 selection:bg-primary selection:text-primary-foreground overflow-hidden">
        <TaskList />
      </div>
    </QueryClientProvider>
  );
}

export default App;
