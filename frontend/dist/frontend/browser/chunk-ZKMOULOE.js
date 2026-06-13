import {
  BookCardComponent
} from "./chunk-2CGVFZCM.js";
import {
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-BGEFUUPB.js";
import {
  FooterComponent,
  NavbarComponent
} from "./chunk-RF4AULXN.js";
import {
  CommonModule,
  DecimalPipe,
  NgClass,
  RouterLink,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-DPFWTYZM.js";

// src/app/pages/catalogue/catalogue.component.ts
var _forTrack0 = ($index, $item) => $item.id;
var _c0 = (a0) => ["/books", a0];
function CatalogueComponent_For_63_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 32);
    \u0275\u0275element(1, "img", 47);
    \u0275\u0275elementStart(2, "div", 48);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 49);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div", 50)(7, "span", 51);
    \u0275\u0275text(8);
    \u0275\u0275pipe(9, "number");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "span", 52);
    \u0275\u0275text(11, "Disponible");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const book_r1 = ctx.$implicit;
    \u0275\u0275property("routerLink", \u0275\u0275pureFunction1(8, _c0, book_r1.id));
    \u0275\u0275advance();
    \u0275\u0275property("src", book_r1.images[0].url, \u0275\u0275sanitizeUrl)("alt", book_r1.title);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(book_r1.title);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("par ", book_r1.author, "");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind1(9, 6, book_r1.price), " FCFA");
  }
}
function CatalogueComponent_For_69_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 53);
    \u0275\u0275listener("click", function CatalogueComponent_For_69_Template_button_click_0_listener() {
      const cat_r3 = \u0275\u0275restoreView(_r2).$implicit;
      const ctx_r3 = \u0275\u0275nextContext();
      ctx_r3.selectedCategory = cat_r3;
      return \u0275\u0275resetView(ctx_r3.filter());
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const cat_r3 = ctx.$implicit;
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", ctx_r3.selectedCategory === cat_r3 ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", cat_r3, " ");
  }
}
function CatalogueComponent_Conditional_84_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 46)(1, "div", 54);
    \u0275\u0275text(2, "\u{1F4ED}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "h3", 55);
    \u0275\u0275text(4, "Aucun livre trouv\xE9");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "p", 56);
    \u0275\u0275text(6, "Ce livre n'est pas encore disponible sur Kittab.");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 57)(8, "p", 58);
    \u0275\u0275text(9, "Voulez-vous \xEAtre notifi\xE9 quand ce livre sera disponible ?");
    \u0275\u0275elementEnd();
    \u0275\u0275element(10, "input", 59);
    \u0275\u0275elementStart(11, "button", 60);
    \u0275\u0275text(12, "M'alerter par SMS/WhatsApp");
    \u0275\u0275elementEnd()()();
  }
}
function CatalogueComponent_Conditional_85_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "app-book-card", 62);
  }
  if (rf & 2) {
    const book_r5 = ctx.$implicit;
    \u0275\u0275property("book", book_r5);
  }
}
function CatalogueComponent_Conditional_85_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 61);
    \u0275\u0275repeaterCreate(1, CatalogueComponent_Conditional_85_For_2_Template, 1, 1, "app-book-card", 62, _forTrack0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r3 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r3.filteredBooks);
  }
}
var CatalogueComponent = class _CatalogueComponent {
  constructor() {
    this.searchQuery = "";
    this.selectedCategory = "Tous";
    this.selectedCondition = "";
    this.books = [];
    this.filteredBooks = [];
    this.total = 0;
    this.categories = ["Tous", "Litt\xE9rature", "\xC9ducation", "Sciences", "Histoire", "Technologie", "Art & Culture", "Philosophie", "\xC9conomie"];
  }
  ngOnInit() {
    this.books = this.getMockBooks(12);
    this.filteredBooks = this.books;
    this.total = this.books.length;
  }
  filter() {
    this.filteredBooks = this.books.filter((b) => {
      const matchQ = !this.searchQuery || b.title.toLowerCase().includes(this.searchQuery.toLowerCase()) || b.author.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchCond = !this.selectedCondition || b.condition === this.selectedCondition;
      return matchQ && matchCond;
    });
    this.total = this.filteredBooks.length;
  }
  getMockBooks(count) {
    const data = [
      { t: "Math\xE9matiques Terminale S", a: "Seydou Traor\xE9", p: 12e3, c: "like_new" },
      { t: "L'enfant noir", a: "Camara Laye", p: 8500, c: "good" },
      { t: "Le Monde s'effondre", a: "Chinua Achebe", p: 7500, c: "new" },
      { t: "Histoire G\xE9n\xE9rale de l'Afrique", a: "Joseph Ki-Zerbo", p: 18e3, c: "good" },
      { t: "Une si longue lettre", a: "Mariama B\xE2", p: 6500, c: "fair" },
      { t: "M\xE9decine Traditionnelle Africaine", a: "Dr. Anta Diop", p: 25e3, c: "new" },
      { t: "Introduction \xE0 la Biologie", a: "Prof. Aminata Diallo", p: 15e3, c: "good" },
      { t: "Programmation Python", a: "Ousmane Tall", p: 22e3, c: "new" },
      { t: "Art Contemporain Africain", a: "Fatou Ndiaye", p: 16500, c: "like_new" },
      { t: "Physique-Chimie 1\xE8re S", a: "Dr. Mamadou Fall", p: 9800, c: "good" },
      { t: "Philosophie Africaine", a: "Kwame Nkrumah", p: 13500, c: "good" },
      { t: "\xC9conomie du D\xE9veloppement", a: "Samir Amin", p: 19500, c: "fair" }
    ];
    return Array.from({ length: Math.min(count, data.length) }, (_, i) => ({
      id: i + 1,
      title: data[i].t,
      author: data[i].a,
      price: data[i].p,
      condition: data[i].c,
      book_type: i < 2 ? "textbook" : "novel",
      images: [{ url: `https://picsum.photos/seed/cat${i + 10}/300/400`, is_primary: true }],
      seller: { first_name: "Vendeur", last_name: `${i + 1}`, phone: "+224000000000", address: ["Dakar, S\xE9n\xE9gal", "Conakry", "Bamako", "Ouagadougou"][i % 4] },
      is_available: true
    }));
  }
  static {
    this.\u0275fac = function CatalogueComponent_Factory(t) {
      return new (t || _CatalogueComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _CatalogueComponent, selectors: [["app-catalogue"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 87, vars: 4, consts: [[1, "bg-gray-50", "py-12"], [1, "max-w-7xl", "mx-auto", "px-6", "flex", "flex-col", "md:flex-row", "items-center", "gap-10"], [1, "flex-1"], [1, "text-4xl", "font-bold", "text-gray-900", "mb-3"], [1, "text-primary"], [1, "text-gray-500", "text-sm", "mb-6", "max-w-md"], [1, "flex", "items-center", "bg-white", "border", "border-gray-200", "rounded-full", "px-4", "py-3", "max-w-md", "shadow-sm"], ["fill", "none", "viewBox", "0 0 24 24", "stroke", "currentColor", 1, "h-4", "w-4", "text-gray-400", "mr-2"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"], ["type", "text", "placeholder", "Rechercher par titre, auteur, genre...", 1, "flex-1", "bg-transparent", "text-sm", "outline-none", "text-gray-700", 3, "ngModelChange", "ngModel"], [1, "bg-primary", "text-white", "rounded-full", "p-1.5", "ml-2"], ["fill", "none", "viewBox", "0 0 24 24", "stroke", "currentColor", 1, "h-3.5", "w-3.5"], [1, "flex", "gap-6", "mt-6", "text-sm"], [1, "font-bold", "text-gray-900"], [1, "text-gray-400", "text-xs"], [1, "text-amber-500"], [1, "hidden", "md:flex", "flex-1", "justify-end"], [1, "bg-white", "rounded-3xl", "p-6", "shadow-md", "text-center"], [1, "text-6xl", "mb-2"], [1, "text-sm", "text-gray-500", "font-medium"], [1, "text-xs", "text-gray-400"], [1, "max-w-7xl", "mx-auto", "px-6", "py-8"], [1, "flex", "items-center", "justify-between", "mb-4"], [1, "font-bold", "text-xl", "text-gray-900", "flex", "items-center", "gap-2"], [1, "w-1", "h-5", "bg-primary", "rounded", "inline-block"], [1, "text-gray-400", "text-sm"], [1, "flex", "gap-2"], [1, "bg-gray-100", "hover:bg-gray-200", "rounded-full", "p-1.5", "transition-colors"], ["fill", "none", "viewBox", "0 0 24 24", "stroke", "currentColor", 1, "h-4", "w-4"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M15 19l-7-7 7-7"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M9 5l7 7-7 7"], [1, "flex", "gap-4", "overflow-x-auto", "pb-2"], [1, "flex-shrink-0", "w-44", "card", "p-3", "cursor-pointer", "hover:shadow-md", "transition-shadow", 3, "routerLink"], [1, "max-w-7xl", "mx-auto", "px-6", "mb-6"], [1, "text-sm", "text-gray-500", "mb-3"], [1, "flex", "gap-2", "flex-wrap", "items-center"], [1, "px-4", "py-1.5", "rounded-full", "text-sm", "font-medium", "transition-colors", 3, "ngClass"], [1, "ml-auto", "flex", "items-center", "gap-2"], [1, "flex", "items-center", "gap-1", "border", "border-gray-200", "rounded-lg", "px-3", "py-1.5", "text-sm", "text-gray-600", "hover:border-primary"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"], [1, "border", "border-gray-200", "rounded-lg", "p-1.5", "hover:border-primary"], ["fill", "none", "viewBox", "0 0 24 24", "stroke", "currentColor", 1, "h-4", "w-4", "text-gray-500"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M4 6h16M4 10h16M4 14h16M4 18h16"], [1, "max-w-7xl", "mx-auto", "px-6", "pb-16"], [1, "font-bold", "text-xl", "text-gray-900"], [1, "text-sm", "text-gray-400"], [1, "text-center", "py-20"], [1, "w-full", "h-32", "object-cover", "rounded-lg", "mb-2", 3, "src", "alt"], [1, "text-xs", "font-semibold", "text-gray-800", "truncate"], [1, "text-xs", "text-gray-500", "truncate"], [1, "flex", "items-center", "justify-between", "mt-2"], [1, "text-primary", "font-bold", "text-xs"], [1, "bg-green-100", "text-green-700", "text-xs", "px-1.5", "py-0.5", "rounded-full"], [1, "px-4", "py-1.5", "rounded-full", "text-sm", "font-medium", "transition-colors", 3, "click", "ngClass"], [1, "text-6xl", "mb-4"], [1, "font-semibold", "text-gray-700", "text-lg", "mb-2"], [1, "text-gray-400", "text-sm", "mb-6"], [1, "card", "max-w-sm", "mx-auto", "p-6"], [1, "text-sm", "text-gray-600", "mb-3"], ["type", "tel", "placeholder", "Votre num\xE9ro WhatsApp", 1, "w-full", "border", "border-gray-200", "rounded-xl", "px-4", "py-2.5", "text-sm", "mb-3", "focus:outline-none", "focus:border-primary"], [1, "btn-primary", "w-full"], [1, "grid", "grid-cols-1", "sm:grid-cols-2", "md:grid-cols-3", "lg:grid-cols-4", "gap-5"], [3, "book"]], template: function CatalogueComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275element(0, "app-navbar");
        \u0275\u0275elementStart(1, "section", 0)(2, "div", 1)(3, "div", 2)(4, "h1", 3);
        \u0275\u0275text(5, "Explorez notre ");
        \u0275\u0275elementStart(6, "span", 4);
        \u0275\u0275text(7, "collection");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(8, "p", 5);
        \u0275\u0275text(9, "D\xE9couvrez plus de 1000 livres de qualit\xE9 dans toutes les cat\xE9gories. De la litt\xE9rature africaine aux manuels scolaires, trouvez le savoir qui vous correspond.");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(10, "div", 6);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(11, "svg", 7);
        \u0275\u0275element(12, "path", 8);
        \u0275\u0275elementEnd();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(13, "input", 9);
        \u0275\u0275twoWayListener("ngModelChange", function CatalogueComponent_Template_input_ngModelChange_13_listener($event) {
          \u0275\u0275twoWayBindingSet(ctx.searchQuery, $event) || (ctx.searchQuery = $event);
          return $event;
        });
        \u0275\u0275listener("ngModelChange", function CatalogueComponent_Template_input_ngModelChange_13_listener() {
          return ctx.filter();
        });
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(14, "button", 10);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(15, "svg", 11);
        \u0275\u0275element(16, "path", 8);
        \u0275\u0275elementEnd()()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(17, "div", 12)(18, "div")(19, "span", 13);
        \u0275\u0275text(20, "12");
        \u0275\u0275elementEnd();
        \u0275\u0275element(21, "br");
        \u0275\u0275elementStart(22, "span", 14);
        \u0275\u0275text(23, "Livres disponibles");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(24, "div")(25, "span", 13);
        \u0275\u0275text(26, "25+");
        \u0275\u0275elementEnd();
        \u0275\u0275element(27, "br");
        \u0275\u0275elementStart(28, "span", 14);
        \u0275\u0275text(29, "Genres");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(30, "div")(31, "span", 15);
        \u0275\u0275text(32, "\u2B21");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(33, "span", 13);
        \u0275\u0275text(34, "15");
        \u0275\u0275elementEnd();
        \u0275\u0275element(35, "br");
        \u0275\u0275elementStart(36, "span", 14);
        \u0275\u0275text(37, "Villes");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(38, "div", 16)(39, "div", 17)(40, "div", 18);
        \u0275\u0275text(41, "\u{1F4DA}");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(42, "div", 19);
        \u0275\u0275text(43, "Explorez, D\xE9couvrez");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(44, "div", 20);
        \u0275\u0275text(45, "La connaissance \xE0 port\xE9e de clic");
        \u0275\u0275elementEnd()()()()();
        \u0275\u0275elementStart(46, "section", 21)(47, "div", 22)(48, "div")(49, "h2", 23);
        \u0275\u0275element(50, "span", 24);
        \u0275\u0275text(51, " \xC0 la une");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(52, "p", 25);
        \u0275\u0275text(53, "Notre s\xE9lection de livres populaires et recommand\xE9s");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(54, "div", 26)(55, "button", 27);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(56, "svg", 28);
        \u0275\u0275element(57, "path", 29);
        \u0275\u0275elementEnd()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(58, "button", 27);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(59, "svg", 28);
        \u0275\u0275element(60, "path", 30);
        \u0275\u0275elementEnd()()()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(61, "div", 31);
        \u0275\u0275repeaterCreate(62, CatalogueComponent_For_63_Template, 12, 10, "div", 32, _forTrack0);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(64, "section", 33)(65, "p", 34);
        \u0275\u0275text(66);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(67, "div", 35);
        \u0275\u0275repeaterCreate(68, CatalogueComponent_For_69_Template, 2, 2, "button", 36, \u0275\u0275repeaterTrackByIdentity);
        \u0275\u0275elementStart(70, "div", 37)(71, "button", 38);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(72, "svg", 28);
        \u0275\u0275element(73, "path", 39);
        \u0275\u0275elementEnd();
        \u0275\u0275text(74, " Filtres ");
        \u0275\u0275elementEnd();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(75, "button", 40);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(76, "svg", 41);
        \u0275\u0275element(77, "path", 42);
        \u0275\u0275elementEnd()()()()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(78, "section", 43)(79, "div", 22)(80, "h2", 44);
        \u0275\u0275text(81, "Tous les livres");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(82, "span", 45);
        \u0275\u0275text(83);
        \u0275\u0275elementEnd()();
        \u0275\u0275template(84, CatalogueComponent_Conditional_84_Template, 13, 0, "div", 46)(85, CatalogueComponent_Conditional_85_Template, 3, 0);
        \u0275\u0275elementEnd();
        \u0275\u0275element(86, "app-footer");
      }
      if (rf & 2) {
        \u0275\u0275advance(13);
        \u0275\u0275twoWayProperty("ngModel", ctx.searchQuery);
        \u0275\u0275advance(49);
        \u0275\u0275repeater(ctx.filteredBooks.slice(0, 6));
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate1("", ctx.total, " livres");
        \u0275\u0275advance(2);
        \u0275\u0275repeater(ctx.categories);
        \u0275\u0275advance(15);
        \u0275\u0275textInterpolate1("", ctx.total, " r\xE9sultats");
        \u0275\u0275advance();
        \u0275\u0275conditional(84, ctx.filteredBooks.length === 0 ? 84 : 85);
      }
    }, dependencies: [RouterLink, CommonModule, NgClass, DecimalPipe, FormsModule, DefaultValueAccessor, NgControlStatus, NgModel, NavbarComponent, FooterComponent, BookCardComponent], encapsulation: 2 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(CatalogueComponent, { className: "CatalogueComponent", filePath: "src/app/pages/catalogue/catalogue.component.ts", lineNumber: 15 });
})();
export {
  CatalogueComponent
};
//# sourceMappingURL=chunk-ZKMOULOE.js.map
