import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="font-display text-2xl text-white block mb-4">
              ShopWave
            </Link>
            <p className="text-sm leading-relaxed text-stone-400">
              Curated fashion for the discerning modern wardrobe. Quality craftsmanship, honest pricing.
            </p>
            <div className="flex gap-4 mt-6">
              {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {[
            {
              title: "Shop",
              links: [
                { label: "Women", to: "/products?category=women" },
                { label: "Men", to: "/products?category=men" },
                { label: "Kids", to: "/products?category=kids" },
                { label: "Accessories", to: "/products?category=accessories" },
                { label: "Footwear", to: "/products?category=footwear" },
              ],
            },
            {
              title: "Help",
              links: [
                { label: "Size Guide", to: "#" },
                { label: "Shipping Info", to: "#" },
                { label: "Returns", to: "#" },
                { label: "Track Order", to: "#" },
                { label: "FAQs", to: "#" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About Us", to: "#" },
                { label: "Careers", to: "#" },
                { label: "Press", to: "#" },
                { label: "Sustainability", to: "#" },
                { label: "Contact", to: "#" },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white text-sm font-semibold tracking-widest uppercase mb-4 font-body">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-sm text-stone-400 hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} ShopWave. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-stone-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-stone-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
