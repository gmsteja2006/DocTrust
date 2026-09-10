import { Home } from "./pages/Home";
import { ThemeProvider } from "./hooks/useTheme";

function App() {
  return (
    <ThemeProvider>
      <Home />
    </ThemeProvider>
  );
}

export default App;
