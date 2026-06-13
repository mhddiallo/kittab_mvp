import {
  CommonModule,
  DecimalPipe,
  NgClass,
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
  ɵɵsanitizeUrl,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-DPFWTYZM.js";

// src/app/components/book-card/book-card.component.ts
var _c0 = (a0) => ["/books", a0];
var BookCardComponent = class _BookCardComponent {
  get conditionLabel() {
    const map = { new: "Neuf", like_new: "Tr\xE8s bon", good: "Bon \xE9tat", fair: "Correct" };
    return map[this.book.condition] || this.book.condition;
  }
  get conditionClass() {
    const map = {
      new: "bg-green-100 text-green-700",
      like_new: "bg-blue-100 text-blue-700",
      good: "bg-amber-100 text-amber-700",
      fair: "bg-gray-100 text-gray-600"
    };
    return map[this.book.condition] || "bg-gray-100 text-gray-600";
  }
  get primaryImage() {
    const img = this.book.images?.find((i) => i.is_primary) || this.book.images?.[0];
    return img?.url || "/assets/book-placeholder.svg";
  }
  static {
    this.\u0275fac = function BookCardComponent_Factory(t) {
      return new (t || _BookCardComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _BookCardComponent, selectors: [["app-book-card"]], inputs: { book: "book" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 23, vars: 16, consts: [[1, "card", "block", "overflow-hidden", "hover:shadow-md", "transition-shadow", "group", "cursor-pointer", 3, "routerLink"], [1, "relative"], [1, "w-full", "h-48", "object-cover", "group-hover:scale-105", "transition-transform", "duration-300", 3, "src", "alt"], [1, "absolute", "top-2", "left-2", "badge", 3, "ngClass"], [1, "absolute", "top-2", "right-2", "bg-white/90", "backdrop-blur-sm", "text-gray-800", "text-xs", "font-bold", "px-2", "py-1", "rounded-lg"], [1, "p-3"], [1, "font-semibold", "text-sm", "text-gray-900", "truncate"], [1, "text-xs", "text-gray-500", "mb-2"], [1, "flex", "items-center", "gap-1", "text-xs", "text-gray-400"], ["fill", "none", "viewBox", "0 0 24 24", "stroke", "currentColor", 1, "h-3", "w-3"], ["stroke-linecap", "round", "stroke-linejoin", "round", "stroke-width", "2", "d", "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"], [1, "mt-3", "border-t", "border-gray-50", "pt-3", "flex", "items-center", "justify-between"], [1, "text-primary", "font-bold", "text-sm"], [1, "bg-primary/10", "hover:bg-primary", "text-primary", "hover:text-white", "text-xs", "font-medium", "px-3", "py-1.5", "rounded-full", "transition-colors"]], template: function BookCardComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "a", 0)(1, "div", 1);
        \u0275\u0275element(2, "img", 2);
        \u0275\u0275elementStart(3, "span", 3);
        \u0275\u0275text(4);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "span", 4);
        \u0275\u0275text(6);
        \u0275\u0275pipe(7, "number");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(8, "div", 5)(9, "h3", 6);
        \u0275\u0275text(10);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(11, "p", 7);
        \u0275\u0275text(12);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(13, "div", 8);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(14, "svg", 9);
        \u0275\u0275element(15, "path", 10);
        \u0275\u0275elementEnd();
        \u0275\u0275text(16);
        \u0275\u0275elementEnd();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(17, "div", 11)(18, "span", 12);
        \u0275\u0275text(19);
        \u0275\u0275pipe(20, "number");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(21, "button", 13);
        \u0275\u0275text(22, " Contacter ");
        \u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        \u0275\u0275property("routerLink", \u0275\u0275pureFunction1(14, _c0, ctx.book.id));
        \u0275\u0275advance(2);
        \u0275\u0275property("src", ctx.primaryImage, \u0275\u0275sanitizeUrl)("alt", ctx.book.title);
        \u0275\u0275advance();
        \u0275\u0275property("ngClass", ctx.conditionClass);
        \u0275\u0275advance();
        \u0275\u0275textInterpolate(ctx.conditionLabel);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(7, 10, ctx.book.price), " FCFA ");
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate(ctx.book.title);
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1("par ", ctx.book.author, "");
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate1(" ", ctx.book.seller.address || "Non pr\xE9cis\xE9", " ");
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate1("", \u0275\u0275pipeBind1(20, 12, ctx.book.price), " FCFA");
      }
    }, dependencies: [RouterLink, CommonModule, NgClass, DecimalPipe], encapsulation: 2 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(BookCardComponent, { className: "BookCardComponent", filePath: "src/app/components/book-card/book-card.component.ts", lineNumber: 24 });
})();

export {
  BookCardComponent
};
//# sourceMappingURL=chunk-2CGVFZCM.js.map
