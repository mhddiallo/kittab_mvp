import {
  RouterLink,
  RouterLinkActive,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵtext
} from "./chunk-DPFWTYZM.js";

// src/app/components/navbar/navbar.component.ts
var _c0 = () => ({ exact: true });
var NavbarComponent = class _NavbarComponent {
  static {
    this.\u0275fac = function NavbarComponent_Factory(t) {
      return new (t || _NavbarComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _NavbarComponent, selectors: [["app-navbar"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 26, vars: 2, consts: [[1, "bg-white", "border-b", "border-gray-100", "sticky", "top-0", "z-50"], [1, "max-w-7xl", "mx-auto", "px-6", "flex", "items-center", "justify-between", "h-16"], ["routerLink", "/", 1, "flex", "items-center", "gap-1", "font-bold", "text-xl", "text-gray-900"], [1, "text-primary", "text-2xl"], [1, "hidden", "md:flex", "items-center", "gap-7", "text-sm", "font-medium", "text-gray-600"], ["routerLink", "/", "routerLinkActive", "!text-primary", 1, "hover:text-primary", "transition-colors", 3, "routerLinkActiveOptions"], ["routerLink", "/catalogue", "routerLinkActive", "!text-primary", 1, "hover:text-primary", "transition-colors"], ["href", "#", 1, "hover:text-primary", "transition-colors"], [1, "flex", "items-center", "gap-4"], [1, "text-sm", "font-medium", "text-gray-500", "hidden", "md:block"], [1, "text-gray-500", "hover:text-primary", "transition-colors"], ["fill", "none", "viewBox", "0 0 24 24", "stroke", "currentColor", 1, "h-5", "w-5"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"], ["routerLink", "/login", 1, "btn-primary"]], template: function NavbarComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "nav", 0)(1, "div", 1)(2, "a", 2)(3, "span", 3);
        \u0275\u0275text(4, "\u{1F4DA}");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "span");
        \u0275\u0275text(6, "KITTAB");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(7, "div", 4)(8, "a", 5);
        \u0275\u0275text(9, "Accueil");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(10, "a", 6);
        \u0275\u0275text(11, "Catalogue");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(12, "a", 7);
        \u0275\u0275text(13, "Comment \xE7a marche");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(14, "a", 7);
        \u0275\u0275text(15, "Contactez-nous");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(16, "a", 7);
        \u0275\u0275text(17, "Communaut\xE9");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(18, "div", 8)(19, "span", 9);
        \u0275\u0275text(20, "FR");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(21, "button", 10);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(22, "svg", 11);
        \u0275\u0275element(23, "path", 12);
        \u0275\u0275elementEnd()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(24, "a", 13);
        \u0275\u0275text(25, "Se connecter");
        \u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(8);
        \u0275\u0275property("routerLinkActiveOptions", \u0275\u0275pureFunction0(1, _c0));
      }
    }, dependencies: [RouterLink, RouterLinkActive], encapsulation: 2 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(NavbarComponent, { className: "NavbarComponent", filePath: "src/app/components/navbar/navbar.component.ts", lineNumber: 10 });
})();

// src/app/components/footer/footer.component.ts
var FooterComponent = class _FooterComponent {
  static {
    this.\u0275fac = function FooterComponent_Factory(t) {
      return new (t || _FooterComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FooterComponent, selectors: [["app-footer"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 53, vars: 0, consts: [[1, "bg-white", "border-t", "border-gray-100", "pt-12", "pb-6", "mt-16"], [1, "max-w-7xl", "mx-auto", "px-6"], [1, "grid", "grid-cols-1", "md:grid-cols-4", "gap-8", "mb-10"], [1, "flex", "items-center", "gap-1", "font-bold", "text-lg", "mb-3"], [1, "text-primary"], [1, "text-sm", "text-gray-500", "leading-relaxed"], [1, "font-semibold", "text-sm", "mb-4", "text-gray-800"], [1, "space-y-2", "text-sm", "text-gray-500"], ["href", "#", 1, "hover:text-primary", "transition-colors"], [1, "text-sm", "text-gray-500", "mb-3"], [1, "flex", "flex-col", "gap-2"], ["type", "email", "placeholder", "Entrez votre adresse email", 1, "border", "border-gray-200", "rounded-lg", "px-3", "py-2", "text-sm", "focus:outline-none", "focus:border-primary"], [1, "btn-primary", "w-full", "text-center"], [1, "border-t", "border-gray-100", "pt-4", "text-center", "text-xs", "text-gray-400"]], template: function FooterComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "footer", 0)(1, "div", 1)(2, "div", 2)(3, "div")(4, "div", 3)(5, "span", 4);
        \u0275\u0275text(6, "\u{1F4DA}");
        \u0275\u0275elementEnd();
        \u0275\u0275text(7, " KITTAB ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(8, "p", 5);
        \u0275\u0275text(9, "KITTAB vous donne acc\xE8s \xE0 une biblioth\xE8que de livres \xE0 acheter et louer, directement depuis votre communaut\xE9 locale.");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(10, "div")(11, "h4", 6);
        \u0275\u0275text(12, "ENTREPRISE");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "ul", 7)(14, "li")(15, "a", 8);
        \u0275\u0275text(16, "\xC0 propos");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(17, "li")(18, "a", 8);
        \u0275\u0275text(19, "Fonctionnalit\xE9s");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(20, "li")(21, "a", 8);
        \u0275\u0275text(22, "Comment \xE7a marche");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(23, "li")(24, "a", 8);
        \u0275\u0275text(25, "Communaut\xE9");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(26, "div")(27, "h4", 6);
        \u0275\u0275text(28, "AIDE");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(29, "ul", 7)(30, "li")(31, "a", 8);
        \u0275\u0275text(32, "Support client");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(33, "li")(34, "a", 8);
        \u0275\u0275text(35, "Abonnements");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(36, "li")(37, "a", 8);
        \u0275\u0275text(38, "Conditions d'utilisation");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(39, "li")(40, "a", 8);
        \u0275\u0275text(41, "Politique de confidentialit\xE9");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(42, "div")(43, "h4", 6);
        \u0275\u0275text(44, "NEWSLETTER");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(45, "p", 9);
        \u0275\u0275text(46, "Restez inform\xE9 des nouveaut\xE9s.");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(47, "div", 10);
        \u0275\u0275element(48, "input", 11);
        \u0275\u0275elementStart(49, "button", 12);
        \u0275\u0275text(50, "S'abonner");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(51, "div", 13);
        \u0275\u0275text(52, " \xA9 2024 KITTAB. Tous droits r\xE9serv\xE9s. ");
        \u0275\u0275elementEnd()()();
      }
    }, encapsulation: 2 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FooterComponent, { className: "FooterComponent", filePath: "src/app/components/footer/footer.component.ts", lineNumber: 9 });
})();

export {
  NavbarComponent,
  FooterComponent
};
//# sourceMappingURL=chunk-RF4AULXN.js.map
