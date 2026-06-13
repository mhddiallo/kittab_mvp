import {
  BookCardComponent
} from "./chunk-2CGVFZCM.js";
import {
  FooterComponent,
  NavbarComponent
} from "./chunk-RF4AULXN.js";
import {
  CommonModule,
  DecimalPipe,
  RouterLink,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵsanitizeUrl,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-DPFWTYZM.js";

// src/app/pages/home/home.component.ts
var _forTrack0 = ($index, $item) => $item.id;
var _c0 = (a0) => ["/books", a0];
function HomeComponent_For_67_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 31)(1, "div", 55);
    \u0275\u0275element(2, "img", 56);
    \u0275\u0275elementStart(3, "span", 57);
    \u0275\u0275text(4);
    \u0275\u0275pipe(5, "number");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 58)(7, "h3", 59);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "p", 60);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "div", 61)(12, "span", 62);
    \u0275\u0275text(13, "\u2605 4.8");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "span", 63);
    \u0275\u0275text(15, "Bon \xE9tat");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const book_r1 = ctx.$implicit;
    \u0275\u0275property("routerLink", \u0275\u0275pureFunction1(8, _c0, book_r1.id));
    \u0275\u0275advance(2);
    \u0275\u0275property("src", book_r1.images[0].url, \u0275\u0275sanitizeUrl)("alt", book_r1.title);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind1(5, 6, book_r1.price), " FCFA");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(book_r1.title);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("par ", book_r1.author, "");
  }
}
function HomeComponent_For_135_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-book-card", 52);
  }
  if (rf & 2) {
    const book_r2 = ctx.$implicit;
    \u0275\u0275property("book", book_r2);
  }
}
var HomeComponent = class _HomeComponent {
  constructor() {
    this.trendingBooks = [];
    this.popularBooks = [];
  }
  ngOnInit() {
    this.trendingBooks = this.getMockBooks(4);
    this.popularBooks = this.getMockBooks(6);
  }
  getMockBooks(count) {
    const titles = [
      { t: "Les Contes de Leuk-le-Li\xE8vre", a: "L\xE9opold S\xE9dar Senghor", p: 8e3 },
      { t: "Le Ventre de l'Atlantique", a: "Fatou Diome", p: 12e3 },
      { t: "Une si longue lettre", a: "Mariama B\xE2", p: 6e3 },
      { t: "Soundjata ou l'\xE9pop\xE9e", a: "Djibril Tamsir Niane", p: 9500 },
      { t: "Math\xE9matiques Terminale S", a: "Seydou Traor\xE9", p: 8500 },
      { t: "L'enfant noir", a: "Camara Laye", p: 7500 }
    ];
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      title: titles[i % titles.length].t,
      author: titles[i % titles.length].a,
      price: titles[i % titles.length].p,
      condition: ["new", "like_new", "good", "fair"][i % 4],
      book_type: "novel",
      images: [{ url: `https://picsum.photos/seed/book${i + 1}/300/400`, is_primary: true }],
      seller: { first_name: "Fatou", last_name: "Seck", phone: "+224123456789", address: "Conakry" },
      is_available: true
    }));
  }
  static {
    this.\u0275fac = function HomeComponent_Factory(t) {
      return new (t || _HomeComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _HomeComponent, selectors: [["app-home"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 140, vars: 0, consts: [[1, "max-w-7xl", "mx-auto", "px-6", "py-16", "flex", "flex-col", "md:flex-row", "items-center", "gap-10"], [1, "flex-1"], [1, "text-4xl", "md:text-5xl", "font-bold", "text-gray-900", "leading-tight", "mb-2"], [1, "text-primary"], [1, "text-gray-500", "mt-4", "mb-8", "max-w-md"], [1, "flex", "items-center", "bg-gray-50", "border", "border-gray-200", "rounded-full", "px-4", "py-3", "max-w-md"], ["type", "text", "placeholder", "Quel livre recherchez-vous ?", 1, "flex-1", "bg-transparent", "text-sm", "outline-none", "text-gray-700"], [1, "bg-primary", "text-white", "rounded-full", "p-2", "ml-2"], ["fill", "none", "viewBox", "0 0 24 24", "stroke", "currentColor", 1, "h-4", "w-4"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"], [1, "flex", "gap-8", "mt-8", "text-sm"], [1, "font-bold", "text-gray-900", "text-lg"], [1, "text-gray-400"], [1, "flex-1", "hidden", "md:flex", "justify-center"], [1, "bg-gradient-to-br", "from-red-50", "to-amber-50", "rounded-3xl", "p-10", "relative"], [1, "text-8xl"], [1, "absolute", "top-4", "right-4", "bg-white", "shadow-md", "rounded-xl", "px-3", "py-2", "text-xs", "font-medium", "text-gray-700"], [1, "absolute", "bottom-8", "left-2", "bg-white", "shadow-md", "rounded-xl", "px-3", "py-2", "text-xs", "font-medium", "text-gray-700"], [1, "text-center", "text-sm", "text-gray-500", "mt-4", "font-medium"], [1, "bg-gradient-to-b", "from-red-600", "to-red-800", "py-12"], [1, "max-w-7xl", "mx-auto", "px-6"], [1, "flex", "items-center", "justify-between", "mb-6"], [1, "text-white", "font-bold", "text-2xl", "flex", "items-center", "gap-2"], [1, "bg-white/20", "text-white", "text-xs", "px-2", "py-0.5", "rounded-full", "ml-1"], [1, "text-red-200", "text-sm", "mt-1"], [1, "flex", "items-center", "gap-2"], ["routerLink", "/catalogue", 1, "text-white", "text-sm", "font-medium", "hover:underline"], [1, "bg-white/20", "text-white", "rounded-full", "p-1.5", "hover:bg-white/30"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M15 19l-7-7 7-7"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M9 5l7 7-7 7"], [1, "grid", "grid-cols-2", "md:grid-cols-4", "gap-4"], [1, "bg-white", "rounded-2xl", "overflow-hidden", "shadow-lg", "hover:shadow-xl", "transition-shadow", "cursor-pointer", 3, "routerLink"], [1, "text-center", "text-red-200", "text-sm", "mt-6"], [1, "text-white"], [1, "max-w-7xl", "mx-auto", "px-6", "py-14", "grid", "md:grid-cols-2", "gap-6"], [1, "card", "p-8"], [1, "font-bold", "text-2xl", "text-gray-900", "mb-3"], [1, "text-gray-500", "text-sm", "mb-6"], ["routerLink", "/catalogue", 1, "text-primary", "font-medium", "text-sm", "hover:underline"], [1, "bg-amber-400", "py-14"], [1, "max-w-7xl", "mx-auto", "px-6", "flex", "flex-col", "md:flex-row", "items-center", "gap-12"], [1, "flex-shrink-0", "text-8xl"], [1, "font-bold", "text-3xl", "text-white", "mb-3"], [1, "text-amber-100", "mb-6", "text-sm", "leading-relaxed"], [1, "grid", "grid-cols-2", "gap-3", "mb-6"], [1, "bg-white/20", "rounded-xl", "p-3", "text-white", "text-sm", "font-medium"], [1, "font-normal", "text-xs", "text-amber-100"], ["routerLink", "/catalogue", 1, "inline-flex", "items-center", "bg-white", "text-amber-700", "font-semibold", "px-6", "py-3", "rounded-full", "text-sm", "hover:bg-amber-50", "transition-colors"], [1, "max-w-7xl", "mx-auto", "px-6", "py-14"], [1, "font-bold", "text-2xl", "text-center", "text-gray-900", "mb-2"], [1, "text-center", "text-gray-500", "text-sm", "mb-8"], [1, "grid", "grid-cols-2", "md:grid-cols-3", "lg:grid-cols-6", "gap-4"], [3, "book"], [1, "text-center", "mt-10"], ["routerLink", "/catalogue", 1, "btn-outline", "inline-flex", "items-center", "gap-2"], [1, "relative"], [1, "w-full", "h-44", "object-cover", 3, "src", "alt"], [1, "absolute", "top-2", "right-2", "bg-white", "text-gray-800", "text-xs", "font-bold", "px-2", "py-1", "rounded-lg", "shadow"], [1, "p-3"], [1, "font-semibold", "text-sm", "text-gray-900", "truncate"], [1, "text-xs", "text-gray-500"], [1, "flex", "items-center", "justify-between", "mt-2"], [1, "text-xs", "text-yellow-500"], [1, "badge", "bg-amber-100", "text-amber-700", "text-xs"]], template: function HomeComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275element(0, "app-navbar");
        \u0275\u0275elementStart(1, "section", 0)(2, "div", 1)(3, "h1", 2);
        \u0275\u0275text(4, " D\xE9couvrez votre");
        \u0275\u0275element(5, "br");
        \u0275\u0275text(6, "prochaine");
        \u0275\u0275element(7, "br");
        \u0275\u0275elementStart(8, "span", 3);
        \u0275\u0275text(9, "aventure litt\xE9raire");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(10, "p", 4);
        \u0275\u0275text(11, "Trouvez des classiques et des nouveaut\xE9s que vous avez toujours voulus dans votre liste de lecture");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(12, "div", 5);
        \u0275\u0275element(13, "input", 6);
        \u0275\u0275elementStart(14, "button", 7);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(15, "svg", 8);
        \u0275\u0275element(16, "path", 9);
        \u0275\u0275elementEnd()()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(17, "div", 10)(18, "div")(19, "span", 11);
        \u0275\u0275text(20, "1000+");
        \u0275\u0275elementEnd();
        \u0275\u0275element(21, "br");
        \u0275\u0275elementStart(22, "span", 12);
        \u0275\u0275text(23, "Livres disponibles");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(24, "div")(25, "span", 11);
        \u0275\u0275text(26, "500+");
        \u0275\u0275elementEnd();
        \u0275\u0275element(27, "br");
        \u0275\u0275elementStart(28, "span", 12);
        \u0275\u0275text(29, "Lecteurs actifs");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(30, "div")(31, "span", 11);
        \u0275\u0275text(32, "15");
        \u0275\u0275elementEnd();
        \u0275\u0275element(33, "br");
        \u0275\u0275elementStart(34, "span", 12);
        \u0275\u0275text(35, "Villes couvertes");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(36, "div", 13)(37, "div", 14)(38, "div", 15);
        \u0275\u0275text(39, "\u{1F4DA}");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(40, "div", 16);
        \u0275\u0275text(41, "\u{1F33F} Savoir Partag\xE9");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(42, "div", 17);
        \u0275\u0275text(43, "\u2B50 Qualit\xE9 africaine");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(44, "p", 18);
        \u0275\u0275text(45, "Lire, c'est grandir. Partager, c'est multiplier");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(46, "section", 19)(47, "div", 20)(48, "div", 21)(49, "div")(50, "h2", 22);
        \u0275\u0275text(51, "\u{1F525} \xC0 la une ");
        \u0275\u0275elementStart(52, "span", 23);
        \u0275\u0275text(53, "Trending");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(54, "p", 24);
        \u0275\u0275text(55, "Les livres les plus populaires cette semaine");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(56, "div", 25)(57, "a", 26);
        \u0275\u0275text(58, "Voir tout \u2192");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(59, "button", 27);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(60, "svg", 8);
        \u0275\u0275element(61, "path", 28);
        \u0275\u0275elementEnd()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(62, "button", 27);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(63, "svg", 8);
        \u0275\u0275element(64, "path", 29);
        \u0275\u0275elementEnd()()()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(65, "div", 30);
        \u0275\u0275repeaterCreate(66, HomeComponent_For_67_Template, 16, 10, "div", 31, _forTrack0);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(68, "p", 32);
        \u0275\u0275text(69, "Plus de ");
        \u0275\u0275elementStart(70, "strong", 33);
        \u0275\u0275text(71, "1000+ livres");
        \u0275\u0275elementEnd();
        \u0275\u0275text(72, " disponibles");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(73, "section", 34)(74, "div", 35)(75, "h3", 36);
        \u0275\u0275text(76, "D\xE9couvrez les");
        \u0275\u0275element(77, "br");
        \u0275\u0275text(78, "livres les plus lus");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(79, "p", 37);
        \u0275\u0275text(80, "Explorez notre s\xE9lection des ouvrages les plus appr\xE9ci\xE9s par notre communaut\xE9 de lecteurs");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(81, "a", 38);
        \u0275\u0275text(82, "Explorer maintenant \u2192");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(83, "div", 35)(84, "h3", 36);
        \u0275\u0275text(85, "Achetez, vendez");
        \u0275\u0275element(86, "br");
        \u0275\u0275text(87, "ou \xE9changez vos");
        \u0275\u0275element(88, "br");
        \u0275\u0275text(89, "livres facilement");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(90, "p", 37);
        \u0275\u0275text(91, "Une plateforme compl\xE8te pour toutes vos transactions de livres en quelques clics seulement");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(92, "a", 38);
        \u0275\u0275text(93, "D\xE9couvrir comment \u2192");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(94, "section", 39)(95, "div", 40)(96, "div", 41);
        \u0275\u0275text(97, "\u{1F9D1}\u200D\u{1F393}");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(98, "div", 1)(99, "h2", 42);
        \u0275\u0275text(100, "Achetez, vendez ou \xE9changez");
        \u0275\u0275element(101, "br");
        \u0275\u0275text(102, "vos livres facilement");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(103, "p", 43);
        \u0275\u0275text(104, "Pouvoir acc\xE9der \xE0 diff\xE9rents livres de divers utilisateurs est b\xE9n\xE9fique. Rejoignez notre communaut\xE9 de passionn\xE9s et partagez la richesse de la connaissance africaine.");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(105, "div", 44)(106, "div", 45);
        \u0275\u0275text(107, "\u{1F4D6} Acheter des livres");
        \u0275\u0275element(108, "br");
        \u0275\u0275elementStart(109, "span", 46);
        \u0275\u0275text(110, "Livres neufs et d'occasion");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(111, "div", 45);
        \u0275\u0275text(112, "\u{1F3F7}\uFE0F Vendre des livres");
        \u0275\u0275element(113, "br");
        \u0275\u0275elementStart(114, "span", 46);
        \u0275\u0275text(115, "Mon\xE9tisez votre collection");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(116, "div", 45);
        \u0275\u0275text(117, "\u{1F504} \xC9changer");
        \u0275\u0275element(118, "br");
        \u0275\u0275elementStart(119, "span", 46);
        \u0275\u0275text(120, "\xC9changez avec la communaut\xE9");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(121, "div", 45);
        \u0275\u0275text(122, "\u{1F4DA} Louer des livres");
        \u0275\u0275element(123, "br");
        \u0275\u0275elementStart(124, "span", 46);
        \u0275\u0275text(125, "Location courte dur\xE9e");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(126, "a", 47);
        \u0275\u0275text(127, "D\xE9couvrir notre plateforme \u2192");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(128, "section", 48)(129, "h2", 49);
        \u0275\u0275text(130, "Livres populaires");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(131, "p", 50);
        \u0275\u0275text(132, "D\xE9couvrez les ouvrages les plus appr\xE9ci\xE9s par notre communaut\xE9 de lecteurs");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(133, "div", 51);
        \u0275\u0275repeaterCreate(134, HomeComponent_For_135_Template, 1, 1, "app-book-card", 52, _forTrack0);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(136, "div", 53)(137, "a", 54);
        \u0275\u0275text(138, "Voir tous les livres \u2192");
        \u0275\u0275elementEnd()()();
        \u0275\u0275element(139, "app-footer");
      }
      if (rf & 2) {
        \u0275\u0275advance(66);
        \u0275\u0275repeater(ctx.trendingBooks);
        \u0275\u0275advance(68);
        \u0275\u0275repeater(ctx.popularBooks);
      }
    }, dependencies: [RouterLink, CommonModule, DecimalPipe, NavbarComponent, FooterComponent, BookCardComponent], encapsulation: 2 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(HomeComponent, { className: "HomeComponent", filePath: "src/app/pages/home/home.component.ts", lineNumber: 14 });
})();
export {
  HomeComponent
};
//# sourceMappingURL=chunk-QFQW5L3M.js.map
