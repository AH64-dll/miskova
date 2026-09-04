import Link from "next/link";

export function CollectionFooter() {
  return (
    <footer className="mk-footer">
      <div className="mk-footer-grid">
        <div className="mk-footer-contact-details">
          <p>Address: Cairo,Egypt</p>
          <p>Phone: <a href="tel:01036202634">01036202634</a></p>
          <p>Email: <a href="mailto:miskovafragrances@gmail.com">miskovafragrances@gmail.com</a></p>
        </div>

        <nav className="mk-footer-col" aria-label="Categories">
          <h3>Categories</h3>
          <Link href="/collections/summer">Summer Collection</Link>
          <Link href="/collections/for-him">For Him</Link>
          <Link href="/collections/for-her">For Her</Link>
          <Link href="/collections/best-sellers">Best Sellers !</Link>
          <Link href="/collections/all">All Products</Link>
          <Link href="/collections">Categories</Link>
        </nav>

        <nav className="mk-footer-col" aria-label="Pages">
          <h3>Pages</h3>
          <a href="https://miskova.myeasyorders.com/pages/privacy-policy" target="_blank" rel="noopener noreferrer">
            privacy-policy
          </a>
          <a href="https://miskova.myeasyorders.com/pages/refund-policy" target="_blank" rel="noopener noreferrer">
            refund-policy
          </a>
          <a href="https://miskova.myeasyorders.com/pages/shipping-policy" target="_blank" rel="noopener noreferrer">
            shipping-policy
          </a>
          <a href="https://miskova.myeasyorders.com/pages/terms-and-conditions" target="_blank" rel="noopener noreferrer">
            terms-and-conditions
          </a>
          <a href="https://miskova.myeasyorders.com/pages/About-us" target="_blank" rel="noopener noreferrer">
            About Us
          </a>
        </nav>

        <nav className="mk-footer-col" aria-label="Connect">
          <h3>Connect</h3>
          <a href="https://www.facebook.com/profile.php?id=61585754406759" target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
          <a href="https://www.instagram.com/miskova_fragrances/" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <a href="https://www.tiktok.com/@miskova_fragrance" target="_blank" rel="noopener noreferrer">
            TikTok
          </a>
        </nav>
      </div>

      <div className="mk-footer-base">
        <p className="mk-powered-by">
          Powered By <a href="https://www.easy-orders.net" target="_blank" rel="noopener noreferrer">Easyorders</a>
        </p>
        <span>© {new Date().getFullYear()} Miskova Fragrances</span>
      </div>
    </footer>
  );
}
