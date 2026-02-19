import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";

function RedirectToAbout() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/about");
  }, [setLocation]);
  return null;
}
import { ThemeProvider } from "./contexts/ThemeContext";
import { PageContextProvider } from "./contexts/PageContext";
import Home from "./pages/Home";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import AboutPage from "./pages/AboutPage";
import Contact from "./pages/Contact";
import Selling from "./pages/Selling";
import Sold from "./pages/Sold";
import PropertyConcierge from "./pages/PropertyConcierge";
import MarketAppraisal from "./pages/MarketAppraisal";
import Buying from "./pages/Buying";
import ForSale from "./pages/ForSale";
import Prestige from "./pages/Prestige";
import SecretProperties from "./pages/SecretProperties";
import Renting from "./pages/Renting";
import ForLease from "./pages/ForLease";
import News from "./pages/News";
import Blog from "./pages/Blog";
import Videos from "./pages/Videos";
import Podcasts from "./pages/Podcasts";
import Testimonials from "./pages/Testimonials";
import Awards from "./pages/Awards";
import GetAQuote from "./pages/GetAQuote";
import Layout from "./components/Layout";
import RouteWatcher from "./components/RouteWatcher";

export function Router() {
  return (
    <Layout>
      <RouteWatcher />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/properties" component={Properties} />
        <Route path="/property/:slug" component={PropertyDetail} />
        <Route path="/about" component={AboutPage} />
        <Route path="/contact" component={Contact} />
        <Route path="/selling" component={Selling} />
        <Route path="/sold" component={Sold} />
        <Route path="/property-concierge" component={PropertyConcierge} />
        <Route path="/market-appraisal" component={MarketAppraisal} />
        <Route path="/buying" component={Buying} />
        <Route path="/for-sale" component={ForSale} />
        <Route path="/prestige" component={Prestige} />
        <Route path="/secret-properties" component={SecretProperties} />
        <Route path="/renting" component={Renting} />
        <Route path="/for-lease" component={ForLease} />
        {/* Hidden for Theodora — block direct access */}
        <Route path="/maintenance" component={NotFound} />
        <Route path="/landlord" component={NotFound} />
        <Route path="/recently-leased" component={NotFound} />
        <Route path="/rental-appraisal" component={NotFound} />
        <Route path="/commercial" component={NotFound} />
        <Route path="/commercial-lease" component={NotFound} />
        <Route path="/commercial-sale" component={NotFound} />
        {/* About sub-pages hidden — redirect to About (Theodora's bio) */}
        <Route path="/team" component={RedirectToAbout} />
        <Route path="/careers" component={RedirectToAbout} />
        <Route path="/our-story" component={RedirectToAbout} />
        <Route path="/community" component={RedirectToAbout} />
        <Route path="/news" component={News} />
        <Route path="/blog" component={Blog} />
        <Route path="/videos" component={Videos} />
        <Route path="/podcasts" component={Podcasts} />
        <Route path="/testimonials" component={Testimonials} />
        <Route path="/awards" component={Awards} />
        <Route path="/get-a-quote" component={GetAQuote} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <PageContextProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </PageContextProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
