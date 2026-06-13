import {
  RouterOutlet,
  bootstrapApplication,
  provideRouter,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵdefineComponent,
  ɵɵelement
} from "./chunk-DPFWTYZM.js";

// src/app/app.routes.ts
var routes = [
  { path: "", loadComponent: () => import("./chunk-QFQW5L3M.js").then((m) => m.HomeComponent) },
  { path: "catalogue", loadComponent: () => import("./chunk-ZKMOULOE.js").then((m) => m.CatalogueComponent) },
  { path: "login", loadComponent: () => import("./chunk-QCMM4WJP.js").then((m) => m.LoginComponent) },
  { path: "books/:id", loadComponent: () => import("./chunk-WD3JNSRQ.js").then((m) => m.BookDetailComponent) },
  { path: "**", redirectTo: "" }
];

// src/app/app.config.ts
var appConfig = {
  providers: [provideRouter(routes)]
};

// src/app/app.component.ts
var AppComponent = class _AppComponent {
  constructor() {
    this.title = "frontend";
  }
  static {
    this.\u0275fac = function AppComponent_Factory(t) {
      return new (t || _AppComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _AppComponent, selectors: [["app-root"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 1, vars: 0, template: function AppComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275element(0, "router-outlet");
      }
    }, dependencies: [RouterOutlet] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(AppComponent, { className: "AppComponent", filePath: "src/app/app.component.ts", lineNumber: 11 });
})();

// src/main.ts
bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
//# sourceMappingURL=main.js.map
