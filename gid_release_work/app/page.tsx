import ProductApplication from "./components/product-application";

// Do not server-redirect the Telegram launch URL.
// Telegram injects tgWebAppData/tgWebAppStartParam into the original URL;
// a server redirect can discard those launch parameters before the SDK reads them.
export default function Home() {
  return <ProductApplication role="tourist" slug="welcome" />;
}
