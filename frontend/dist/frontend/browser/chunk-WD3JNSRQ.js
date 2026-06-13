import {
  FooterComponent,
  NavbarComponent
} from "./chunk-RF4AULXN.js";
import {
  ActivatedRoute,
  CommonModule,
  DecimalPipe,
  NgClass,
  RouterLink,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
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
  ɵɵtextInterpolate2
} from "./chunk-DPFWTYZM.js";

// src/app/pages/book-detail/book-detail.component.ts
function BookDetailComponent_Conditional_1_Conditional_27_For_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 51);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const tag_r3 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(tag_r3);
  }
}
function BookDetailComponent_Conditional_1_Conditional_27_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h3", 60);
    \u0275\u0275text(1, "\u{1F4D6} \xC0 propos de ce livre");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "p", 61);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div", 62);
    \u0275\u0275repeaterCreate(5, BookDetailComponent_Conditional_1_Conditional_27_For_6_Template, 2, 1, "span", 51, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 63)(8, "div")(9, "div", 64);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "div", 30);
    \u0275\u0275text(12, "Vues");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(13, "div")(14, "div", 64);
    \u0275\u0275text(15);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "div", 30);
    \u0275\u0275text(17, "Favoris");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(18, "div")(19, "div", 64);
    \u0275\u0275text(20);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(21, "div", 30);
    \u0275\u0275text(22, "Demandes");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ctx_r1.book.description);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r1.book.tags);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r1.book.views);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r1.book.favorites);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r1.book.requests);
  }
}
function BookDetailComponent_Conditional_1_Conditional_28_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 65)(1, "dt", 66);
    \u0275\u0275text(2, "ISBN");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "dd", 67);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r1.book.isbn);
  }
}
function BookDetailComponent_Conditional_1_Conditional_28_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 65)(1, "dt", 66);
    \u0275\u0275text(2, "Niveau");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "dd", 67);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r1.book.education_level);
  }
}
function BookDetailComponent_Conditional_1_Conditional_28_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 65)(1, "dt", 66);
    \u0275\u0275text(2, "Mati\xE8re");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "dd", 67);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r1.book.subject);
  }
}
function BookDetailComponent_Conditional_1_Conditional_28_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "dl", 17)(1, "div", 65)(2, "dt", 66);
    \u0275\u0275text(3, "Titre");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "dd", 67);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 65)(7, "dt", 66);
    \u0275\u0275text(8, "Auteur");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "dd", 67);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()();
    \u0275\u0275template(11, BookDetailComponent_Conditional_1_Conditional_28_Conditional_11_Template, 5, 1, "div", 65)(12, BookDetailComponent_Conditional_1_Conditional_28_Conditional_12_Template, 5, 1, "div", 65)(13, BookDetailComponent_Conditional_1_Conditional_28_Conditional_13_Template, 5, 1, "div", 65);
    \u0275\u0275elementStart(14, "div", 65)(15, "dt", 66);
    \u0275\u0275text(16, "\xC9tat");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(17, "dd")(18, "span", 68);
    \u0275\u0275text(19);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r1.book.title);
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate(ctx_r1.book.author);
    \u0275\u0275advance();
    \u0275\u0275conditional(11, ctx_r1.book.isbn ? 11 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(12, ctx_r1.book.education_level ? 12 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(13, ctx_r1.book.subject ? 13 : -1);
    \u0275\u0275advance(5);
    \u0275\u0275property("ngClass", ctx_r1.conditionClass);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.book.conditionLabel);
  }
}
function BookDetailComponent_Conditional_1_Conditional_29_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 18);
    \u0275\u0275text(1, "Les avis seront disponibles prochainement.");
    \u0275\u0275elementEnd();
  }
}
function BookDetailComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 0)(1, "a", 1);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(2, "svg", 2);
    \u0275\u0275element(3, "path", 3);
    \u0275\u0275elementEnd();
    \u0275\u0275text(4, " Retour au catalogue ");
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(5, "div", 4)(6, "div", 5)(7, "div", 6)(8, "span", 7);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "div", 8)(11, "button", 9);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(12, "svg", 2);
    \u0275\u0275element(13, "path", 10);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(14, "button", 9);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(15, "svg", 2);
    \u0275\u0275element(16, "path", 11);
    \u0275\u0275elementEnd()()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275element(17, "img", 12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "div", 13)(19, "div", 14)(20, "button", 15);
    \u0275\u0275listener("click", function BookDetailComponent_Conditional_1_Template_button_click_20_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.activeTab = "description");
    });
    \u0275\u0275text(21, "Description");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "button", 15);
    \u0275\u0275listener("click", function BookDetailComponent_Conditional_1_Template_button_click_22_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.activeTab = "details");
    });
    \u0275\u0275text(23, "D\xE9tails");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(24, "button", 15);
    \u0275\u0275listener("click", function BookDetailComponent_Conditional_1_Template_button_click_24_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.activeTab = "avis");
    });
    \u0275\u0275text(25);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(26, "div", 16);
    \u0275\u0275template(27, BookDetailComponent_Conditional_1_Conditional_27_Template, 23, 4)(28, BookDetailComponent_Conditional_1_Conditional_28_Template, 20, 7, "dl", 17)(29, BookDetailComponent_Conditional_1_Conditional_29_Template, 2, 0, "p", 18);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(30, "div", 19)(31, "h1", 20);
    \u0275\u0275text(32);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(33, "p", 21);
    \u0275\u0275text(34);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(35, "div", 22)(36, "span", 23);
    \u0275\u0275text(37, "\u2605\u2605\u2605\u2605\u2606");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(38, "span", 24);
    \u0275\u0275text(39);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(40, "div", 25);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(41, "svg", 26);
    \u0275\u0275element(42, "path", 27);
    \u0275\u0275elementEnd();
    \u0275\u0275text(43);
    \u0275\u0275elementEnd();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(44, "div", 28)(45, "div", 29);
    \u0275\u0275text(46);
    \u0275\u0275pipe(47, "number");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(48, "div", 30);
    \u0275\u0275text(49, "Prix d'achat");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(50, "div", 31);
    \u0275\u0275element(51, "span", 32);
    \u0275\u0275elementStart(52, "span", 33);
    \u0275\u0275text(53, "Disponible");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(54, "div", 34)(55, "div", 35)(56, "h3", 36);
    \u0275\u0275text(57, "Vendeur");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(58, "div", 37)(59, "div", 38);
    \u0275\u0275text(60);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(61, "div")(62, "p", 39);
    \u0275\u0275text(63);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(64, "div", 40);
    \u0275\u0275text(65);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(66, "span", 41);
    \u0275\u0275text(67, "\u2713");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(68, "div", 42)(69, "div")(70, "span", 43);
    \u0275\u0275text(71, "Membre depuis");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(72, "span", 44);
    \u0275\u0275text(73);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(74, "div")(75, "span", 43);
    \u0275\u0275text(76, "Temps de r\xE9ponse");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(77, "span", 44);
    \u0275\u0275text(78, "~1h");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(79, "div")(80, "span", 43);
    \u0275\u0275text(81, "Livres en vente");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(82, "span", 44);
    \u0275\u0275text(83);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(84, "div")(85, "span", 43);
    \u0275\u0275text(86, "Taux de r\xE9ponse");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(87, "span", 44);
    \u0275\u0275text(88, "98%");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(89, "div", 45)(90, "p", 46);
    \u0275\u0275text(91, "Localisation");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(92, "p", 47);
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(93, "svg", 26);
    \u0275\u0275element(94, "path", 27);
    \u0275\u0275elementEnd();
    \u0275\u0275text(95);
    \u0275\u0275elementEnd()();
    \u0275\u0275namespaceHTML();
    \u0275\u0275elementStart(96, "div", 48)(97, "p", 49);
    \u0275\u0275text(98, "Pr\xE9f\xE9rences de contact");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(99, "div", 50)(100, "span", 51);
    \u0275\u0275text(101, "\u{1F4AC} WhatsApp");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(102, "span", 51);
    \u0275\u0275text(103, "\u{1F4DE} Appel");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(104, "button", 52);
    \u0275\u0275listener("click", function BookDetailComponent_Conditional_1_Template_button_click_104_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.openWhatsApp());
    });
    \u0275\u0275text(105, " \u{1F4AC} Contacter le vendeur ");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(106, "p", 53);
    \u0275\u0275text(107, "Les transactions s'effectuent directement entre vous et le vendeur");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(108, "div", 54)(109, "h3", 55);
    \u0275\u0275text(110, "\u{1F512} S\xE9curit\xE9 KITTAB");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(111, "ul", 56)(112, "li", 57)(113, "span", 58);
    \u0275\u0275text(114, "\u2713");
    \u0275\u0275elementEnd();
    \u0275\u0275text(115, " Vendeur v\xE9rifi\xE9");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(116, "li", 57)(117, "span", 59);
    \u0275\u0275text(118, "\u2139");
    \u0275\u0275elementEnd();
    \u0275\u0275text(119, " Rencontre en lieu public conseill\xE9e");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(120, "li", 57)(121, "span", 58);
    \u0275\u0275text(122, "\u2713");
    \u0275\u0275elementEnd();
    \u0275\u0275text(123, " Garantie Kittab");
    \u0275\u0275elementEnd()()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(8);
    \u0275\u0275property("ngClass", ctx_r1.conditionClass);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.book.conditionLabel);
    \u0275\u0275advance(8);
    \u0275\u0275property("src", ctx_r1.book.images[0].url, \u0275\u0275sanitizeUrl)("alt", ctx_r1.book.title);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngClass", ctx_r1.activeTab === "description" ? "bg-primary text-white" : "text-gray-600 hover:text-primary");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", ctx_r1.activeTab === "details" ? "bg-primary text-white" : "text-gray-600 hover:text-primary");
    \u0275\u0275advance(2);
    \u0275\u0275property("ngClass", ctx_r1.activeTab === "avis" ? "bg-primary text-white" : "text-gray-600 hover:text-primary");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1("Avis (", ctx_r1.book.reviews, ")");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(27, ctx_r1.activeTab === "description" ? 27 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(28, ctx_r1.activeTab === "details" ? 28 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(29, ctx_r1.activeTab === "avis" ? 29 : -1);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ctx_r1.book.title);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("par ", ctx_r1.book.author, "");
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate2("", ctx_r1.book.rating, " (", ctx_r1.book.reviews, " avis)");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate1(" ", ctx_r1.book.seller.address, " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind1(47, 25, ctx_r1.book.price), " FCFA");
    \u0275\u0275advance(14);
    \u0275\u0275textInterpolate1(" ", ctx_r1.book.seller.first_name[0], " ");
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", ctx_r1.book.seller.first_name, " ", ctx_r1.book.seller.last_name, "");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2("\u2605 ", ctx_r1.book.seller.rating, " \u2022 ", ctx_r1.book.seller.reviews, " avis");
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate(ctx_r1.book.seller.member_since);
    \u0275\u0275advance(10);
    \u0275\u0275textInterpolate(ctx_r1.book.seller.books_sold);
    \u0275\u0275advance(12);
    \u0275\u0275textInterpolate1(" ", ctx_r1.book.seller.address, " ");
  }
}
var BookDetailComponent = class _BookDetailComponent {
  constructor(route) {
    this.route = route;
    this.activeTab = "description";
    this.book = null;
  }
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get("id");
    this.book = {
      id,
      title: "Math\xE9matiques Terminale S",
      author: "Seydou Traor\xE9",
      price: 12e3,
      condition: "like_new",
      conditionLabel: "Bon \xE9tat",
      book_type: "textbook",
      education_level: "Terminale",
      subject: "Math\xE9matiques",
      description: "Manuel complet de math\xE9matiques pour la classe de Terminale S, conforme au programme s\xE9n\xE9galais. Contient de nombreux exercices corrig\xE9s et des annales du baccalaur\xE9at.",
      isbn: "978-2-01-135467-3",
      images: [{ url: `https://picsum.photos/seed/detail${id}/600/800`, is_primary: true }],
      seller: { id: 1, first_name: "Fatou", last_name: "Seck", phone: "+221 77 123 45 67", address: "Dakar, S\xE9n\xE9gal", rating: 4.9, reviews: 98, books_sold: 67, member_since: "septembre 2021" },
      rating: 4.7,
      reviews: 3,
      views: 892,
      favorites: 156,
      requests: 67,
      is_available: true,
      tags: ["\xC9ducation", "Fran\xE7ais"]
    };
  }
  get conditionClass() {
    const map = { new: "bg-green-100 text-green-700", like_new: "bg-blue-100 text-blue-700", good: "bg-amber-100 text-amber-700", fair: "bg-gray-100 text-gray-600" };
    return map[this.book.condition] || "bg-gray-100 text-gray-600";
  }
  openWhatsApp() {
    const msg = encodeURIComponent(`Bonjour, je suis int\xE9ress\xE9 par votre livre "${this.book.title}" sur Kittab.`);
    window.open(`https://wa.me/${this.book.seller.phone.replace(/\s/g, "")}?text=${msg}`, "_blank");
  }
  static {
    this.\u0275fac = function BookDetailComponent_Factory(t) {
      return new (t || _BookDetailComponent)(\u0275\u0275directiveInject(ActivatedRoute));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _BookDetailComponent, selectors: [["app-book-detail"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 3, vars: 1, consts: [[1, "max-w-7xl", "mx-auto", "px-6", "py-8"], ["routerLink", "/catalogue", 1, "flex", "items-center", "gap-1", "text-sm", "text-gray-500", "hover:text-primary", "mb-6", "transition-colors"], ["fill", "none", "viewBox", "0 0 24 24", "stroke", "currentColor", 1, "h-4", "w-4"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M15 19l-7-7 7-7"], [1, "flex", "flex-col", "lg:flex-row", "gap-8"], [1, "flex-1"], [1, "card", "p-4", "mb-6", "relative"], [1, "absolute", "top-6", "left-6", "badge", 3, "ngClass"], [1, "absolute", "top-6", "right-6", "flex", "flex-col", "gap-2"], [1, "bg-white", "shadow", "rounded-full", "p-2", "hover:text-primary", "transition-colors"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"], [1, "w-full", "h-80", "object-cover", "rounded-xl", 3, "src", "alt"], [1, "card", "overflow-hidden"], [1, "flex", "border-b", "border-gray-100"], [1, "flex-1", "py-3", "text-sm", "font-medium", "transition-colors", 3, "click", "ngClass"], [1, "p-6"], [1, "space-y-3", "text-sm"], [1, "text-gray-400", "text-sm", "text-center", "py-8"], [1, "lg:w-80", "xl:w-96"], [1, "text-2xl", "font-bold", "text-gray-900", "mb-1"], [1, "text-gray-500", "text-sm", "mb-3"], [1, "flex", "items-center", "gap-2", "mb-2"], [1, "text-yellow-400", "text-sm"], [1, "text-sm", "text-gray-500"], [1, "flex", "items-center", "gap-1", "text-xs", "text-gray-400", "mb-5"], ["fill", "none", "viewBox", "0 0 24 24", "stroke", "currentColor", 1, "h-3", "w-3"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"], [1, "bg-red-50", "border", "border-red-100", "rounded-2xl", "p-5", "mb-5"], [1, "text-3xl", "font-bold", "text-primary", "mb-1"], [1, "text-xs", "text-gray-400"], [1, "flex", "items-center", "gap-2", "mb-6"], [1, "h-2", "w-2", "bg-green-500", "rounded-full"], [1, "text-sm", "text-green-600", "font-medium"], [1, "lg:w-72"], [1, "card", "p-5", "mb-4"], [1, "font-semibold", "text-sm", "text-gray-700", "mb-4"], [1, "flex", "items-center", "gap-3", "mb-4"], [1, "h-10", "w-10", "bg-primary/20", "rounded-full", "flex", "items-center", "justify-center", "font-bold", "text-primary"], [1, "font-semibold", "text-sm", "text-gray-900"], [1, "flex", "items-center", "gap-1", "text-xs", "text-yellow-500"], [1, "ml-auto", "text-green-500"], [1, "grid", "grid-cols-2", "gap-3", "text-xs", "text-gray-500", "border-t", "border-gray-50", "pt-4", "mb-4"], [1, "block", "text-gray-400"], [1, "font-medium", "text-gray-700"], [1, "border-t", "border-gray-50", "pt-4", "mb-4"], [1, "text-xs", "text-gray-400", "mb-1"], [1, "text-sm", "text-gray-700", "flex", "items-center", "gap-1"], [1, "border-t", "border-gray-50", "pt-4", "mb-5"], [1, "text-xs", "text-gray-400", "mb-2"], [1, "flex", "gap-2"], [1, "bg-gray-100", "text-gray-600", "text-xs", "px-3", "py-1", "rounded-full"], [1, "w-full", "bg-primary", "text-white", "rounded-xl", "py-3", "text-sm", "font-semibold", "hover:bg-primary-dark", "transition-colors", "flex", "items-center", "justify-center", "gap-2", 3, "click"], [1, "text-xs", "text-gray-400", "text-center", "mt-2"], [1, "card", "p-5"], [1, "font-semibold", "text-sm", "text-gray-700", "mb-3", "flex", "items-center", "gap-2"], [1, "space-y-2", "text-xs", "text-gray-600"], [1, "flex", "items-center", "gap-2"], [1, "text-green-500"], [1, "text-blue-500"], [1, "font-semibold", "text-gray-800", "mb-3", "flex", "items-center", "gap-2"], [1, "text-sm", "text-gray-600", "leading-relaxed", "mb-4"], [1, "flex", "gap-2", "flex-wrap", "mb-6"], [1, "grid", "grid-cols-3", "gap-4", "text-center", "border-t", "border-gray-50", "pt-4"], [1, "font-bold", "text-primary", "text-xl"], [1, "flex", "justify-between"], [1, "text-gray-400"], [1, "font-medium", "text-gray-800"], [1, "badge", 3, "ngClass"]], template: function BookDetailComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275element(0, "app-navbar");
        \u0275\u0275template(1, BookDetailComponent_Conditional_1_Template, 124, 27, "div", 0);
        \u0275\u0275element(2, "app-footer");
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275conditional(1, ctx.book ? 1 : -1);
      }
    }, dependencies: [RouterLink, CommonModule, NgClass, DecimalPipe, NavbarComponent, FooterComponent], encapsulation: 2 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(BookDetailComponent, { className: "BookDetailComponent", filePath: "src/app/pages/book-detail/book-detail.component.ts", lineNumber: 13 });
})();
export {
  BookDetailComponent
};
//# sourceMappingURL=chunk-WD3JNSRQ.js.map
