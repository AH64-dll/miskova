import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mk-footer">
      <div className="mk-footer-grid">
        <div className="mk-footer-contact-details">
          <p>Address: Cairo,Egypt</p>
          <p>Phone: <a href="tel:01036202634">01036202634</a></p>
          <p>Email: <a href="mailto:miskovafragrances@gmail.com">miskovafragrances@gmail.com</a></p>
        </div>

        <nav className="mk-footer-col" aria-label="Categories">
          <h3>Collections</h3>
          <Link href="/collections/summer">Summer Collection</Link>
          <Link href="/collections/for-him">For Him</Link>
          <Link href="/collections/for-her">For Her</Link>
          <Link href="/collections/best-sellers">Best Sellers !</Link>
          <Link href="/collections/all">All Products</Link>
          <Link href="/collections">Categories</Link>
        </nav>

        <nav className="mk-footer-col" aria-label="Store Information">
          <h3>Information</h3>
          <a
            href="https://miskova.myeasyorders.com/pages/shipping-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Shipping Policy
          </a>
          <a
            href="https://miskova.myeasyorders.com/pages/refund-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Refund Policy
          </a>
          <a
            href="https://miskova.myeasyorders.com/pages/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
          <a
            href="https://miskova.myeasyorders.com/pages/terms-and-conditions"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms &amp; Conditions
          </a>
          <a
            href="https://miskova.myeasyorders.com/pages/About-us"
            target="_blank"
            rel="noopener noreferrer"
          >
            About Us
          </a>
        </nav>

        <nav className="mk-footer-col" aria-label="Connect with Miskova">
          <h3>Connect</h3>
          <a
            href="https://www.facebook.com/profile.php?id=61585754406759"
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook
          </a>
          <a
            href="https://www.instagram.com/miskova_fragrances/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          <a
            href="https://www.tiktok.com/@miskova_fragrance"
            target="_blank"
            rel="noopener noreferrer"
          >
            TikTok
          </a>
          <a href="mailto:miskovafragrances@gmail.com">miskovafragrances@gmail.com</a>
        </nav>
      </div>

      <div className="mk-footer-base">
        <span>© {new Date().getFullYear()} Miskova Fragrances · All Rights Reserved</span>
        <span>Cairo, Egypt</span>
      </div>
    </footer>
  );
}
